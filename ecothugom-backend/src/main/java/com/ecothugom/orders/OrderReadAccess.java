package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import org.springframework.stereotype.Component;

/** One ownership boundary for new order read models; role comes from the authenticated session. */
@Component
public class OrderReadAccess {
    private final CollectionOrderReader orders;
    public OrderReadAccess(CollectionOrderReader orders) {this.orders=orders;}
    public CollectionOrderResponse require(SessionPrincipal actor,long id) {
        return switch(actor.role()) {
            case CUSTOMER -> orders.forCustomer(actor.id(),id);
            case COLLECTOR -> orders.forCollector(actor.id(),id);
            case ADMIN -> orders.forAdmin(id);
        };
    }
}
