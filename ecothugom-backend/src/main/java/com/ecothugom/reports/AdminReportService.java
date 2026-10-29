package com.ecothugom.reports;

import com.ecothugom.common.api.PageResponse;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class AdminReportService {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public AdminReportService(JdbcTemplate jdbc,Clock clock) {this.jdbc=jdbc;this.clock=clock;}
    public Overview overview(LocalDate from,LocalDate to) {
        var period=ReportPeriod.of(from,to,clock);Object[] range={period.start(),period.end()};
        var cohort=jdbc.queryForObject("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END),0) AS completed FROM dbo.collection_orders WHERE created_at>=? AND created_at<?",(r,n)->new long[]{r.getLong("total"),r.getLong("completed")},range);
        var statuses=jdbc.query("SELECT status,COUNT(*) AS count FROM dbo.collection_orders WHERE created_at>=? AND created_at<? GROUP BY status ORDER BY status",(r,n)->new StatusCount(r.getString("status"),r.getLong("count")),range);
        var paid=jdbc.queryForObject("SELECT COUNT(*) AS count,COALESCE(SUM(amount),0) AS amount FROM dbo.payments WHERE status='COMPLETED' AND paid_at>=? AND paid_at<?",(r,n)->new Paid(r.getLong("count"),r.getBigDecimal("amount")),range);
        var weight=jdbc.queryForObject("SELECT COALESCE(SUM(i.actual_qty),0) FROM dbo.payments p JOIN dbo.quote_items i ON i.order_id=p.order_id AND i.quote_id=p.quote_id WHERE p.status='COMPLETED' AND p.paid_at>=? AND p.paid_at<?",BigDecimal.class,range);
        var rate=cohort[0]==0 ? BigDecimal.ZERO.setScale(2) : BigDecimal.valueOf(cohort[1]).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(cohort[0]),2,RoundingMode.HALF_UP);
        return new Overview(period,"VND","KG",cohort[0],cohort[1],rate,statuses,paid.count(),paid.amount(),weight);
    }
    public PageResponse<MaterialTotal> materials(LocalDate from,LocalDate to,Integer materialId,int page,int size) {
        var period=ReportPeriod.of(from,to,clock);var args=arguments(period);
        var filter=paidFilter(args,materialId,"i.material_id");
        String source=" FROM dbo.payments p JOIN dbo.quote_items i ON i.order_id=p.order_id AND i.quote_id=p.quote_id WHERE "+filter;
        String groups=" GROUP BY i.material_id,i.material_name_snapshot,i.grade_snapshot,i.unit_snapshot";
        long total=jdbc.queryForObject("SELECT COUNT(*) FROM (SELECT i.material_id,i.material_name_snapshot,i.grade_snapshot,i.unit_snapshot"+source+groups+") grouped",Long.class,args.toArray());
        args.add((long)page*size);args.add(size);
        var rows=jdbc.query("SELECT i.material_id,i.material_name_snapshot,i.grade_snapshot,i.unit_snapshot,COUNT(DISTINCT p.order_id) AS paid_orders,SUM(i.actual_qty) AS weight,SUM(i.line_total) AS amount"+source+groups+" ORDER BY i.material_id,i.material_name_snapshot,i.grade_snapshot,i.unit_snapshot OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
            (r,n)->new MaterialTotal(r.getInt("material_id"),r.getString("material_name_snapshot"),r.getString("grade_snapshot"),r.getString("unit_snapshot"),"VND",r.getLong("paid_orders"),r.getBigDecimal("weight"),r.getBigDecimal("amount")),args.toArray());
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    public PageResponse<CollectorTotal> collectors(LocalDate from,LocalDate to,Long collectorId,int page,int size) {
        var period=ReportPeriod.of(from,to,clock);var args=arguments(period);
        var filter=paidFilter(args,collectorId,"p.recorded_by");
        long total=jdbc.queryForObject("SELECT COUNT(DISTINCT p.recorded_by) FROM dbo.payments p WHERE "+filter,Long.class,args.toArray());
        args.add((long)page*size);args.add(size);
        var rows=jdbc.query("""
            SELECT p.recorded_by,u.full_name,COUNT(*) AS paid_orders,SUM(p.amount) AS amount,COALESCE(SUM(q.weight),0) AS weight
            FROM dbo.payments p JOIN dbo.users u ON u.user_id=p.recorded_by
            LEFT JOIN (SELECT quote_id,order_id,SUM(actual_qty) AS weight FROM dbo.quote_items GROUP BY quote_id,order_id) q
                ON q.quote_id=p.quote_id AND q.order_id=p.order_id
            WHERE
            """+filter+" GROUP BY p.recorded_by,u.full_name ORDER BY p.recorded_by OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
            (r,n)->new CollectorTotal(r.getLong("recorded_by"),r.getString("full_name"),"VND","KG",r.getLong("paid_orders"),r.getBigDecimal("weight"),r.getBigDecimal("amount")),args.toArray());
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    private ArrayList<Object> arguments(ReportPeriod period) {return new ArrayList<>(List.of(period.start(),period.end()));}
    private String paidFilter(ArrayList<Object> args,Number id,String column) {
        String filter="p.status='COMPLETED' AND p.paid_at>=? AND p.paid_at<?";
        if(id!=null) {filter+=" AND "+column+"=?";args.add(id);}return filter;
    }
    private record Paid(long count,BigDecimal amount) {}
    public record StatusCount(String status,long count) {}
    public record Overview(ReportPeriod period,String currency,String weightUnit,long totalOrders,long completedOrders,BigDecimal completionRatePercent,List<StatusCount> ordersByStatus,long paidOrders,BigDecimal totalPaidAmount,BigDecimal totalWeight) {}
    public record MaterialTotal(int materialId,String materialName,String grade,String unit,String currency,long paidOrders,BigDecimal totalWeight,BigDecimal totalAmount) {}
    public record CollectorTotal(long collectorId,String collectorName,String currency,String weightUnit,long paidOrders,BigDecimal totalWeight,BigDecimal totalAmount) {}
}
