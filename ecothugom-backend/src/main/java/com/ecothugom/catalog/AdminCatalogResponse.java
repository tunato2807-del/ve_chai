package com.ecothugom.catalog;

public final class AdminCatalogResponse {
    private AdminCatalogResponse() {}
    public record Category(int id,String name,String description,boolean isActive) {
        static Category from(MaterialCategory category) {
            return new Category(category.getId(),category.getName(),category.getDescription(),category.isActive());
        }
    }
    public record Material(int id,int categoryId,String categoryName,boolean categoryActive,String name,String grade,String unit,
        String description,String excludedItems,String imageUrl,boolean accepted,boolean available) {
        static Material from(com.ecothugom.catalog.Material material) {
            var category=material.getCategory();
            return new Material(material.getId(),category.getId(),category.getName(),category.isActive(),material.getName(),material.getGrade(),material.getUnit(),
                material.getDescription(),material.getExcludedItems(),material.getImageUrl(),material.isAccepted(),material.isAccepted() && category.isActive());
        }
    }
}
