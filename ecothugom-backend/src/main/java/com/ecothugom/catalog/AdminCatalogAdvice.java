package com.ecothugom.catalog;

import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes=AdminCatalogController.class)
public class AdminCatalogAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid() {return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Thông tin danh mục/vật liệu không hợp lệ. Kiểm tra trường bắt buộc và độ dài.");}
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail constraint() {return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"Dữ liệu danh mục/vật liệu trùng hoặc xung đột ràng buộc. Vui lòng tải lại.");}
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail persistence() {return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể lưu hoặc đọc danh mục/vật liệu lúc này.");}
}
