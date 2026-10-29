package com.ecothugom.auth;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import tools.jackson.databind.ObjectMapper;

final class SecurityProblem {
    private final ObjectMapper json;
    SecurityProblem(ObjectMapper json) { this.json = json; }
    void write(HttpServletResponse response, int status, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        json.writeValue(response.getWriter(), Map.of("type", "about:blank", "title",
            switch (status) { case 401 -> "Unauthorized"; case 429 -> "Too Many Requests"; default -> "Forbidden"; },
            "status", status, "detail", detail));
    }
}
