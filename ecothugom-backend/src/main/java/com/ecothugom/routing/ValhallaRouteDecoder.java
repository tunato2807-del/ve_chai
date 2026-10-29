package com.ecothugom.routing;

import com.ecothugom.orders.RoutePath;
import java.util.*;
import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class ValhallaRouteDecoder {
    private ValhallaRouteDecoder() {}
    static RoutePath decode(JsonNode root) {
        var trip=root.path("trip");
        if(!trip.path("status").isIntegralNumber() || trip.path("status").asInt()!=0 || !"kilometers".equals(trip.path("units").asText())) throw invalid();
        double distance=number(trip.path("summary").path("length"),1_000_000)*1000;
        long duration=(long)Math.ceil(number(trip.path("summary").path("time"),31_536_000));
        var legs=trip.path("legs");
        if(!legs.isArray() || legs.size()!=1) throw invalid();
        var leg=legs.get(0);
        List<List<Double>> points;
        if(leg.path("shape").isTextual()) points=polyline(leg.path("shape").asText());
        else {
            var shape=leg.path("shape");var coordinates=shape.path("coordinates");
            if(!"LineString".equals(shape.path("type").asText()) || !coordinates.isArray() || coordinates.size()<2 || coordinates.size()>20_000) throw invalid();
            points=new ArrayList<>();
            for(var p:coordinates) {
                if(!p.isArray() || p.size()<2 || !p.get(0).isNumber() || !p.get(1).isNumber()) throw invalid();
                points.add(point(p.get(0).asDouble(),p.get(1).asDouble()));
            }
        }
        var steps=new ArrayList<RoutePath.Step>();
        var maneuvers=leg.path("maneuvers");
        if(!maneuvers.isArray() || maneuvers.size()>1000) throw invalid();
        for(var step:maneuvers) {
            String instruction=step.path("instruction").asText("");
            if(instruction.isBlank() || instruction.length()>1000) throw invalid();
            steps.add(new RoutePath.Step(instruction,number(step.path("length"),1_000_000)*1000));
        }
        return new RoutePath(distance,duration,points,steps);
    }
    static List<List<Double>> polyline(String encoded) {
        if(encoded.length()>500_000) throw invalid();
        var points=new ArrayList<List<Double>>();
        int[] cursor={0};long lat=0,lng=0;
        while(cursor[0]<encoded.length()) {
            lat+=value(encoded,cursor);lng+=value(encoded,cursor);
            points.add(point(lng/1e6,lat/1e6));
            if(points.size()>20_000) throw invalid();
        }
        if(points.size()<2) throw invalid();return List.copyOf(points);
    }
    private static long value(String encoded,int[] cursor) {
        long result=0;
        for(int shift=0;shift<30;shift+=5) {
            if(cursor[0]>=encoded.length()) throw invalid();
            int b=encoded.charAt(cursor[0]++)-63;
            if(b<0 || b>63) throw invalid();
            result|=(long)(b&31)<<shift;
            if(b<32) return (result&1)==1 ? ~(result>>>1) : result>>>1;
        }
        throw invalid();
    }
    private static List<Double> point(double lng,double lat) {
        if(!Double.isFinite(lng) || !Double.isFinite(lat) || Math.abs(lng)>180 || Math.abs(lat)>90) throw invalid();
        return List.of(lng,lat);
    }
    private static double number(JsonNode value,double maximum) {
        double result=value.asDouble(Double.NaN);
        if(!value.isNumber() || !Double.isFinite(result) || result<0 || result>maximum) throw invalid();
        return result;
    }
    static ResponseStatusException invalid() {return new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Dữ liệu đường đi chưa hợp lệ. Hãy thử lại sau.");}
}
