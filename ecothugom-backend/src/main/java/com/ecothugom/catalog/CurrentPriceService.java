package com.ecothugom.catalog;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CurrentPriceService {
    private final MaterialRepository materials;
    private final PriceRuleRepository prices;
    private final Clock clock;

    public CurrentPriceService(MaterialRepository materials, PriceRuleRepository prices, Clock clock) {
        this.materials = materials;
        this.prices = prices;
        this.clock = clock;
    }

    public CurrentPricePageResponse list(Integer categoryId, Integer materialId, int page, int size) {
        // One UTC instant applies to every material in this response.
        var asOf = clock.instant();
        var materialPage = materials.findAvailable(
            categoryId, materialId, PageRequest.of(page, size, Sort.by("id").ascending())
        );
        var materialIds = materialPage.getContent().stream().map(Material::getId).toList();

        // Fetch prices for the entire page together instead of one query per material.
        Map<Integer, PriceRule> currentPrices = currentPrices(materialIds,asOf);

        return CurrentPricePageResponse.from(asOf, materialPage.map(
            material -> CurrentPriceResponse.from(material, currentPrices.get(material.getId()))
        ));
    }

    // Internal batch lookup: callers supply a server-side instant shared by the whole operation.
    public Map<Integer,CurrentPriceResponse> forMaterials(List<Integer> materialIds,Instant asOf) {
        if (materialIds.isEmpty()) return Map.of();
        var available = materials.findAvailableByIds(materialIds);
        var current = currentPrices(available.stream().map(Material::getId).toList(),asOf);
        return available.stream().collect(Collectors.toMap(Material::getId,
            material -> CurrentPriceResponse.from(material,current.get(material.getId()))));
    }

    private Map<Integer,PriceRule> currentPrices(List<Integer> materialIds,Instant asOf) {
        return materialIds.isEmpty() ? Map.of() : prices.findCurrent(materialIds,LocalDateTime.ofInstant(asOf,ZoneOffset.UTC))
            .stream().collect(Collectors.toMap(PriceRule::getMaterialId,price -> price));
    }
}
