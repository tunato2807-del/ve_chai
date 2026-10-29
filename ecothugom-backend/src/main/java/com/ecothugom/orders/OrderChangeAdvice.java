package com.ecothugom.orders;

import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes=OrderChangeController.class)
public class OrderChangeAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid() {return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Kiểm tra phiên bản, lý do và khung giờ yêu cầu.");}
    @ExceptionHandler({DataIntegrityViolationException.class,PessimisticLockingFailureException.class})
    public ProblemDetail conflict() {return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"Yêu cầu hoặc lịch thu gom đã thay đổi. Hãy tải lại.");}
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail persistence() {return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể xử lý thay đổi lịch lúc này.");}
}
