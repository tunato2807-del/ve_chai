package com.ecothugom.reports;

import java.time.*;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record ReportPeriod(LocalDate from,LocalDate to,String timeZone,Instant fromInclusive,Instant toExclusive) {
    private static final ZoneId ZONE=ZoneId.of("Asia/Ho_Chi_Minh");
    static ReportPeriod of(LocalDate from,LocalDate to,Clock clock) {
        var month=LocalDate.now(clock.withZone(ZONE)).withDayOfMonth(1);
        if(from==null) from=month;if(to==null) to=month.plusMonths(1);
        long days=ChronoUnit.DAYS.between(from,to);
        if(days<1 || days>366 || from.getYear()<1 || to.getYear()>9999) throw invalid();
        var start=from.atStartOfDay(ZONE).toInstant();var end=to.atStartOfDay(ZONE).toInstant();
        if(start.atOffset(ZoneOffset.UTC).getYear()<1 || end.atOffset(ZoneOffset.UTC).getYear()>9999) throw invalid();
        return new ReportPeriod(from,to,ZONE.getId(),start,end);
    }
    LocalDateTime start() {return LocalDateTime.ofInstant(fromInclusive,ZoneOffset.UTC);}
    LocalDateTime end() {return LocalDateTime.ofInstant(toExclusive,ZoneOffset.UTC);}
    private static ResponseStatusException invalid() {return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Kỳ báo cáo từ ngày from (bao gồm) đến to (không bao gồm), dài 1–366 ngày và trong phạm vi SQL Server.");}
}
