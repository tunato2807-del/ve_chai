package com.ecothugom.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record WeighingRequest(@NotNull @Min(0) @Max(2147483646) Integer version,
    @NotEmpty @Size(max=50) List<@NotNull @Valid Item> items) {
    public record Item(@NotNull @Positive Long itemId,
        @NotNull @DecimalMin("0.001") @Digits(integer=9,fraction=3) BigDecimal grossWeight,
        @NotNull @DecimalMin("0") @Digits(integer=9,fraction=3) BigDecimal tareWeight,
        @Positive Long correctionOf,@Size(max=500) String correctionReason) {
        public Item { correctionReason=correctionReason==null || correctionReason.isBlank()?null:correctionReason.strip(); }
    }
}
