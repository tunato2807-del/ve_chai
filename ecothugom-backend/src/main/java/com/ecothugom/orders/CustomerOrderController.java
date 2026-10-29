package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/orders")
public class CustomerOrderController {
    private final CustomerOrderService orders;
    public CustomerOrderController(CustomerOrderService orders) { this.orders = orders; }

    @PostMapping
    public ResponseEntity<CollectionOrderResponse> create(@AuthenticationPrincipal SessionPrincipal principal,
        @Valid @RequestBody CreateCollectionOrderRequest request) {
        var order = orders.create(principal.id(),request);
        return ResponseEntity.created(URI.create("/api/customer/orders/" + order.id())).body(order);
    }

    @GetMapping("/{id}")
    public CollectionOrderResponse detail(@AuthenticationPrincipal SessionPrincipal principal,@PathVariable @Positive long id) {
        return orders.detail(principal.id(),id);
    }
}
