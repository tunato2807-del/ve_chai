package com.ecothugom.orders;

import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CollectorRouteService {
    private final CollectionOrderReader orders;
    private final RouteProvider provider;
    private final Clock clock;
    public CollectorRouteService(CollectionOrderReader orders,RouteProvider provider,Clock clock) {this.orders=orders;this.provider=provider;this.clock=clock;}
    public Response route(long collector,long id,PickupLocation origin) {
        var before=orders.forCollector(collector,id);
        eligible(before);
        var path=provider.route(origin,before.pickupLocation());
        // Do not hold database locks during network I/O; recheck ownership and destination afterwards.
        var current=orders.forCollector(collector,id);
        eligible(current);
        if(!Objects.equals(before.pickupLocation(),current.pickupLocation()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Điểm thu gom đã thay đổi. Hãy làm mới đơn trước khi tìm đường.");
        return new Response(id,origin,current.pickupLocation(),"auto","shortest-distance",path.distanceMeters(),path.durationSeconds(),
            new Geometry("LineString",path.coordinates()),path.steps(),clock.instant(),"© OpenStreetMap contributors · Valhalla");
    }
    private void eligible(CollectionOrderResponse order) {
        if(!Set.of("ASSIGNED","EN_ROUTE","ARRIVED").contains(order.status()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Chỉ tìm đường cho đơn được phân công, đang đến hoặc đã đến điểm thu gom.");
        if(order.pickupLocation()==null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Đơn này chưa có điểm bản đồ. Hãy liên hệ khách theo địa chỉ và số điện thoại trong đơn.");
    }
    public record Geometry(String type,List<List<Double>> coordinates) {}
    public record Response(long orderId,PickupLocation origin,PickupLocation destination,String profile,String strategy,
        double distanceMeters,long durationSeconds,Geometry geometry,List<RoutePath.Step> steps,Instant calculatedAt,String attribution) {
        @Override public String toString() {return "CollectorRouteResponse[orderId="+orderId+"]";}
    }
}
