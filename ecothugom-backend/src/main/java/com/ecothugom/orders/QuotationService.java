package com.ecothugom.orders;

import com.ecothugom.auth.*;
import com.ecothugom.catalog.*;
import java.math.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class QuotationService {
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final CollectionOrderReader orders;
    private final QuoteReader reader;
    private final CurrentPriceService prices;
    private final AccountService accounts;
    public QuotationService(JdbcTemplate jdbc,OrderWorkflow workflow,CollectionOrderReader orders,QuoteReader reader,CurrentPriceService prices,AccountService accounts) {
        this.jdbc=jdbc;this.workflow=workflow;this.orders=orders;this.reader=reader;this.prices=prices;this.accounts=accounts;
    }
    // Retain the order read lock while reading headers/items so a new quote cannot appear halfway through.
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public List<QuoteResponse> list(SessionPrincipal actor,long id) {
        switch(actor.role()) {
            case CUSTOMER -> orders.forCustomer(actor.id(),id);
            case COLLECTOR -> orders.forCollector(actor.id(),id);
            case ADMIN -> orders.forAdmin(id);
        }
        return reader.list(id);
    }
    @Transactional
    public QuoteResponse send(long actor,long id,QuoteRequests.Send request) {
        accounts.lockActiveCollector(actor);
        var order=workflow.collector(id,actor);
        if(order.version()!=request.version()) throw OrderWorkflow.conflict();
        var now=workflow.now();
        if(order.status()==OrderStatus.AWAITING_SELLER_APPROVAL) {
            int expired=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.order_quotes WHERE order_id=? AND is_current=1 AND status='SENT' AND valid_until<=?",Integer.class,id,now);
            if(expired!=1) throw OrderWorkflow.conflict();
        } else if(order.status()!=OrderStatus.ARRIVED) throw OrderWorkflow.conflict();
        workflow.change(order,OrderStatus.AWAITING_SELLER_APPROVAL);
        var weights=jdbc.query("""
            SELECT i.item_id,i.material_id,w.weighing_id,w.net_weight FROM dbo.collection_items i
            LEFT JOIN dbo.weighing_records w ON w.item_id=i.item_id AND w.weighing_id=(SELECT MAX(w2.weighing_id) FROM dbo.weighing_records w2 WHERE w2.item_id=i.item_id)
            WHERE i.order_id=? ORDER BY i.item_id
            """,(rs,n)->new Weight(rs.getLong("item_id"),rs.getInt("material_id"),rs.getObject("weighing_id",Long.class),rs.getBigDecimal("net_weight")),id);
        if(weights.isEmpty() || weights.stream().anyMatch(w->w.weighingId()==null || w.net().signum()<=0)) throw unavailable("Cần cân đủ mọi mặt hàng trước khi gửi báo giá.");
        var current=prices.forMaterials(weights.stream().map(Weight::materialId).toList(),now.toInstant(ZoneOffset.UTC));
        BigDecimal total=BigDecimal.ZERO;
        for(var weight:weights) {
            var price=current.get(weight.materialId());
            if(price==null || price.unitPrice()==null) throw unavailable("Có vật liệu chưa có giá đã duyệt hiện hành hoặc ngừng thu mua.");
            var line=weight.net().multiply(price.unitPrice()).setScale(0,RoundingMode.HALF_UP);
            if(line.signum()<=0 || line.precision()>18) throw unavailable("Thành tiền mặt hàng nằm ngoài giới hạn cho phép.");
            total=total.add(line);
        }
        if(total.precision()>18) throw unavailable("Tổng báo giá vượt giới hạn cho phép.");
        // Keep rejected responses intact; only an unanswered expired quote becomes SUPERSEDED.
        jdbc.update("UPDATE dbo.order_quotes SET is_current=0,status=CASE WHEN status='SENT' THEN 'SUPERSEDED' ELSE status END,version=version+1 WHERE order_id=? AND is_current=1 AND status IN('SENT','REJECTED')",id);
        int number=jdbc.queryForObject("SELECT COALESCE(MAX(version_number),0)+1 FROM dbo.order_quotes WHERE order_id=?",Integer.class,id);
        long quoteId=insertQuote(id,number,total,actor,now);
        for(var weight:weights) {
            var price=current.get(weight.materialId());
            jdbc.update("""
                INSERT INTO dbo.quote_items(quote_id,order_id,item_id,weighing_id,material_id,price_rule_id,
                    material_name_snapshot,grade_snapshot,unit_snapshot,actual_qty,unit_price_snapshot)
                VALUES(?,?,?,?,?,?,?,?,?,?,?)
                """,quoteId,id,weight.itemId(),weight.weighingId(),weight.materialId(),price.priceRuleId(),price.materialName(),price.grade(),price.unit(),weight.net(),price.unitPrice());
        }
        workflow.audit(order,OrderStatus.AWAITING_SELLER_APPROVAL,actor,"Nhân viên gửi báo giá sau cân thực tế, lần "+number+".");
        return reader.one(id,quoteId);
    }
    private long insertQuote(long id,int number,BigDecimal total,long actor,LocalDateTime now) {
        var key=new GeneratedKeyHolder();
        jdbc.update(connection->{
            var statement=connection.prepareStatement("""
                INSERT INTO dbo.order_quotes(order_id,version_number,status,is_current,total_amount,valid_until,created_by,created_at,sent_at,version)
                VALUES(?,?,'SENT',1,?,?,?,?,?,0)
                """,new String[]{"quote_id"});
            statement.setLong(1,id);statement.setInt(2,number);statement.setBigDecimal(3,total);
            statement.setObject(4,now.plusHours(24),Types.TIMESTAMP);statement.setLong(5,actor);
            statement.setObject(6,now,Types.TIMESTAMP);statement.setObject(7,now,Types.TIMESTAMP);return statement;
        },key);
        return Objects.requireNonNull(key.getKey()).longValue();
    }
    private ResponseStatusException unavailable(String message) {return new ResponseStatusException(HttpStatus.CONFLICT,message);}
    private record Weight(long itemId,int materialId,Long weighingId,BigDecimal net) {}
}
