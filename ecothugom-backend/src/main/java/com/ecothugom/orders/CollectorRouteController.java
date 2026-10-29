package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/collector/orders/{id}/route")
public class CollectorRouteController {
    private final CollectorRouteService routes;
    public CollectorRouteController(CollectorRouteService routes) {this.routes=routes;}
    @PostMapping public CollectorRouteService.Response route(@AuthenticationPrincipal SessionPrincipal actor,
        @PathVariable @Positive long id,@Valid @RequestBody Request request) {return routes.route(actor.id(),id,request.origin());}
    public record Request(@NotNull @Valid PickupLocation origin) {
        @Override public String toString() {return "RouteRequest[redacted]";}
    }
}
