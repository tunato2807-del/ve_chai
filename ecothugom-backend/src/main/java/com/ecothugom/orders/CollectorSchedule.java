package com.ecothugom.orders;

import com.ecothugom.auth.AccountService;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Component @Transactional(propagation=Propagation.MANDATORY)
public class CollectorSchedule {
    private final JdbcTemplate jdbc;
    private final AccountService accounts;
    public CollectorSchedule(JdbcTemplate jdbc,AccountService accounts) {this.jdbc=jdbc;this.accounts=accounts;}
    public void lockAndCheck(long collector,LocalDateTime start,LocalDateTime end,long excludedOrder) {
        accounts.lockActiveCollector(collector);
        long overlaps=jdbc.queryForObject("""
            SELECT COUNT(*) FROM dbo.collection_orders o
            WHERE o.collector_id=? AND o.order_id<>?
              AND (o.status IN('ASSIGNED','EN_ROUTE','ARRIVED','AWAITING_SELLER_APPROVAL','AWAITING_PAYMENT')
                OR (o.status='DISPUTED' AND EXISTS(SELECT 1 FROM dbo.disputes d WHERE d.order_id=o.order_id
                  AND d.status IN('OPEN','IN_REVIEW') AND d.previous_order_status IN('ASSIGNED','EN_ROUTE','ARRIVED','AWAITING_SELLER_APPROVAL','AWAITING_PAYMENT'))))
              AND o.pickup_start<? AND o.pickup_end>?
            """,Long.class,collector,excludedOrder,end,start);
        if(overlaps>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Nhân viên đã có lịch thu gom trùng khung giờ.");
    }
}
