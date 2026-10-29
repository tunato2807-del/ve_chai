package com.ecothugom.catalog;

import com.ecothugom.common.api.PageResponse;
import java.net.URI;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class AdminCatalogService {
    private final MaterialCategoryRepository categories;
    private final MaterialRepository materials;
    public AdminCatalogService(MaterialCategoryRepository categories,MaterialRepository materials) {this.categories=categories;this.materials=materials;}

    public PageResponse<AdminCatalogResponse.Category> categories(Boolean active,int page,int size) {
        return PageResponse.from(categories.findForAdmin(active,page(page,size)).map(AdminCatalogResponse.Category::from));
    }
    public AdminCatalogResponse.Category category(int id) {return AdminCatalogResponse.Category.from(requireCategory(id));}
    @Transactional
    public AdminCatalogResponse.Category createCategory(AdminCatalogRequests.Category request) {
        if(categories.existsByNameIgnoreCase(request.name())) throw duplicate();
        return AdminCatalogResponse.Category.from(categories.saveAndFlush(new MaterialCategory(request.name(),request.description())));
    }
    @Transactional
    public AdminCatalogResponse.Category updateCategory(int id,AdminCatalogRequests.Category request) {
        var category=categories.findForUpdate(id).orElseThrow(()->missing("danh mục"));
        if(categories.existsByNameIgnoreCaseAndIdNot(request.name(),id)) throw duplicate();
        category.updateInfo(request.name(),request.description());categories.flush();
        return AdminCatalogResponse.Category.from(category);
    }
    @Transactional
    public AdminCatalogResponse.Category categoryStatus(int id,AdminCatalogRequests.CategoryStatus request) {
        var category=categories.findForUpdate(id).orElseThrow(()->missing("danh mục"));
        category.changeStatus(request.isActive());categories.flush();
        return AdminCatalogResponse.Category.from(category);
    }
    public PageResponse<AdminCatalogResponse.Material> materials(Integer categoryId,Boolean accepted,int page,int size) {
        return PageResponse.from(materials.findForAdmin(categoryId,accepted,page(page,size)).map(AdminCatalogResponse.Material::from));
    }
    public AdminCatalogResponse.Material material(int id) {
        return AdminCatalogResponse.Material.from(materials.findById(id).orElseThrow(()->missing("vật liệu")));
    }
    @Transactional
    public AdminCatalogResponse.Material createMaterial(AdminCatalogRequests.Material request) {
        var category=requireCategory(request.categoryId());
        validateImageUrl(request.imageUrl());
        if(materials.existsByCategoryIdAndNameIgnoreCaseAndGradeIgnoreCase(request.categoryId(),request.name(),request.grade())) throw duplicate();
        return AdminCatalogResponse.Material.from(materials.saveAndFlush(new Material(category,request.name(),request.grade(),request.unit(),request.description(),request.excludedItems(),request.imageUrl())));
    }
    @Transactional
    public AdminCatalogResponse.Material updateMaterial(int id,AdminCatalogRequests.Material request) {
        var material=materials.findForUpdate(id).orElseThrow(()->missing("vật liệu"));
        var category=requireCategory(request.categoryId());
        validateImageUrl(request.imageUrl());
        if(materials.existsByCategoryIdAndNameIgnoreCaseAndGradeIgnoreCaseAndIdNot(request.categoryId(),request.name(),request.grade(),id)) throw duplicate();
        material.updateInfo(category,request.name(),request.grade(),request.unit(),request.description(),request.excludedItems(),request.imageUrl());materials.flush();
        return AdminCatalogResponse.Material.from(material);
    }
    @Transactional
    public AdminCatalogResponse.Material materialStatus(int id,AdminCatalogRequests.MaterialStatus request) {
        var material=materials.findForUpdate(id).orElseThrow(()->missing("vật liệu"));
        material.changeStatus(request.accepted());materials.flush();
        return AdminCatalogResponse.Material.from(material);
    }
    private void validateImageUrl(String value) {
        if(value==null) return;
        try {
            var uri=URI.create(value);
            if(("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) && uri.getHost()!=null && uri.getRawUserInfo()==null) return;
        } catch(IllegalArgumentException ignored) { /* Report a generic validation error without echoing the URL. */ }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"imageUrl phải là URL HTTP/HTTPS hợp lệ, có host và không chứa thông tin đăng nhập.");
    }
    private MaterialCategory requireCategory(int id) {return categories.findById(id).orElseThrow(()->missing("danh mục"));}
    private PageRequest page(int page,int size) {return PageRequest.of(page,size,Sort.by("id").ascending());}
    private ResponseStatusException missing(String type) {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy "+type+".");}
    private ResponseStatusException duplicate() {return new ResponseStatusException(HttpStatus.CONFLICT,"Tên danh mục hoặc tổ hợp vật liệu đã tồn tại.");}
}
