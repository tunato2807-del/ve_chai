package com.ecothugom.auth;

import java.util.Locale;
import jakarta.validation.constraints.*;

public final class ProfileRequests {
    private ProfileRequests() {}
    public record Profile(@NotBlank @Size(max=100) String fullName,@Email @Size(max=254) String email) {
        public Profile { fullName=fullName==null ? null : fullName.strip();email=email==null || email.isBlank() ? null : email.strip().toLowerCase(Locale.ROOT); }
        @Override public String toString() {return "Profile[redacted]";}
    }
    public record Password(@NotNull @Size(min=1,max=64) String currentPassword,@NotNull @Size(min=12,max=64) String newPassword) {
        @Override public String toString() {return "Password[redacted]";}
    }
}
