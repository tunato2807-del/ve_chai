package com.ecothugom.orders;

import java.time.OffsetDateTime;
import jakarta.validation.constraints.*;

public final class OrderChangeRequests {
    private OrderChangeRequests() {}
    public enum Type {CANCEL,RESCHEDULE}
    public enum Status {PENDING,APPROVED,REJECTED,WITHDRAWN}
    public record Cancel(@NotNull @Min(0) @Max(2147483646) Integer version,@NotBlank @Size(max=500) String reason) {public Cancel {reason=clean(reason);}}
    public record Reschedule(@NotNull @Min(0) @Max(2147483646) Integer version,@NotBlank @Size(max=500) String reason,@NotNull OffsetDateTime pickupStart,@NotNull OffsetDateTime pickupEnd) {public Reschedule {reason=clean(reason);}}
    public record Create(@NotNull @Min(0) @Max(2147483646) Integer version,@NotNull Type requestType,@NotBlank @Size(max=500) String reason,OffsetDateTime pickupStart,OffsetDateTime pickupEnd) {public Create {reason=clean(reason);}}
    public record Review(@NotNull @Min(0) @Max(2147483646) Integer version,@NotNull @Min(0) @Max(2147483646) Integer requestVersion,@Size(max=500) String responseNote) {public Review {responseNote=clean(responseNote);}}
    public record Reassign(@NotNull @Min(0) @Max(2147483646) Integer version,@NotNull @Positive Long collectorId,@NotBlank @Size(max=500) String reason) {public Reassign {reason=clean(reason);}}
    private static String clean(String value) {return value==null || value.isBlank() ? null : value.strip();}
}
