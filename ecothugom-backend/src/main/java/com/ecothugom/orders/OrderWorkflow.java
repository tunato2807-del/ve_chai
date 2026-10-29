package com.ecothugom.orders;

import java.time.*;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Shared write boundary: every operation must already be inside a transaction. */
@Component
@Transactional(propagation=Propagation.MANDATORY)
public class OrderWorkflow {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public OrderWorkflow(JdbcTemplate jdbc,Clock clock) { this.jdbc=jdbc;this.clock=clock; }
    public State collector(long id,long actor) { return scoped(id,actor,true); }
    public State customer(long id,long actor) { return scoped(id,actor,false); }
    public State admin(long id) {return scoped(id,null,false);}
    private State scoped(long id,Long actor,boolean collector) {
        String column=collector?"collector_id":"seller_user_id";
        Object[] args=actor==null ? new Object[]{id} : new Object[]{id,actor};
        var rows=jdbc.query("SELECT status,version,collector_id FROM dbo.collection_orders WHERE order_id=?"+(actor==null ? "" : " AND "+column+"=?"),
            (rs,n)->new State(id,OrderStatus.valueOf(rs.getString("status")),rs.getInt("version"),rs.getObject("collector_id",Long.class)),args);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn thu gom.");
        return rows.getFirst();
    }
    public void expect(State state,OrderStatus status,int version) {
        if(state.status()!=status || state.version()!=version) throw conflict();
    }
    /** CAS acquires the order row write lock until commit, before child data changes. */
    public void change(State before,OrderStatus next) {
        int changed=jdbc.update("UPDATE dbo.collection_orders SET status=?,version=version+1,updated_at=? WHERE order_id=? AND status=? AND version=?",
            next.name(),now(),before.id(),before.status().name(),before.version());
        if(changed!=1) throw conflict();
    }
    public void audit(State before,OrderStatus next,long actor,String reason) {
        audit(before,next,actor,reason,before.collectorId());
    }
    public void audit(State before,OrderStatus next,long actor,String reason,Long nextCollector) {
        jdbc.update("INSERT INTO dbo.order_status_logs(order_id,old_status,new_status,changed_by,old_collector_id,new_collector_id,reason,changed_at) VALUES(?,?,?,?,?,?,?,?)",
            before.id(),before.status().name(),next.name(),actor,before.collectorId(),nextCollector,reason,now());
    }
    public LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS); }
    public static ResponseStatusException conflict() { return new ResponseStatusException(HttpStatus.CONFLICT,"Đơn hoặc báo giá đã thay đổi, hoặc trạng thái không phù hợp. Vui lòng tải lại."); }
    public record State(long id,OrderStatus status,int version,Long collectorId) {}
}
