package com.ecothugom.catalog;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prices")
public class CurrentPriceController {
    private final CurrentPriceService prices;

    public CurrentPriceController(CurrentPriceService prices) {
        this.prices = prices;
    }

    @GetMapping("/current")
    public CurrentPricePageResponse list(
        @RequestParam(required = false) @Positive Integer categoryId,
        @RequestParam(required = false) @Positive Integer materialId,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return prices.list(categoryId, materialId, page, size);
    }
}
