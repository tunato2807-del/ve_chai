package com.ecothugom.auth;

import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AccountService accounts;
    public AdminUserController(AccountService accounts) { this.accounts = accounts; }

    @GetMapping("/users")
    public PageResponse<UserResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) { return accounts.list(page, size); }

    @PostMapping("/collectors") @ResponseStatus(HttpStatus.CREATED)
    public UserResponse collector(@Valid @RequestBody RegistrationRequest request) { return accounts.createCollector(request); }

    @PatchMapping("/users/{id}/status")
    public UserResponse status(@PathVariable @Positive long id, @Valid @RequestBody StatusRequest request) {
        return accounts.changeStatus(id, request.status());
    }
    public record StatusRequest(@NotNull AccountStatus status) {}
}
