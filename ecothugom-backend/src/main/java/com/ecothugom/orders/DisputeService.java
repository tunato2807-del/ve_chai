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
public class DisputeService {
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    public DisputeService(JdbcTemplate jdbc,OrderWorkflow workflow) {this.jdbc=jdbc;this.workflow=workflow;}
    @Transactional
    public Dispute open(long actor,long id,DisputeRequests.Open request) {
        var before=workflow.customer(id,actor);
        if(before.version()!=request.version() || !Set.of(OrderStatus.EN_ROUTE,OrderStatus.ARRIVED,OrderStatus.AWAITING_SELLER_APPROVAL,OrderStatus.AWAITING_PAYMENT,OrderStatus.COMPLETED,OrderStatus.CANCELLED).contains(before.status())) throw OrderWorkflow.conflict();
        if(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.disputes WHERE order_id=? AND status IN('OPEN','IN_REVIEW')",Integer.class,id)>0) throw OrderWorkflow.conflict();
        if(request.evidenceUrl()!=null) validateEvidence(id,request.evidenceUrl());
        workflow.change(before,OrderStatus.DISPUTED);
        var key=new GeneratedKeyHolder();
        jdbc.update(connection->{
            var s=connection.prepareStatement("INSERT INTO dbo.disputes(order_id,opened_by,reason,evidence_url,previous_order_status,status,created_at) VALUES(?,?,?,?,?,'OPEN',?)",new String[]{"dispute_id"});
            s.setLong(1,id);s.setLong(2,actor);s.setNString(3,request.reason());s.setNString(4,request.evidenceUrl());s.setString(5,before.status().name());s.setObject(6,workflow.now(),Types.TIMESTAMP);return s;
        },key);
        long dispute=Objects.requireNonNull(key.getKey()).longValue();
        workflow.audit(before,OrderStatus.DISPUTED,actor,"Khách mở khiếu nại #"+dispute+".");return detail(dispute);
    }
    public PageResponse<Dispute> customer(long actor,long id,int page,int size) {
        workflow.customer(id,actor);return list("d.order_id=?",new ArrayList<>(List.of(id)),page,size);
    }
    public PageResponse<Dispute> admin(DisputeRequests.Status status,int page,int size) {
        return list(status==null ? "1=1" : "d.status=?",new ArrayList<>(status==null ? List.of() : List.of(status.name())),page,size);
    }
    public Dispute detail(long id) {
        var rows=jdbc.query("SELECT d.*,o.status AS order_status,o.version AS order_version FROM dbo.disputes d JOIN dbo.collection_orders o ON o.order_id=d.order_id WHERE d.dispute_id=?",this::map,id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy khiếu nại.");return rows.getFirst();
    }
    @Transactional
    public Dispute review(long actor,long id,DisputeRequests.Review request) {
        var dispute=detail(id);var before=workflow.admin(dispute.orderId());workflow.expect(before,OrderStatus.DISPUTED,request.version());
        if(!dispute.status().equals("OPEN")) throw OrderWorkflow.conflict();
        workflow.change(before,OrderStatus.DISPUTED);
        if(jdbc.update("UPDATE dbo.disputes SET status='IN_REVIEW' WHERE dispute_id=? AND status='OPEN'",id)!=1) throw OrderWorkflow.conflict();
        workflow.audit(before,OrderStatus.DISPUTED,actor,"Admin tiếp nhận khiếu nại #"+id+".");return detail(id);
    }
    @Transactional
    public Dispute close(long actor,long id,DisputeRequests.Close request,boolean resolved) {
        var dispute=detail(id);var before=workflow.admin(dispute.orderId());workflow.expect(before,OrderStatus.DISPUTED,request.version());
        if(!Set.of("OPEN","IN_REVIEW").contains(dispute.status())) throw OrderWorkflow.conflict();
        var restored=OrderStatus.valueOf(dispute.previousOrderStatus());
        workflow.change(before,restored);
        if(jdbc.update("UPDATE dbo.disputes SET status=?,resolution=?,resolved_by=?,resolved_at=? WHERE dispute_id=? AND status IN('OPEN','IN_REVIEW')",resolved ? "RESOLVED" : "REJECTED",request.resolution(),actor,workflow.now(),id)!=1) throw OrderWorkflow.conflict();
        workflow.audit(before,restored,actor,"Admin "+(resolved ? "kết luận" : "từ chối")+" khiếu nại #"+id+".");return detail(id);
    }
    private void validateEvidence(long id,String url) {
        if(!url.matches("/api/evidence/[a-f0-9]{32}\\.(png|jpg)")) throw invalidEvidence();
        long matches=jdbc.queryForObject("""
            SELECT (SELECT COUNT(*) FROM dbo.collection_items WHERE order_id=? AND photo_url=?) +
                (SELECT COUNT(*) FROM dbo.weighing_records w JOIN dbo.collection_items i ON i.item_id=w.item_id WHERE i.order_id=? AND w.photo_url=?)
            """,Long.class,id,url,id,url);
        if(matches==0) throw invalidEvidence();
    }
    private ResponseStatusException invalidEvidence() {return new ResponseStatusException(HttpStatus.BAD_REQUEST,"evidenceUrl phải là ảnh của đúng đơn đã được lưu qua API minh chứng.");}
    private PageResponse<Dispute> list(String predicate,ArrayList<Object> args,int page,int size) {
        long total=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.disputes d WHERE "+predicate,Long.class,args.toArray());
        args.add((long)page*size);args.add(size);
        var rows=jdbc.query("SELECT d.*,o.status AS order_status,o.version AS order_version FROM dbo.disputes d JOIN dbo.collection_orders o ON o.order_id=d.order_id WHERE "+predicate+" ORDER BY d.dispute_id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",this::map,args.toArray());
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    private Dispute map(ResultSet r,int n) throws SQLException {
        return new Dispute(r.getLong("dispute_id"),r.getLong("order_id"),r.getLong("opened_by"),r.getString("reason"),r.getString("evidence_url"),r.getString("previous_order_status"),r.getString("status"),r.getString("resolution"),r.getObject("resolved_by",Long.class),instant(r,"resolved_at"),instant(r,"created_at"),r.getString("order_status"),r.getInt("order_version"));
    }
    private Instant instant(ResultSet r,String column) throws SQLException {var time=r.getObject(column,LocalDateTime.class);return time==null ? null : time.toInstant(ZoneOffset.UTC);}
    public record Dispute(long id,long orderId,long openedBy,String reason,String evidenceUrl,String previousOrderStatus,String status,String resolution,Long resolvedBy,Instant resolvedAt,Instant createdAt,String orderStatus,int orderVersion) {}
}
