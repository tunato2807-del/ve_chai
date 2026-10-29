package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class SimulatedPaymentController {
    private final SimulatedPaymentService payments;
    public SimulatedPaymentController(SimulatedPaymentService payments) {this.payments=payments;}

    @PostMapping("/api/collector/orders/{id}/payments/simulate")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse simulate(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody SimulatedPaymentRequest request) {
        return payments.simulate(actor.id(),id,request);
    }
    @GetMapping({"/api/customer/orders/{id}/payments","/api/collector/orders/{id}/payments","/api/admin/orders/{id}/payments"})
    public List<PaymentResponse> list(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return payments.list(actor,id);}
}
