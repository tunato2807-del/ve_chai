package com.ecothugom.auth;

import jakarta.validation.constraints.*;

public record LoginRequest(
    @NotBlank @Size(max = 254) String identifier,
    @NotNull @Size(min = 1, max = 64) String password
) {
    @Override public String toString() { return "LoginRequest[redacted]"; }
}
