package com.ecothugom.orders;

public interface RouteProvider {
    RoutePath route(PickupLocation origin,PickupLocation destination);
}
