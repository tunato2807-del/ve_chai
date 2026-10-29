package com.ecothugom.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "materials", schema = "dbo")
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private MaterialCategory category;

    @Nationalized
    @Column(nullable = false, length = 150)
    private String name;

    @Nationalized
    @Column(nullable = false, length = 50)
    private String grade;

    @Column(nullable = false, length = 10)
    private String unit;

    @Nationalized
    @Column(length = 1000)
    private String description;

    @Nationalized
    @Column(name = "excluded_items", length = 1000)
    private String excludedItems;

    @Nationalized
    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private boolean accepted;

    protected Material() {}

    Material(MaterialCategory category,String name,String grade,String unit,String description,String excludedItems,String imageUrl) {
        updateInfo(category,name,grade,unit,description,excludedItems,imageUrl);this.accepted=true;
    }
    void updateInfo(MaterialCategory category,String name,String grade,String unit,String description,String excludedItems,String imageUrl) {
        this.category=category;this.name=name;this.grade=grade;this.unit=unit;
        this.description=description;this.excludedItems=excludedItems;this.imageUrl=imageUrl;
    }
    void changeStatus(boolean accepted) {this.accepted=accepted;}

    public Integer getId() { return id; }
    public MaterialCategory getCategory() { return category; }
    public String getName() { return name; }
    public String getGrade() { return grade; }
    public String getUnit() { return unit; }
    public String getDescription() { return description; }
    public String getExcludedItems() { return excludedItems; }
    public String getImageUrl() { return imageUrl; }
    public boolean isAccepted() {return accepted;}
}
