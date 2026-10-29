package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class QuotationController {
    private final QuotationService quotes;
    private final QuoteReviewService reviews;
    public QuotationController(QuotationService quotes,QuoteReviewService reviews) {this.quotes=quotes;this.reviews=reviews;}
    @GetMapping({"/api/customer/orders/{id}/quotes","/api/collector/orders/{id}/quotes","/api/admin/orders/{id}/quotes"})
    public List<QuoteResponse> list(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return quotes.list(actor,id);}
    @PostMapping("/api/collector/orders/{id}/quotes") @ResponseStatus(HttpStatus.CREATED)
    public QuoteResponse send(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody QuoteRequests.Send request) {
        return quotes.send(actor.id(),id,request);
    }
    @PostMapping("/api/customer/orders/{id}/quotes/{quoteId}/accept")
    public QuoteResponse accept(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@PathVariable @Positive long quoteId,@Valid @RequestBody QuoteRequests.Review request) {
        return reviews.accept(actor.id(),id,quoteId,request);
    }
    @PostMapping("/api/customer/orders/{id}/quotes/{quoteId}/reject")
    public QuoteResponse reject(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@PathVariable @Positive long quoteId,@Valid @RequestBody QuoteRequests.Review request) {
        return reviews.reject(actor.id(),id,quoteId,request);
    }
}
