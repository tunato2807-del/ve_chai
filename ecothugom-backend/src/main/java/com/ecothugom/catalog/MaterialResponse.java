package com.ecothugom.catalog;

public record MaterialResponse(
    Integer id,
    Integer categoryId,
    String categoryName,
    String name,
    String grade,
    String unit,
    String description,
    String excludedItems,
    String imageUrl
) {
    static MaterialResponse from(Material material) {
        return new MaterialResponse(
            material.getId(), material.getCategory().getId(), material.getCategory().getName(),
            material.getName(), material.getGrade(), material.getUnit(), material.getDescription(),
            material.getExcludedItems(), material.getImageUrl()
        );
    }
}
