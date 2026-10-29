package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderChangeController {
    private final OrderChangeService changes;
    public OrderChangeController(OrderChangeService changes) {this.changes=changes;}
    @PostMapping("/api/customer/orders/{id}/cancel") @ResponseStatus(HttpStatus.CREATED)
    public OrderChangeService.Change cancel(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody OrderChangeRequests.Cancel request) {return changes.cancel(actor.id(),id,request);}
    @PostMapping("/api/customer/orders/{id}/reschedule")
    public CollectionOrderResponse reschedule(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody OrderChangeRequests.Reschedule request) {return changes.reschedule(actor.id(),id,request);}
    @PostMapping("/api/admin/orders/{id}/reassign")
    public CollectionOrderResponse reassign(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody OrderChangeRequests.Reassign request) {return changes.reassign(actor.id(),id,request);}
    @PostMapping("/api/customer/orders/{id}/change-requests") @ResponseStatus(HttpStatus.CREATED)
    public OrderChangeService.Change create(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody OrderChangeRequests.Create request) {return changes.create(actor.id(),id,request);}
    @GetMapping("/api/customer/orders/{id}/change-requests")
    public PageResponse<OrderChangeService.Change> list(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return changes.customerList(actor.id(),id,page,size);}
    @PostMapping("/api/customer/orders/{id}/change-requests/{requestId}/withdraw")
    public OrderChangeService.Change withdraw(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@PathVariable @Positive long requestId,@Valid @RequestBody OrderChangeRequests.Review request) {return changes.withdraw(actor.id(),id,requestId,request);}
    @GetMapping("/api/admin/order-change-requests")
    public PageResponse<OrderChangeService.Change> admin(@RequestParam(required=false) OrderChangeRequests.Status status,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return changes.adminList(status,page,size);}
    @PostMapping("/api/admin/order-change-requests/{requestId}/approve")
    public OrderChangeService.Change approve(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long requestId,@Valid @RequestBody OrderChangeRequests.Review request) {return changes.process(actor.id(),requestId,request,true);}
    @PostMapping("/api/admin/order-change-requests/{requestId}/reject")
    public OrderChangeService.Change reject(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long requestId,@Valid @RequestBody OrderChangeRequests.Review request) {return changes.process(actor.id(),requestId,request,false);}
}
