package com.ecothugom.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record QuoteResponse(long id,long orderId,String orderStatus,int orderVersion,int versionNumber,String status,
    boolean current,BigDecimal totalAmount,String currency,Instant validUntil,long createdBy,Instant createdAt,Instant sentAt,
    Long respondedBy,Instant respondedAt,String responseNote,int version,List<Item> items) {
    public record Item(long id,long itemId,long weighingId,int materialId,long priceRuleId,String materialName,String grade,
                       String unit,BigDecimal actualQty,BigDecimal unitPrice,BigDecimal lineTotal) {}
}
