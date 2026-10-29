package com.ecothugom.auth;

public record UserResponse(Long id, String fullName, String phone, String email, Role role, AccountStatus status) {
    public static UserResponse from(UserAccount user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getPhone(), user.getEmail(), user.getRole(), user.getStatus());
    }
}
