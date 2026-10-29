package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class DisputeController {
    private final DisputeService disputes;
    public DisputeController(DisputeService disputes) {this.disputes=disputes;}
    @PostMapping("/api/customer/orders/{id}/disputes") @ResponseStatus(HttpStatus.CREATED)
    public DisputeService.Dispute open(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DisputeRequests.Open request) {return disputes.open(actor.id(),id,request);}
    @GetMapping("/api/customer/orders/{id}/disputes")
    public PageResponse<DisputeService.Dispute> customer(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return disputes.customer(actor.id(),id,page,size);}
    @GetMapping("/api/admin/disputes")
    public PageResponse<DisputeService.Dispute> admin(@RequestParam(required=false) DisputeRequests.Status status,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return disputes.admin(status,page,size);}
    @GetMapping("/api/admin/disputes/{id}")
    public DisputeService.Dispute detail(@PathVariable @Positive long id) {return disputes.detail(id);}
    @PostMapping("/api/admin/disputes/{id}/review")
    public DisputeService.Dispute review(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DisputeRequests.Review request) {return disputes.review(actor.id(),id,request);}
    @PostMapping("/api/admin/disputes/{id}/resolve")
    public DisputeService.Dispute resolve(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DisputeRequests.Close request) {return disputes.close(actor.id(),id,request,true);}
    @PostMapping("/api/admin/disputes/{id}/reject")
    public DisputeService.Dispute reject(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody DisputeRequests.Close request) {return disputes.close(actor.id(),id,request,false);}
}
