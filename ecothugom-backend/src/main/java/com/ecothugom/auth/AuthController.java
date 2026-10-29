package com.ecothugom.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountService accounts;
    private final AuthenticationManager authentication;
    private final SessionAuthenticationStrategy sessions;
    private final SecurityContextRepository contexts;

    public AuthController(AccountService accounts, AuthenticationManager authentication,
                          SessionAuthenticationStrategy sessions, SecurityContextRepository contexts) {
        this.accounts = accounts;
        this.authentication = authentication;
        this.sessions = sessions;
        this.contexts = contexts;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) { return new CsrfResponse(token.getHeaderName(), token.getToken()); }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegistrationRequest request) { return accounts.registerCustomer(request); }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        AccountService.validatePasswordBytes(body.password());
        try {
            var verified = authentication.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(body.identifier(), body.password()));
            var account = accounts.byPhone(verified.getName());
            if (account.getStatus() != AccountStatus.ACTIVE) throw new BadCredentialsException("Invalid credentials");
            var principal = SessionPrincipal.from(account);
            var signedIn = UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities());
            sessions.onAuthentication(signedIn, request, response);
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(signedIn);
            SecurityContextHolder.setContext(context);
            contexts.saveContext(context, request, response);
            return UserResponse.from(account);
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không hợp lệ.");
        }
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal SessionPrincipal principal) { return accounts.current(principal.id()); }

    public record CsrfResponse(String headerName, String token) {}
}
