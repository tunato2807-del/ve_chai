package com.ecothugom.orders;

import jakarta.validation.constraints.*;

public final class DisputeRequests {
    private DisputeRequests() {}
    public enum Status {OPEN,IN_REVIEW,RESOLVED,REJECTED}
    public record Open(@NotNull @Min(0) @Max(2147483646) Integer version,@NotBlank @Size(max=1000) String reason,@Size(max=1000) String evidenceUrl) {
        public Open {reason=clean(reason);evidenceUrl=clean(evidenceUrl);}
    }
    public record Review(@NotNull @Min(0) @Max(2147483646) Integer version) {}
    public record Close(@NotNull @Min(0) @Max(2147483646) Integer version,@NotBlank @Size(max=1000) String resolution) {public Close {resolution=clean(resolution);}}
    private static String clean(String value) {return value==null || value.isBlank() ? null : value.strip();}
}
