package com.ecothugom.catalog;

import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {
    private final AdminCatalogService catalog;
    public AdminCatalogController(AdminCatalogService catalog) {this.catalog=catalog;}

    @GetMapping("/material-categories")
    public PageResponse<AdminCatalogResponse.Category> categories(@RequestParam(required=false) Boolean isActive,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return catalog.categories(isActive,page,size);
    }
    @GetMapping("/material-categories/{id}")
    public AdminCatalogResponse.Category category(@PathVariable @Positive int id) {return catalog.category(id);}
    @PostMapping("/material-categories") @ResponseStatus(HttpStatus.CREATED)
    public AdminCatalogResponse.Category createCategory(@Valid @RequestBody AdminCatalogRequests.Category request) {return catalog.createCategory(request);}
    @PutMapping("/material-categories/{id}")
    public AdminCatalogResponse.Category updateCategory(@PathVariable @Positive int id,@Valid @RequestBody AdminCatalogRequests.Category request) {return catalog.updateCategory(id,request);}
    @PatchMapping("/material-categories/{id}/status")
    public AdminCatalogResponse.Category categoryStatus(@PathVariable @Positive int id,@Valid @RequestBody AdminCatalogRequests.CategoryStatus request) {return catalog.categoryStatus(id,request);}

    @GetMapping("/materials")
    public PageResponse<AdminCatalogResponse.Material> materials(@RequestParam(required=false) @Positive Integer categoryId,@RequestParam(required=false) Boolean accepted,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return catalog.materials(categoryId,accepted,page,size);}
    @GetMapping("/materials/{id}")
    public AdminCatalogResponse.Material material(@PathVariable @Positive int id) {return catalog.material(id);}
    @PostMapping("/materials") @ResponseStatus(HttpStatus.CREATED)
    public AdminCatalogResponse.Material createMaterial(@Valid @RequestBody AdminCatalogRequests.Material request) {return catalog.createMaterial(request);}
    @PutMapping("/materials/{id}")
    public AdminCatalogResponse.Material updateMaterial(@PathVariable @Positive int id,@Valid @RequestBody AdminCatalogRequests.Material request) {return catalog.updateMaterial(id,request);}
    @PatchMapping("/materials/{id}/status")
    public AdminCatalogResponse.Material materialStatus(@PathVariable @Positive int id,@Valid @RequestBody AdminCatalogRequests.MaterialStatus request) {return catalog.materialStatus(id,request);}
}
