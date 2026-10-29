package com.ecothugom.catalog;

public record MaterialCategoryResponse(Integer id, String name, String description) {
    static MaterialCategoryResponse from(MaterialCategory category) {
        return new MaterialCategoryResponse(category.getId(), category.getName(), category.getDescription());
    }
}
