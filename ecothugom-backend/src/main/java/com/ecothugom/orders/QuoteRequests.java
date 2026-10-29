package com.ecothugom.orders;

import jakarta.validation.constraints.*;

public final class QuoteRequests {
    private QuoteRequests() {}
    public record Send(@NotNull @Min(0) @Max(2147483646) Integer version) {}
    public record Review(@NotNull @Min(0) @Max(2147483646) Integer version,
        @NotNull @Min(0) @Max(2147483646) Integer quoteVersion,@Size(max=500) String responseNote) {
        public Review { responseNote=responseNote==null || responseNote.isBlank()?null:responseNote.strip(); }
    }
}
