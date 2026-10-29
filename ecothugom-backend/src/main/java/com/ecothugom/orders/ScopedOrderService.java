package com.ecothugom.orders;

import com.ecothugom.common.api.PageResponse;
import java.time.LocalDateTime;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ScopedOrderService {
    private final JdbcTemplate jdbc;
    public ScopedOrderService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public PageResponse<OrderSummary> forCustomer(long userId, int page, int size) {
        return list("seller_user_id",userId,page,size);
    }

    public PageResponse<OrderSummary> forCollector(long userId, int page, int size) {
        return list("collector_id",userId,page,size);
    }

    // Column is selected by these two server-side methods only; every user value is bound.
    private PageResponse<OrderSummary> list(String column, long id, int page, int size) {
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM dbo.collection_orders WHERE " + column + "=?",Long.class,id);
        var rows = jdbc.query("SELECT order_id,code,status,pickup_start,pickup_end,created_at FROM dbo.collection_orders WHERE " + column
            + "=? ORDER BY created_at DESC,order_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
            (rs,n) -> new OrderSummary(rs.getLong("order_id"),rs.getString("code"),rs.getString("status"),
                rs.getObject("pickup_start",LocalDateTime.class),rs.getObject("pickup_end",LocalDateTime.class),rs.getObject("created_at",LocalDateTime.class)),
            id,(long)page*size,size);
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }

    public record OrderSummary(long id,String code,String status,LocalDateTime pickupStart,LocalDateTime pickupEnd,LocalDateTime createdAt) {}
}
