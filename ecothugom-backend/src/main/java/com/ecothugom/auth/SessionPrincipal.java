package com.ecothugom.auth;

import java.io.Serializable;
import java.security.Principal;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record SessionPrincipal(long id, String phone, Role role, String credentialStamp) implements Principal, Serializable {
    @Override public String getName() { return phone; }
    public List<SimpleGrantedAuthority> authorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + role.name())); }
    static SessionPrincipal from(UserAccount user) { return new SessionPrincipal(user.getId(), user.getPhone(), user.getRole(),stamp(user)); }
    static String stamp(UserAccount user) {
        try {
            return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(user.getPasswordHash().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch(java.security.NoSuchAlgorithmException ex) {throw new IllegalStateException("SHA-256 unavailable",ex);}
    }
    @Override public String toString() { return "SessionPrincipal[id=" + id + ", role=" + role + "]"; }
}
