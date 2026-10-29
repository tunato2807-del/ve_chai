package com.ecothugom.orders;

import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes = {CustomerOrderController.class,AdminOrderController.class,ScopedOrderController.class,CollectorProgressController.class,WeighingController.class,QuotationController.class,SimulatedPaymentController.class,CustomerAddressController.class,OrderHistoryController.class,EvidenceController.class,DisputeController.class,CollectorRouteController.class})
public class OrderValidationAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalidInput() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "Dữ liệu đơn thu gom không hợp lệ. Kiểm tra các trường bắt buộc, phiên bản và giới hạn độ dài.");
    }

    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail persistenceFailure() {
        // Do not return SQL or bound contact/address values in the HTTP response.
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể xử lý đơn thu gom lúc này.");
    }
}
