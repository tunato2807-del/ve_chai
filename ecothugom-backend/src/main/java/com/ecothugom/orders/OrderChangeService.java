package com.ecothugom.orders;

import com.ecothugom.common.api.PageResponse;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional(readOnly=true)
public class OrderChangeService {
    private static final Set<OrderStatus> BEFORE_TRIP=Set.of(OrderStatus.PENDING,OrderStatus.CONFIRMED,OrderStatus.ASSIGNED);
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final CollectionOrderReader reader;
    private final CollectorSchedule schedule;
    public OrderChangeService(JdbcTemplate jdbc,OrderWorkflow workflow,CollectionOrderReader reader,CollectorSchedule schedule) {this.jdbc=jdbc;this.workflow=workflow;this.reader=reader;this.schedule=schedule;}

    @Transactional
    public Change cancel(long actor,long id,OrderChangeRequests.Cancel request) {
        // Every customer cancellation is a request; only ADMIN process(..., true) cancels the order.
        return create(actor,id,new OrderChangeRequests.Create(request.version(),OrderChangeRequests.Type.CANCEL,request.reason(),null,null));
    }
    @Transactional
    public CollectionOrderResponse reschedule(long actor,long id,OrderChangeRequests.Reschedule request) {
        var before=workflow.customer(id,actor);expect(before,request.version());
        if(!BEFORE_TRIP.contains(before.status())) throw OrderWorkflow.conflict();
        var window=PickupWindow.of(request.pickupStart(),request.pickupEnd(),workflow.now().toInstant(ZoneOffset.UTC));
        reschedule(before,actor,request.reason(),window,0);
        return reader.forCustomer(actor,id);
    }
    @Transactional
    public CollectionOrderResponse reassign(long actor,long id,OrderChangeRequests.Reassign request) {
        var before=workflow.admin(id);expect(before,request.version());
        if(before.status()!=OrderStatus.ASSIGNED || Objects.equals(before.collectorId(),request.collectorId())) throw OrderWorkflow.conflict();
        var order=reader.forAdmin(id);
        schedule.lockAndCheck(request.collectorId(),local(order.pickupStart()),local(order.pickupEnd()),id);
        workflow.change(before,OrderStatus.ASSIGNED);
        jdbc.update("UPDATE dbo.collection_orders SET collector_id=? WHERE order_id=?",request.collectorId(),id);
        workflow.audit(before,OrderStatus.ASSIGNED,actor,request.reason(),request.collectorId());
        return reader.forAdmin(id);
    }
    @Transactional
    public Change create(long actor,long id,OrderChangeRequests.Create request) {
        var before=workflow.customer(id,actor);expect(before,request.version());
        if(terminal(before.status()) || request.requestType()==OrderChangeRequests.Type.RESCHEDULE && !canReschedule(before.status())) throw OrderWorkflow.conflict();
        PickupWindow window=null;
        if(request.requestType()==OrderChangeRequests.Type.RESCHEDULE) window=PickupWindow.of(request.pickupStart(),request.pickupEnd(),workflow.now().toInstant(ZoneOffset.UTC));
        else if(request.pickupStart()!=null || request.pickupEnd()!=null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Yêu cầu CANCEL không nhận khung giờ mới.");
        if(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.order_change_requests WHERE order_id=? AND status='PENDING'",Integer.class,id)>0) throw OrderWorkflow.conflict();
        var order=reader.forCustomer(actor,id);var next=window;
        workflow.change(before,before.status());
        var key=new GeneratedKeyHolder();
        jdbc.update(connection->{
            var s=connection.prepareStatement("""
                INSERT INTO dbo.order_change_requests(order_id,requested_by,request_type,reason,old_pickup_start,old_pickup_end,new_pickup_start,new_pickup_end,status,version,created_at)
                VALUES(?,?,?,?,?,?,?,?,'PENDING',0,?)
                """,new String[]{"request_id"});
            s.setLong(1,id);s.setLong(2,actor);s.setString(3,request.requestType().name());s.setNString(4,request.reason());s.setObject(5,local(order.pickupStart()),Types.TIMESTAMP);s.setObject(6,local(order.pickupEnd()),Types.TIMESTAMP);
            s.setObject(7,next==null ? null : next.start(),Types.TIMESTAMP);s.setObject(8,next==null ? null : next.end(),Types.TIMESTAMP);s.setObject(9,workflow.now(),Types.TIMESTAMP);return s;
        },key);
        workflow.audit(before,before.status(),actor,"Khách gửi yêu cầu "+request.requestType().name()+".");
        return one(Objects.requireNonNull(key.getKey()).longValue());
    }
    public PageResponse<Change> customerList(long actor,long id,int page,int size) {
        workflow.customer(id,actor);return list("r.order_id=?",new ArrayList<>(List.of(id)),page,size);
    }
    public PageResponse<Change> adminList(OrderChangeRequests.Status status,int page,int size) {
        return list(status==null ? "1=1" : "r.status=?",new ArrayList<>(status==null ? List.of() : List.of(status.name())),page,size);
    }
    @Transactional
    public Change process(long actor,long requestId,OrderChangeRequests.Review request,boolean approve) {
        var change=pending(requestId,request.requestVersion());
        var before=workflow.admin(change.orderId());expect(before,request.version());
        if(approve) {
            if(terminal(before.status())) throw OrderWorkflow.conflict();
            if(change.requestType().equals("CANCEL")) cancel(before,actor,change.reason(),requestId);
            else {
                if(!canReschedule(before.status())) throw OrderWorkflow.conflict();
                var window=PickupWindow.of(change.newPickupStart().atOffset(ZoneOffset.UTC),change.newPickupEnd().atOffset(ZoneOffset.UTC),workflow.now().toInstant(ZoneOffset.UTC));
                reschedule(before,actor,change.reason(),window,requestId);
            }
        } else {workflow.change(before,before.status());workflow.audit(before,before.status(),actor,"Admin từ chối yêu cầu thay đổi lịch.");}
        finish(change,actor,approve ? "APPROVED" : "REJECTED",request.responseNote());
        return one(requestId);
    }
    @Transactional
    public Change withdraw(long actor,long id,long requestId,OrderChangeRequests.Review request) {
        var before=workflow.customer(id,actor);expect(before,request.version());
        var change=one(requestId);
        if(change.orderId()!=id || change.requestedBy()!=actor) throw missing();
        if(!change.status().equals("PENDING") || change.version()!=request.requestVersion()) throw OrderWorkflow.conflict();
        workflow.change(before,before.status());finish(change,actor,"WITHDRAWN",request.responseNote());
        workflow.audit(before,before.status(),actor,"Khách rút yêu cầu thay đổi lịch.");return one(requestId);
    }
    private void cancel(OrderWorkflow.State before,long actor,String reason,long except) {
        workflow.change(before,OrderStatus.CANCELLED);
        jdbc.update("UPDATE dbo.collection_orders SET cancelled_at=?,cancellation_reason=? WHERE order_id=?",workflow.now(),reason,before.id());
        withdrawOthers(before.id(),actor,except);
        workflow.audit(before,OrderStatus.CANCELLED,actor,reason);
    }
    private void reschedule(OrderWorkflow.State before,long actor,String reason,PickupWindow window,long except) {
        boolean departed=before.status()==OrderStatus.EN_ROUTE;
        if(before.collectorId()!=null && !departed) schedule.lockAndCheck(before.collectorId(),window.start(),window.end(),before.id());
        var next=departed ? OrderStatus.CONFIRMED : before.status();var collector=departed ? null : before.collectorId();
        workflow.change(before,next);
        jdbc.update("UPDATE dbo.collection_orders SET pickup_start=?,pickup_end=?,collector_id=? WHERE order_id=?",window.start(),window.end(),collector,before.id());
        withdrawOthers(before.id(),actor,except);workflow.audit(before,next,actor,reason,collector);
    }
    private void withdrawOthers(long id,long actor,long except) {
        jdbc.update("UPDATE dbo.order_change_requests SET status='WITHDRAWN',processed_by=?,processed_at=?,version=version+1,response_note=N'Đơn đã được xử lý bằng thao tác khác.' WHERE order_id=? AND status='PENDING' AND request_id<>?",actor,workflow.now(),id,except);
    }
    private void finish(Change change,long actor,String status,String note) {
        if(jdbc.update("UPDATE dbo.order_change_requests SET status=?,processed_by=?,processed_at=?,response_note=?,version=version+1 WHERE request_id=? AND status='PENDING' AND version=?",status,actor,workflow.now(),note,change.id(),change.version())!=1) throw OrderWorkflow.conflict();
    }
    private Change pending(long id,int version) {
        var change=one(id);if(!change.status().equals("PENDING") || change.version()!=version) throw OrderWorkflow.conflict();return change;
    }
    private Change one(long id) {
        var rows=jdbc.query("SELECT r.*,o.status AS order_status,o.version AS order_version FROM dbo.order_change_requests r JOIN dbo.collection_orders o ON o.order_id=r.order_id WHERE r.request_id=?",this::map,id);
        if(rows.isEmpty()) throw missing();return rows.getFirst();
    }
    private PageResponse<Change> list(String predicate,ArrayList<Object> args,int page,int size) {
        long total=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.order_change_requests r WHERE "+predicate,Long.class,args.toArray());
        args.add((long)page*size);args.add(size);
        var rows=jdbc.query("SELECT r.*,o.status AS order_status,o.version AS order_version FROM dbo.order_change_requests r JOIN dbo.collection_orders o ON o.order_id=r.order_id WHERE "+predicate+" ORDER BY r.request_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",this::map,args.toArray());
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    private Change map(ResultSet r,int n) throws SQLException {
        return new Change(r.getLong("request_id"),r.getLong("order_id"),r.getLong("requested_by"),r.getString("request_type"),r.getString("reason"),instant(r,"old_pickup_start"),instant(r,"old_pickup_end"),instant(r,"new_pickup_start"),instant(r,"new_pickup_end"),r.getString("status"),r.getObject("processed_by",Long.class),instant(r,"processed_at"),r.getString("response_note"),r.getInt("version"),instant(r,"created_at"),r.getString("order_status"),r.getInt("order_version"));
    }
    private Instant instant(ResultSet r,String column) throws SQLException {var time=r.getObject(column,LocalDateTime.class);return time==null ? null : time.toInstant(ZoneOffset.UTC);}
    private LocalDateTime local(Instant value) {return LocalDateTime.ofInstant(value,ZoneOffset.UTC);}
    private void expect(OrderWorkflow.State before,int version) {if(before.version()!=version) throw OrderWorkflow.conflict();}
    private boolean terminal(OrderStatus status) {return Set.of(OrderStatus.COMPLETED,OrderStatus.CANCELLED,OrderStatus.DISPUTED).contains(status);}
    private boolean canReschedule(OrderStatus status) {return BEFORE_TRIP.contains(status) || status==OrderStatus.EN_ROUTE;}
    private static ResponseStatusException missing() {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy yêu cầu thay đổi lịch.");}
    public record Change(long id,long orderId,long requestedBy,String requestType,String reason,Instant oldPickupStart,Instant oldPickupEnd,Instant newPickupStart,Instant newPickupEnd,String status,Long processedBy,Instant processedAt,String responseNote,int version,Instant createdAt,String orderStatus,int orderVersion) {}
}
