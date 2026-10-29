package com.ecothugom.reports;

import com.ecothugom.common.api.PageResponse;
import java.time.LocalDate;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin/reports") @PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {
    private final AdminReportService reports;
    public AdminReportController(AdminReportService reports) {this.reports=reports;}
    @GetMapping("/overview")
    public AdminReportService.Overview overview(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {return reports.overview(from,to);}
    @GetMapping("/materials")
    public PageResponse<AdminReportService.MaterialTotal> materials(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,@RequestParam(required=false) @Positive Integer materialId,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return reports.materials(from,to,materialId,page,size);}
    @GetMapping("/collectors")
    public PageResponse<AdminReportService.CollectorTotal> collectors(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,@RequestParam(required=false) @Positive Long collectorId,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return reports.collectors(from,to,collectorId,page,size);}
}
