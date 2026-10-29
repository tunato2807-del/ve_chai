package com.ecothugom.auth;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @PreAuthorize("isAuthenticated()")
public class ProfileController {
    private final AccountService accounts;
    public ProfileController(AccountService accounts) {this.accounts=accounts;}
    @PutMapping("/profile")
    public UserResponse profile(@AuthenticationPrincipal SessionPrincipal actor,@Valid @RequestBody ProfileRequests.Profile request) {
        return accounts.updateProfile(actor.id(),request);
    }
    @PostMapping("/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal SessionPrincipal actor,@Valid @RequestBody ProfileRequests.Password body,
        HttpServletRequest request,HttpServletResponse response,Authentication authentication) {
        accounts.changePassword(actor.id(),body);
        new SecurityContextLogoutHandler().logout(request,response,authentication);
    }
}
