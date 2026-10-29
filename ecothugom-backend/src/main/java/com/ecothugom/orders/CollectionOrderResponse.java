package com.ecothugom.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CollectionOrderResponse(
    long id, String code, String status, Long collectorId, Long sourceAddressId,
    String contactName, String contactPhone, String address, String sellerNote,
    Instant pickupStart, Instant pickupEnd, Instant createdAt, Instant updatedAt,
    int version, String currency, List<Item> items, BigDecimal estimatedTotal, PickupLocation pickupLocation
) {
    CollectionOrderResponse withItems(List<Item> rows) {
        BigDecimal total = rows.stream().anyMatch(item -> item.estimatedLineTotal() == null) ? null :
            rows.stream().map(Item::estimatedLineTotal).reduce(BigDecimal.ZERO,BigDecimal::add);
        return new CollectionOrderResponse(id,code,status,collectorId,sourceAddressId,contactName,contactPhone,address,
            sellerNote,pickupStart,pickupEnd,createdAt,updatedAt,version,currency,List.copyOf(rows),total,pickupLocation);
    }

    public record Item(
        long itemId, int materialId, String materialName, String grade, String unit,
        BigDecimal estimatedQty, Long estimatedPriceRuleId, BigDecimal estimatedUnitPrice,
        BigDecimal estimatedLineTotal, String priceStatus, String note, String photoUrl
    ) {}
}
