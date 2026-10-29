package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderHistoryController {
    private final OrderHistoryService history;
    private final WeighingService weighing;
    public OrderHistoryController(OrderHistoryService history,WeighingService weighing) {this.history=history;this.weighing=weighing;}
    @GetMapping({"/api/customer/orders/{id}/timeline","/api/collector/orders/{id}/timeline","/api/admin/orders/{id}/timeline"})
    public PageResponse<OrderHistoryService.Event> timeline(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return history.timeline(actor,id,page,size);}
    @GetMapping({"/api/customer/orders/{id}/receipt","/api/collector/orders/{id}/receipt","/api/admin/orders/{id}/receipt"})
    public OrderHistoryService.Receipt receipt(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return history.receipt(actor,id);}
    @GetMapping({"/api/customer/orders/{id}/weighings","/api/admin/orders/{id}/weighings"})
    public WeighingService.Result weighings(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return weighing.visible(actor,id);}
}
