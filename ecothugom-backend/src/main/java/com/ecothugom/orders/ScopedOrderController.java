package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import com.ecothugom.orders.ScopedOrderService.OrderSummary;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScopedOrderController {
    private final ScopedOrderService orders;
    private final CollectionOrderReader details;
    public ScopedOrderController(ScopedOrderService orders,CollectionOrderReader details) { this.orders = orders; this.details = details; }

    @GetMapping("/customer/orders")
    public PageResponse<OrderSummary> customer(@AuthenticationPrincipal SessionPrincipal principal,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return orders.forCustomer(principal.id(),page,size);
    }
    @GetMapping("/collector/orders")
    public PageResponse<OrderSummary> collector(@AuthenticationPrincipal SessionPrincipal principal,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return orders.forCollector(principal.id(),page,size);
    }

    @GetMapping("/collector/orders/{id}")
    public CollectionOrderResponse collectorDetail(@AuthenticationPrincipal SessionPrincipal principal,@PathVariable @Positive long id) {
        return details.forCollector(principal.id(),id);
    }
}
