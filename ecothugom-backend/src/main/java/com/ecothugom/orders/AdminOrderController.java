package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
    private final DispatchOrderService orders;
    public AdminOrderController(DispatchOrderService orders) { this.orders = orders; }

    @GetMapping
    public PageResponse<DispatchOrderService.Summary> list(@RequestParam(required=false) OrderStatus status,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return orders.list(status,page,size);
    }
    @GetMapping("/{id}")
    public CollectionOrderResponse detail(@PathVariable @Positive long id) { return orders.detail(id); }

    @PostMapping("/{id}/confirm")
    public CollectionOrderResponse confirm(@AuthenticationPrincipal SessionPrincipal admin,@PathVariable @Positive long id,
        @Valid @RequestBody DispatchRequests.Confirm request) {
        return orders.confirm(admin.id(),id,request);
    }

    @PostMapping("/{id}/assign")
    public CollectionOrderResponse assign(@AuthenticationPrincipal SessionPrincipal admin,@PathVariable @Positive long id,
        @Valid @RequestBody DispatchRequests.Assign request) {
        return orders.assign(admin.id(),id,request);
    }
}
