package com.ecothugom.auth;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes = {AuthController.class, AdminUserController.class, ProfileController.class})
public class AuthValidationAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalidInput() {
        // Do not serialize binding errors: they may contain a rejected password.
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Dữ liệu không hợp lệ. Kiểm tra tên, số điện thoại, email và độ dài mật khẩu.");
    }
}
