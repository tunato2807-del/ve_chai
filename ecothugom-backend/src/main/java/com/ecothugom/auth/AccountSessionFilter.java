package com.ecothugom.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

// Registered only in the security chain, after loading the session and before authorizing.
final class AccountSessionFilter extends OncePerRequestFilter {
    private final UserAccountRepository users;
    private final SecurityContextRepository contexts;
    AccountSessionFilter(UserAccountRepository users, SecurityContextRepository contexts) { this.users = users; this.contexts = contexts; }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof SessionPrincipal principal) {
            var account = users.findById(principal.id()).orElse(null);
            if (account == null || account.getStatus() != AccountStatus.ACTIVE || !SessionPrincipal.stamp(account).equals(principal.credentialStamp())) {
                var session = request.getSession(false);
                if (session != null) session.invalidate();
                SecurityContextHolder.clearContext();
            } else {
                var refreshed = SessionPrincipal.from(account);
                if (!refreshed.equals(principal)) {
                    var context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(refreshed, null, refreshed.authorities()));
                    SecurityContextHolder.setContext(context);
                    contexts.saveContext(context, request, response);
                }
            }
        }
        chain.doFilter(request,response);
    }
}
