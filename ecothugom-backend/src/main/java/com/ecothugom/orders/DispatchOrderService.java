package com.ecothugom.orders;

import com.ecothugom.common.api.PageResponse;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class DispatchOrderService {
    private final JdbcTemplate jdbc;
    private final CollectionOrderReader reader;
    private final Clock clock;
    private final CollectorSchedule schedule;
    public DispatchOrderService(JdbcTemplate jdbc,CollectionOrderReader reader,Clock clock,CollectorSchedule schedule) {
        this.jdbc = jdbc; this.reader = reader; this.clock = clock;
        this.schedule = schedule;
    }

    public PageResponse<Summary> list(OrderStatus status,int page,int size) {
        String filter = status == null ? "" : " WHERE status=?";
        var params = new ArrayList<Object>();
        if (status != null) params.add(status.name());
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM dbo.collection_orders" + filter,Long.class,params.toArray());
        params.add((long)page*size);
        params.add(size);
        var rows = jdbc.query("""
            SELECT order_id,code,status,collector_id,contact_name_snapshot,contact_phone_snapshot,address_snapshot,
                   pickup_start,pickup_end,created_at,version FROM dbo.collection_orders
            """ + filter + " ORDER BY created_at DESC,order_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
            (rs,n) -> new Summary(rs.getLong("order_id"),rs.getString("code"),rs.getString("status"),rs.getObject("collector_id",Long.class),
                rs.getString("contact_name_snapshot"),rs.getString("contact_phone_snapshot"),rs.getString("address_snapshot"),
                rs.getObject("pickup_start",LocalDateTime.class).toInstant(ZoneOffset.UTC),rs.getObject("pickup_end",LocalDateTime.class).toInstant(ZoneOffset.UTC),
                rs.getObject("created_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),rs.getInt("version")),params.toArray());
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }

    public CollectionOrderResponse detail(long id) { return reader.forAdmin(id); }

    @Transactional
    public CollectionOrderResponse confirm(long adminId,long id,DispatchRequests.Confirm request) {
        var before = state(id);
        expect(before,OrderStatus.PENDING,request.version());
        var now = now();
        int changed = jdbc.update("""
            UPDATE dbo.collection_orders SET status='CONFIRMED',version=version+1,updated_at=?
            WHERE order_id=? AND status='PENDING' AND collector_id IS NULL AND version=?
            """,now,id,request.version());
        if (changed != 1) throw conflict("Đơn đã thay đổi. Vui lòng tải lại trước khi xử lý.");
        audit(adminId,id,before,OrderStatus.CONFIRMED,null,request.reason() == null ? "Quản trị viên xác nhận lịch thu gom." : request.reason(),now);
        return reader.forAdmin(id);
    }

    @Transactional
    public CollectionOrderResponse assign(long adminId,long id,DispatchRequests.Assign request) {
        var before = state(id);
        expect(before,OrderStatus.CONFIRMED,request.version());
        schedule.lockAndCheck(request.collectorId(),before.pickupStart(),before.pickupEnd(),id);
        var now = now();
        int changed = jdbc.update("""
            UPDATE dbo.collection_orders SET status='ASSIGNED',collector_id=?,version=version+1,updated_at=?
            WHERE order_id=? AND status='CONFIRMED' AND collector_id IS NULL AND version=?
            """,request.collectorId(),now,id,request.version());
        if (changed != 1) throw conflict("Đơn đã thay đổi. Vui lòng tải lại trước khi xử lý.");
        audit(adminId,id,before,OrderStatus.ASSIGNED,request.collectorId(),
            request.reason() == null ? "Quản trị viên phân công nhân viên thu gom." : request.reason(),now);
        return reader.forAdmin(id);
    }

    private State state(long id) {
        var rows = jdbc.query("SELECT status,collector_id,version,pickup_start,pickup_end FROM dbo.collection_orders WHERE order_id=?",
            (rs,n) -> new State(OrderStatus.valueOf(rs.getString("status")),rs.getObject("collector_id",Long.class),rs.getInt("version"),
                rs.getObject("pickup_start",LocalDateTime.class),rs.getObject("pickup_end",LocalDateTime.class)),id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn thu gom.");
        return rows.getFirst();
    }

    private void expect(State state,OrderStatus required,int version) {
        if (state.status() != required || state.version() != version || state.collectorId() != null)
            throw conflict("Trạng thái hoặc phiên bản đơn không còn phù hợp. Vui lòng tải lại đơn.");
    }

    private void audit(long adminId,long id,State before,OrderStatus next,Long nextCollector,String reason,LocalDateTime now) {
        jdbc.update("""
            INSERT INTO dbo.order_status_logs(order_id,old_status,new_status,changed_by,old_collector_id,new_collector_id,reason,changed_at)
            VALUES (?,?,?,?,?,?,?,?)
            """,id,before.status().name(),next.name(),adminId,before.collectorId(),nextCollector,reason,now);
    }
    private LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS); }
    private ResponseStatusException conflict(String detail) { return new ResponseStatusException(HttpStatus.CONFLICT,detail); }
    private record State(OrderStatus status,Long collectorId,int version,LocalDateTime pickupStart,LocalDateTime pickupEnd) {}
    public record Summary(long id,String code,String status,Long collectorId,String contactName,String contactPhone,
                          String address,Instant pickupStart,Instant pickupEnd,Instant createdAt,int version) {}
}
