package com.ecothugom.auth;

import com.ecothugom.common.api.PageResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService implements UserDetailsService {
    private final UserAccountRepository users;
    private final PasswordEncoder passwords;
    private final Clock clock;

    public AccountService(UserAccountRepository users, PasswordEncoder passwords, Clock clock) {
        this.users = users;
        this.passwords = passwords;
        this.clock = clock;
    }

    @Override @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) {
        String normalized = identifier.strip().toLowerCase(Locale.ROOT);
        UserAccount account = (normalized.contains("@") ? users.findByEmailIgnoreCase(normalized) : users.findByPhone(normalized))
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        return User.withUsername(account.getPhone()).password(account.getPasswordHash())
            .roles(account.getRole().name()).disabled(account.getStatus() != AccountStatus.ACTIVE).build();
    }

    @Transactional
    public UserResponse registerCustomer(RegistrationRequest request) { return create(request, Role.CUSTOMER); }

    @Transactional
    public UserResponse createCollector(RegistrationRequest request) { return create(request, Role.COLLECTOR); }

    // Bootstrap is deliberately separate from public registration and never updates existing accounts.
    @Transactional
    public UserResponse bootstrapAdmin(RegistrationRequest request) {
        var existing = users.findByPhone(request.phone());
        if (existing.isPresent()) {
            if (existing.get().getRole() == Role.ADMIN && existing.get().getStatus() == AccountStatus.ACTIVE) {
                return UserResponse.from(existing.get());
            }
            throw new IllegalStateException("Bootstrap phone already belongs to another account; choose a new phone.");
        }
        return create(request, Role.ADMIN);
    }

    private UserResponse create(RegistrationRequest request, Role role) {
        validatePasswordBytes(request.password());
        if (users.existsByPhone(request.phone()) || request.email() != null && users.existsByEmailIgnoreCase(request.email())) {
            throw duplicate();
        }
        var account = new UserAccount(request.fullName(), request.phone(), request.email(),
            passwords.encode(request.password()), role, now());
        try { return UserResponse.from(users.saveAndFlush(account)); }
        catch (DataIntegrityViolationException ex) { throw duplicate(); }
    }

    static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có tối đa 72 byte UTF-8.");
        }
    }

    @Transactional(readOnly = true)
    public UserAccount byPhone(String phone) {
        return users.findByPhone(phone).orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }

    @Transactional(readOnly = true)
    public UserResponse current(long id) { return UserResponse.from(require(id)); }

    @Transactional
    public UserResponse updateProfile(long id,ProfileRequests.Profile request) {
        var user=users.findForUpdate(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy tài khoản."));
        if(request.email()!=null && users.existsByEmailIgnoreCaseAndIdNot(request.email(),id)) throw duplicate();
        user.updateProfile(request.fullName(),request.email(),now());
        try {users.flush();return UserResponse.from(user);} catch(DataIntegrityViolationException ex) {throw duplicate();}
    }
    @Transactional
    public void changePassword(long id,ProfileRequests.Password request) {
        validatePasswordBytes(request.currentPassword());validatePasswordBytes(request.newPassword());
        var user=users.findForUpdate(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy tài khoản."));
        if(!passwords.matches(request.currentPassword(),user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Mật khẩu hiện tại không đúng.");
        if(passwords.matches(request.newPassword(),user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Mật khẩu mới phải khác mật khẩu hiện tại.");
        user.changePassword(passwords.encode(request.newPassword()),now());users.flush();
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(int page, int size) {
        return PageResponse.from(users.findAll(PageRequest.of(page, size, Sort.by("id"))).map(UserResponse::from));
    }

    // Keep the collector row locked until the caller's dispatch transaction commits.
    @Transactional(propagation = Propagation.MANDATORY)
    public void lockActiveCollector(long id) {
        var collector = users.findForUpdate(id).filter(user -> user.getRole() == Role.COLLECTOR)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy nhân viên thu gom."));
        if (collector.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Nhân viên thu gom đang bị khóa.");
        }
    }

    @Transactional
    public UserResponse changeStatus(long id, AccountStatus status) {
        // Read under the same row lock as profile/password writes; never flush an older account snapshot.
        UserAccount account = users.findForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
        if (account.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thay đổi trạng thái tài khoản quản trị viên qua API này.");
        }
        account.changeStatus(status, now());
        return UserResponse.from(account);
    }

    private UserAccount require(long id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
    }
    private LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC); }
    private ResponseStatusException duplicate() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại hoặc email đã được sử dụng.");
    }
}
