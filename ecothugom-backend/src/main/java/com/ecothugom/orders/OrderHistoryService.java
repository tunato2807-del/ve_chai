package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import java.time.*;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class OrderHistoryService {
    private final OrderReadAccess access;
    private final JdbcTemplate jdbc;
    private final QuoteReader quotes;
    private final SimulatedPaymentService payments;
    public OrderHistoryService(OrderReadAccess access,JdbcTemplate jdbc,QuoteReader quotes,SimulatedPaymentService payments) {this.access=access;this.jdbc=jdbc;this.quotes=quotes;this.payments=payments;}
    public PageResponse<Event> timeline(SessionPrincipal actor,long id,int page,int size) {
        access.require(actor,id);
        long total=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.order_status_logs WHERE order_id=?",Long.class,id);
        var rows=jdbc.query("""
            SELECT l.*,u.full_name FROM dbo.order_status_logs l JOIN dbo.users u ON u.user_id=l.changed_by
            WHERE l.order_id=? ORDER BY l.log_id OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """,(r,n)->new Event(r.getLong("log_id"),r.getString("old_status"),r.getString("new_status"),r.getLong("changed_by"),r.getString("full_name"),r.getObject("old_collector_id",Long.class),r.getObject("new_collector_id",Long.class),r.getString("reason"),r.getObject("changed_at",LocalDateTime.class).toInstant(ZoneOffset.UTC)),id,(long)page*size,size);
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    public Receipt receipt(SessionPrincipal actor,long id) {
        var order=access.require(actor,id);
        var payment=payments.list(actor,id).stream().filter(p->p.status().equals("COMPLETED")).findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,"Đơn chưa có thanh toán hoàn tất để lập biên nhận."));
        var quote=quotes.one(id,payment.quoteId());
        var records=jdbc.query("SELECT w.* FROM dbo.weighing_records w JOIN dbo.quote_items i ON i.weighing_id=w.weighing_id WHERE i.order_id=? AND i.quote_id=? ORDER BY i.quote_item_id",WeighingService::mapRecord,id,quote.id());
        return new Receipt(order,quote,payment,records);
    }
    public record Event(long id,String oldStatus,String newStatus,long changedBy,String changedByName,Long oldCollectorId,Long newCollectorId,String reason,Instant changedAt) {}
    public record Receipt(CollectionOrderResponse order,QuoteResponse quote,PaymentResponse payment,List<WeighingService.Record> weighings) {}
}
