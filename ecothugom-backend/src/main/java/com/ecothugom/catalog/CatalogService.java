package com.ecothugom.catalog;

import com.ecothugom.common.api.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final MaterialCategoryRepository categories;
    private final MaterialRepository materials;

    public CatalogService(MaterialCategoryRepository categories, MaterialRepository materials) {
        this.categories = categories;
        this.materials = materials;
    }

    public PageResponse<MaterialCategoryResponse> listCategories(int page, int size) {
        return PageResponse.from(categories.findByActiveTrue(pageRequest(page, size))
            .map(MaterialCategoryResponse::from));
    }

    public PageResponse<MaterialResponse> listMaterials(Integer categoryId, int page, int size) {
        return PageResponse.from(materials.findAvailable(categoryId, null, pageRequest(page, size))
            .map(MaterialResponse::from));
    }

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(page, size, Sort.by("id").ascending());
    }
}
