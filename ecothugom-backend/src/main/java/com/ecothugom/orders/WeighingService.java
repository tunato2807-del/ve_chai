package com.ecothugom.orders;

import com.ecothugom.auth.AccountService;
import com.ecothugom.auth.SessionPrincipal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class WeighingService {
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final AccountService accounts;
    private final OrderReadAccess access;
    public WeighingService(JdbcTemplate jdbc,OrderWorkflow workflow,AccountService accounts,OrderReadAccess access) {
        this.jdbc=jdbc;this.workflow=workflow;this.accounts=accounts;this.access=access;
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Result list(long actor,long id) {
        var order=workflow.collector(id,actor);
        return rows(id,order.version());
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Result visible(SessionPrincipal actor,long id) {
        var order=access.require(actor,id);return rows(id,order.version());
    }
    private Result rows(long id,int version) {
        var records=jdbc.query("""
            SELECT w.* FROM dbo.weighing_records w JOIN dbo.collection_items i ON i.item_id=w.item_id
            WHERE i.order_id=? ORDER BY w.weighing_id
            """,WeighingService::mapRecord,id);
        return new Result(id,version,records);
    }
    static Record mapRecord(ResultSet rs,int n) throws SQLException {
        return new Record(rs.getLong("weighing_id"),rs.getLong("item_id"),rs.getBigDecimal("gross_weight"),rs.getBigDecimal("tare_weight"),rs.getBigDecimal("net_weight"),rs.getLong("created_by"),rs.getObject("created_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),rs.getObject("correction_of",Long.class),rs.getString("correction_reason"),rs.getString("photo_url"));
    }
    @Transactional
    public Result record(long actor,long id,WeighingRequest request) {
        accounts.lockActiveCollector(actor);
        var order=workflow.collector(id,actor);
        workflow.expect(order,OrderStatus.ARRIVED,request.version());
        var distinct=new HashSet<Long>();
        for(var item:request.items()) {
            if(!distinct.add(item.itemId()) || item.grossWeight().compareTo(item.tareWeight())<=0)
                throw invalid("Mỗi mặt hàng chỉ cân một lần trong lô; khối lượng tổng phải lớn hơn bì.");
        }
        workflow.change(order,OrderStatus.ARRIVED);
        for(var item:request.items()) {
            if(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.collection_items WHERE order_id=? AND item_id=?",Integer.class,id,item.itemId())!=1)
                throw invalid("Có mặt hàng không thuộc đơn thu gom.");
            Long latest=jdbc.queryForObject("SELECT MAX(weighing_id) FROM dbo.weighing_records WHERE item_id=?",Long.class,item.itemId());
            if(!Objects.equals(latest,item.correctionOf())) throw OrderWorkflow.conflict();
            if((latest==null && item.correctionReason()!=null) || (latest!=null && item.correctionReason()==null))
                throw invalid("Phiếu điều chỉnh phải tham chiếu lần cân mới nhất và có lý do.");
            jdbc.update("""
                INSERT INTO dbo.weighing_records(item_id,gross_weight,tare_weight,created_by,created_at,correction_of,correction_reason)
                VALUES(?,?,?,?,?,?,?)
                """,item.itemId(),item.grossWeight(),item.tareWeight(),actor,workflow.now(),item.correctionOf(),item.correctionReason());
        }
        workflow.audit(order,OrderStatus.ARRIVED,actor,"Nhân viên ghi kết quả cân thực tế ("+request.items().size()+" mặt hàng).");
        return list(actor,id);
    }
    private ResponseStatusException invalid(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
    public record Result(long orderId,int orderVersion,List<Record> records) {}
    public record Record(long id,long itemId,BigDecimal grossWeight,BigDecimal tareWeight,BigDecimal netWeight,
                         long createdBy,Instant createdAt,Long correctionOf,String correctionReason,String photoUrl) {}
}
