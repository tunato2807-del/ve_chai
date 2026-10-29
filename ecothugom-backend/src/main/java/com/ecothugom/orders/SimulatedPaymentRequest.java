package com.ecothugom.orders;

import jakarta.validation.constraints.*;
import java.util.Locale;

public record SimulatedPaymentRequest(
    @NotNull @Min(0) @Max(2147483646) Integer version,
    @NotNull @Positive Long quoteId,
    @NotBlank @Pattern(regexp="CASH_SIMULATED|TRANSFER_SIMULATED") String method,
    @NotBlank @Pattern(regexp="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}") String requestKey
) {
    public SimulatedPaymentRequest { requestKey=requestKey==null?null:requestKey.toLowerCase(Locale.ROOT); }
}
