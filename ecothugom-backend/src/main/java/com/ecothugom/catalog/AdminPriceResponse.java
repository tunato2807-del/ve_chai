package com.ecothugom.catalog;

import java.math.BigDecimal;
import java.time.*;

public record AdminPriceResponse(long id, int materialId, String materialName, String grade, String unit,
    String currency, BigDecimal unitPrice, Instant validFrom, Instant validTo, String approvalStatus,
    String draftRevision, int versionNumber, long createdBy, Instant createdAt, Long approvedBy, Instant approvedAt) {
    static AdminPriceResponse from(PriceRule rule) {
        var material=rule.getMaterial();
        return new AdminPriceResponse(rule.getId(),material.getId(),material.getName(),material.getGrade(),
            material.getUnit(),"VND",rule.getUnitPrice(),utc(rule.getValidFrom()),utc(rule.getValidTo()),
            rule.getApprovalStatus(),rule.getDraftRevision(),rule.getVersionNumber(),rule.getCreatedBy(),utc(rule.getCreatedAt()),
            rule.getApprovedBy(),utc(rule.getApprovedAt()));
    }
    private static Instant utc(LocalDateTime time) { return time==null ? null : time.toInstant(ZoneOffset.UTC); }
}
