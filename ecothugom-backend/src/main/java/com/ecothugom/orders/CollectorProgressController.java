package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/collector/orders/{id}")
public class CollectorProgressController {
    private final CollectorProgressService progress;
    public CollectorProgressController(CollectorProgressService progress) { this.progress=progress; }
    @PostMapping("/start-trip")
    public CollectionOrderResponse start(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DispatchRequests.Confirm request) {
        return progress.start(actor.id(),id,request);
    }
    @PostMapping("/arrive")
    public CollectionOrderResponse arrive(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DispatchRequests.Confirm request) {
        return progress.arrive(actor.id(),id,request);
    }
}
