package com.ecothugom.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;

public record CurrentPriceResponse(
    Integer materialId,
    Integer categoryId,
    String categoryName,
    String materialName,
    String grade,
    String unit,
    String currency,
    PriceStatus priceStatus,
    Long priceRuleId,
    BigDecimal unitPrice,
    Integer versionNumber,
    Instant validFrom,
    Instant validTo
) {
    static CurrentPriceResponse from(Material material, PriceRule price) {
        return new CurrentPriceResponse(
            material.getId(), material.getCategory().getId(), material.getCategory().getName(),
            material.getName(), material.getGrade(), material.getUnit(), "VND",
            price == null ? PriceStatus.CONTACT_FOR_QUOTE : PriceStatus.AVAILABLE,
            price == null ? null : price.getId(),
            price == null ? null : price.getUnitPrice(),
            price == null ? null : price.getVersionNumber(),
            price == null ? null : price.getValidFrom().toInstant(ZoneOffset.UTC),
            price == null || price.getValidTo() == null ? null : price.getValidTo().toInstant(ZoneOffset.UTC)
        );
    }
}
