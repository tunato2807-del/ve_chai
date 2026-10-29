package com.ecothugom.orders;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record PickupLocation(
    @NotNull @DecimalMin("-90") @DecimalMax("90") @Digits(integer=3,fraction=6) BigDecimal lat,
    @NotNull @DecimalMin("-180") @DecimalMax("180") @Digits(integer=3,fraction=6) BigDecimal lng
) {
    static PickupLocation from(BigDecimal lat,BigDecimal lng) {return lat==null || lng==null ? null : new PickupLocation(lat,lng);}
    @Override public String toString() {return "PickupLocation[redacted]";}
}
