package com.ecothugom.orders;

import com.ecothugom.auth.AccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CollectorProgressService {
    private final OrderWorkflow workflow;
    private final CollectionOrderReader reader;
    private final AccountService accounts;
    public CollectorProgressService(OrderWorkflow workflow,CollectionOrderReader reader,AccountService accounts) {
        this.workflow=workflow;this.reader=reader;this.accounts=accounts;
    }
    public CollectionOrderResponse start(long actor,long id,DispatchRequests.Confirm request) {
        return move(actor,id,request,OrderStatus.ASSIGNED,OrderStatus.EN_ROUTE,"Nhân viên bắt đầu di chuyển.");
    }
    public CollectionOrderResponse arrive(long actor,long id,DispatchRequests.Confirm request) {
        return move(actor,id,request,OrderStatus.EN_ROUTE,OrderStatus.ARRIVED,"Nhân viên đã đến điểm thu gom.");
    }
    private CollectionOrderResponse move(long actor,long id,DispatchRequests.Confirm request,OrderStatus from,OrderStatus to,String reason) {
        accounts.lockActiveCollector(actor);
        var before=workflow.collector(id,actor);
        workflow.expect(before,from,request.version());
        workflow.change(before,to);
        workflow.audit(before,to,actor,request.reason()==null?reason:request.reason());
        return reader.forCollector(actor,id);
    }
}
