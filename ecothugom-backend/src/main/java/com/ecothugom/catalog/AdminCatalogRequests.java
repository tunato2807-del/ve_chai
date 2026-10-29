package com.ecothugom.catalog;

import jakarta.validation.constraints.*;

public final class AdminCatalogRequests {
    private AdminCatalogRequests() {}
    public record Category(@NotBlank @Size(max=100) String name,@Size(max=500) String description) {
        public Category {name=strip(name);description=optional(description);}
    }
    public record CategoryStatus(@NotNull Boolean isActive) {}
    public record Material(@NotNull @Positive Integer categoryId,@NotBlank @Size(max=150) String name,
        @NotBlank @Size(max=50) String grade,@NotBlank @Pattern(regexp="KG") String unit,
        @Size(max=1000) String description,@Size(max=1000) String excludedItems,@Size(max=1000) String imageUrl) {
        public Material {name=strip(name);grade=strip(grade);unit=strip(unit);description=optional(description);excludedItems=optional(excludedItems);imageUrl=optional(imageUrl);}
    }
    public record MaterialStatus(@NotNull Boolean accepted) {}
    private static String strip(String value) {return value==null?null:value.strip();}
    private static String optional(String value) {return value==null || value.isBlank()?null:value.strip();}
}
