package com.ecothugom.auth;

import jakarta.validation.constraints.*;
import java.util.Locale;

public record RegistrationRequest(
    @NotBlank @Size(max = 100) String fullName,
    @NotBlank @Pattern(regexp = "0[35789][0-9]{8}") String phone,
    @Email @Size(max = 254) String email,
    @NotNull @Size(min = 12, max = 64) String password
) {
    public RegistrationRequest {
        fullName = fullName == null ? null : fullName.strip();
        phone = phone == null ? null : phone.strip();
        email = email == null || email.isBlank() ? null : email.strip().toLowerCase(Locale.ROOT);
    }

    @Override public String toString() { return "RegistrationRequest[redacted]"; }
}
