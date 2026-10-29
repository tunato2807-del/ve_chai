package com.ecothugom.orders;

import jakarta.validation.constraints.*;

public final class DispatchRequests {
    private DispatchRequests() {}

    public record Confirm(@NotNull @Min(0) @Max(2147483646) Integer version,@Size(max=500) String reason) {
        public Confirm { reason = normalize(reason); }
    }
    public record Assign(@NotNull @Min(0) @Max(2147483646) Integer version,
                         @NotNull @Positive Long collectorId,@Size(max=500) String reason) {
        public Assign { reason = normalize(reason); }
    }
    private static String normalize(String value) { return value == null || value.isBlank() ? null : value.strip(); }
}
