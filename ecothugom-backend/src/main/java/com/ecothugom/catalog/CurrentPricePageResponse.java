package com.ecothugom.catalog;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;

public record CurrentPricePageResponse(
    Instant asOf,
    List<CurrentPriceResponse> data,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    static CurrentPricePageResponse from(Instant asOf, Page<CurrentPriceResponse> page) {
        return new CurrentPricePageResponse(
            asOf, page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages()
        );
    }
}
