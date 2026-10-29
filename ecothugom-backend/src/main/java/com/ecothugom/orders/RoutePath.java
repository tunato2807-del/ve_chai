package com.ecothugom.orders;

import java.util.List;

public record RoutePath(double distanceMeters,long durationSeconds,List<List<Double>> coordinates,List<Step> steps) {
    public RoutePath {coordinates=coordinates.stream().map(List::copyOf).toList();steps=List.copyOf(steps);}
    public record Step(String instruction,double distanceMeters) {}
    @Override public String toString() {return "RoutePath[redacted]";}
}
