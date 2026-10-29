package com.ecothugom.catalog;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import jakarta.validation.constraints.*;

public final class AdminPriceRequests {
    private AdminPriceRequests() {}
    public enum ApprovalStatus { DRAFT, APPROVED, REJECTED }
    public record Create(@NotNull @Positive Integer materialId,
        @NotNull @DecimalMin("1") @Digits(integer=18,fraction=0) BigDecimal unitPrice,
        @NotNull OffsetDateTime validFrom, OffsetDateTime validTo) {}
    public record Update(@NotNull @DecimalMin("1") @Digits(integer=18,fraction=0) BigDecimal unitPrice,
        @NotNull OffsetDateTime validFrom, OffsetDateTime validTo,
        @NotBlank @Pattern(regexp="[a-f0-9]{64}") String expectedRevision) {}
    public record Review(@NotBlank @Pattern(regexp="[a-f0-9]{64}") String expectedRevision) {}
}
