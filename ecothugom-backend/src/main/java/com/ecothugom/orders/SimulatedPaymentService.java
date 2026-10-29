package com.ecothugom.orders;

import com.ecothugom.auth.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class SimulatedPaymentService {
    private static final String SELECT_PAYMENT="""
        SELECT p.*,o.status AS order_status,o.version AS order_version,o.completed_at
        FROM dbo.payments p JOIN dbo.collection_orders o ON o.order_id=p.order_id
        """;
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final CollectionOrderReader orders;
    private final QuoteReader quotes;
    private final AccountService accounts;
    public SimulatedPaymentService(JdbcTemplate jdbc,OrderWorkflow workflow,CollectionOrderReader orders,QuoteReader quotes,AccountService accounts) {
        this.jdbc=jdbc;this.workflow=workflow;this.orders=orders;this.quotes=quotes;this.accounts=accounts;
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public List<PaymentResponse> list(SessionPrincipal actor,long id) {
        switch(actor.role()) {
            case CUSTOMER -> orders.forCustomer(actor.id(),id);
            case COLLECTOR -> orders.forCollector(actor.id(),id);
            case ADMIN -> orders.forAdmin(id);
        }
        return jdbc.query(SELECT_PAYMENT+" WHERE p.order_id=? ORDER BY p.created_at DESC,p.payment_id DESC OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY",
            (rs,n)->payment(rs),id);
    }

    @Transactional
    public PaymentResponse simulate(long actor,long id,SimulatedPaymentRequest request) {
        accounts.lockActiveCollector(actor);
        var before=workflow.collector(id,actor);
        workflow.expect(before,OrderStatus.AWAITING_PAYMENT,request.version());
        var quote=quotes.one(id,request.quoteId());
        if(!quote.current() || !quote.status().equals("ACCEPTED")) throw OrderWorkflow.conflict();
        var now=workflow.now();
        // Lock the order via CAS before inserting children. All three writes commit or roll back together.
        int changed=jdbc.update("""
            UPDATE dbo.collection_orders SET status='COMPLETED',version=version+1,updated_at=?,completed_at=?
            WHERE order_id=? AND collector_id=? AND status='AWAITING_PAYMENT' AND version=?
            """,now,now,id,actor,request.version());
        if(changed!=1) throw OrderWorkflow.conflict();
        var key=new GeneratedKeyHolder();
        try {
            jdbc.update(connection->{
                var statement=connection.prepareStatement("""
                    INSERT INTO dbo.payments(order_id,quote_id,amount,method,status,request_key,paid_at,reference_code,recorded_by,created_at)
                    VALUES(?,?,?,?,'COMPLETED',?,?,?,?,?)
                    """,new String[]{"payment_id"});
                statement.setLong(1,id);statement.setLong(2,quote.id());statement.setBigDecimal(3,quote.totalAmount());statement.setString(4,request.method());
                // SQL Server converts the canonical GUID string; JDBC UUID objects are not portable across drivers.
                statement.setString(5,request.requestKey());statement.setObject(6,now,Types.TIMESTAMP);
                statement.setString(7,"SIM-"+UUID.randomUUID().toString().replace("-",""));statement.setLong(8,actor);statement.setObject(9,now,Types.TIMESTAMP);
                return statement;
            },key);
        } catch(DuplicateKeyException ex) {
            // Unique request_key and one-completed-payment-per-order constraints are the final race guard.
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Yêu cầu hoặc đơn đã có thanh toán. Vui lòng xem lại kết quả thanh toán.");
        }
        workflow.audit(before,OrderStatus.COMPLETED,actor,"Nhân viên ghi nhận thanh toán mô phỏng: "+request.method()+".");
        long paymentId=Objects.requireNonNull(key.getKey()).longValue();
        return jdbc.queryForObject(SELECT_PAYMENT+" WHERE p.payment_id=? AND p.order_id=?",(rs,n)->payment(rs),paymentId,id);
    }

    private PaymentResponse payment(ResultSet r) throws SQLException {
        return new PaymentResponse(r.getLong("payment_id"),r.getLong("order_id"),r.getLong("quote_id"),r.getBigDecimal("amount"),"VND",r.getString("method"),
            r.getString("status"),UUID.fromString(r.getString("request_key")).toString(),instant(r,"paid_at"),r.getString("reference_code"),r.getLong("recorded_by"),
            instant(r,"created_at"),r.getString("order_status"),r.getInt("order_version"),instant(r,"completed_at"));
    }
    private Instant instant(ResultSet r,String column) throws SQLException {
        var value=r.getObject(column,LocalDateTime.class);return value==null?null:value.toInstant(ZoneOffset.UTC);
    }
}
