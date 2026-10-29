package com.ecothugom.orders;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(long id,long orderId,long quoteId,BigDecimal amount,String currency,String method,
    String status,String requestKey,Instant paidAt,String referenceCode,long recordedBy,Instant createdAt,
    String orderStatus,int orderVersion,Instant completedAt) {}
