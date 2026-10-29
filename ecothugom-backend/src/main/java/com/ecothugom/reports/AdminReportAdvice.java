package com.ecothugom.reports;

import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes=AdminReportController.class)
public class AdminReportAdvice {
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail persistence() {return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể đọc thống kê lúc này.");}
}
