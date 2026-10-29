package com.ecothugom.catalog;

import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes=AdminPriceController.class)
public class AdminPriceAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid() {return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Giá phải là số nguyên VND dương tối đa 18 chữ số; kiểm tra vật liệu và thời gian hiệu lực.");}
    @ExceptionHandler({DataIntegrityViolationException.class,PessimisticLockingFailureException.class})
    public ProblemDetail conflict() {return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"Phiên bản giá xung đột dữ liệu hoặc đang được cập nhật. Hãy tải lại trước khi thử lại.");}
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail persistence() {return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể đọc hoặc lưu bảng giá lúc này.");}
}
