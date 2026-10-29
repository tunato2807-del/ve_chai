package com.ecothugom.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.filter.OncePerRequestFilter;

// Bounded, per-IP limits for a single-server coursework deployment. No forwarded header trust.
final class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_KEYS = 4096;
    private static final long WINDOW_SECONDS = 900;
    private final Map<String, Window> windows = new HashMap<>();
    private final Clock clock;
    private final SecurityProblem problems;
    AuthRateLimitFilter(Clock clock, SecurityProblem problems) { this.clock = clock; this.problems = problems; }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String path = request.getServletPath();
        if (path.isEmpty()) path = request.getRequestURI().substring(request.getContextPath().length());
        if ("POST".equals(request.getMethod()) && (path.equals("/api/auth/login") || path.equals("/api/auth/register"))) {
            long retry = acquire(path + ":" + request.getRemoteAddr(), path.endsWith("login") ? 10 : 5);
            if (retry > 0) {
                response.setHeader("Retry-After", Long.toString(retry));
                problems.write(response,429,"Quá nhiều yêu cầu. Vui lòng thử lại sau.");
                return;
            }
        }
        chain.doFilter(request,response);
    }

    synchronized long acquire(String key, int limit) {
        Instant now = clock.instant();
        windows.values().removeIf(w -> !now.isBefore(w.until));
        Window window = windows.get(key);
        if (window == null) {
            if (windows.size() >= MAX_KEYS) return WINDOW_SECONDS;
            window = new Window(now.plusSeconds(WINDOW_SECONDS));
            windows.put(key,window);
        }
        if (window.count >= limit) return Math.max(1,window.until.getEpochSecond() - now.getEpochSecond());
        window.count++;
        return 0;
    }
    private static final class Window {
        final Instant until;
        int count;
        Window(Instant until) { this.until = until; }
    }
}
