package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/collector/orders/{id}/weighings")
public class WeighingController {
    private final WeighingService weighings;
    public WeighingController(WeighingService weighings) { this.weighings=weighings; }
    @GetMapping public WeighingService.Result list(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {
        return weighings.list(actor.id(),id);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public WeighingService.Result record(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody WeighingRequest request) {
        return weighings.record(actor.id(),id,request);
    }
}
