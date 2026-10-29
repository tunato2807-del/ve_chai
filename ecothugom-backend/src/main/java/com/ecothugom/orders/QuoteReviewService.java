package com.ecothugom.orders;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class QuoteReviewService {
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final QuoteReader reader;
    public QuoteReviewService(JdbcTemplate jdbc,OrderWorkflow workflow,QuoteReader reader) {
        this.jdbc=jdbc;this.workflow=workflow;this.reader=reader;
    }
    public QuoteResponse accept(long actor,long id,long quoteId,QuoteRequests.Review request) {
        return respond(actor,id,quoteId,request,true);
    }
    public QuoteResponse reject(long actor,long id,long quoteId,QuoteRequests.Review request) {
        return respond(actor,id,quoteId,request,false);
    }
    private QuoteResponse respond(long actor,long id,long quoteId,QuoteRequests.Review request,boolean accept) {
        var order=workflow.customer(id,actor);
        workflow.expect(order,OrderStatus.AWAITING_SELLER_APPROVAL,request.version());
        var quote=reader.one(id,quoteId);
        var now=workflow.now();
        if(!quote.current() || !quote.status().equals("SENT") || quote.version()!=request.quoteVersion()
            || (quote.validUntil()!=null && !now.toInstant(java.time.ZoneOffset.UTC).isBefore(quote.validUntil()))) throw OrderWorkflow.conflict();
        var next=accept?OrderStatus.AWAITING_PAYMENT:OrderStatus.ARRIVED;
        workflow.change(order,next);
        int changed=jdbc.update("""
            UPDATE dbo.order_quotes SET status=?,responded_by=?,responded_at=?,response_note=?,version=version+1
            WHERE quote_id=? AND order_id=? AND status='SENT' AND is_current=1 AND version=?
            """,accept?"ACCEPTED":"REJECTED",actor,now,request.responseNote(),quoteId,id,request.quoteVersion());
        if(changed!=1) throw OrderWorkflow.conflict();
        workflow.audit(order,next,actor,accept?"Khách hàng đồng ý báo giá.":"Khách hàng từ chối báo giá; nhân viên cần xử lý lại.");
        return reader.one(id,quoteId);
    }
}
