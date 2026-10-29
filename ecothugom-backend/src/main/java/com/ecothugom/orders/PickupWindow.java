package com.ecothugom.orders;

import java.time.*;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

record PickupWindow(LocalDateTime start,LocalDateTime end) {
    static PickupWindow of(OffsetDateTime from,OffsetDateTime to,Instant now) {
        if(from==null || to==null) throw invalid();
        try {
            var start=utc(from);var end=utc(to);
            if(!start.toInstant(ZoneOffset.UTC).isAfter(now) || !end.isAfter(start)) throw invalid();
            return new PickupWindow(start,end);
        } catch(DateTimeException ex) {throw invalid();}
    }
    private static LocalDateTime utc(OffsetDateTime value) {
        if(value.getYear()<1 || value.getYear()>9999) throw invalid();
        var utc=value.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime().truncatedTo(ChronoUnit.MILLIS);
        if(utc.getYear()<1 || utc.getYear()>9999) throw invalid();return utc;
    }
    private static ResponseStatusException invalid() {return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khung giờ phải trong phạm vi năm 0001–9999, bắt đầu ở tương lai và kết thúc sau bắt đầu.");}
}
