package com.ecothugom.catalog;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPriceController {
    private final AdminPriceService prices;
    public AdminPriceController(AdminPriceService prices) {this.prices=prices;}

    @GetMapping("/price-rules")
    public PageResponse<AdminPriceResponse> list(@RequestParam(required=false) @Positive Integer materialId,
        @RequestParam(required=false) AdminPriceRequests.ApprovalStatus approvalStatus,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return prices.list(materialId,approvalStatus,page,size);
    }
    @GetMapping("/price-rules/{id}")
    public AdminPriceResponse detail(@PathVariable @Positive long id) {return prices.detail(id);}

    @GetMapping("/materials/{id}/price-rules")
    public PageResponse<AdminPriceResponse> history(@PathVariable @Positive int id,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return prices.history(id,page,size);
    }
    @PostMapping("/price-rules") @ResponseStatus(HttpStatus.CREATED)
    public AdminPriceResponse create(@AuthenticationPrincipal SessionPrincipal actor,@Valid @RequestBody AdminPriceRequests.Create request) {
        return prices.create(actor.id(),request);
    }
    @PutMapping("/price-rules/{id}")
    public AdminPriceResponse update(@PathVariable @Positive long id,@Valid @RequestBody AdminPriceRequests.Update request) {
        return prices.update(id,request);
    }
    @PostMapping("/price-rules/{id}/approve")
    public AdminPriceResponse approve(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,
        @Valid @RequestBody AdminPriceRequests.Review request) {return prices.approve(id,actor.id(),request.expectedRevision());}

    @PostMapping("/price-rules/{id}/reject")
    public AdminPriceResponse reject(@PathVariable @Positive long id,
        @Valid @RequestBody AdminPriceRequests.Review request) {return prices.reject(id,request.expectedRevision());}
}
