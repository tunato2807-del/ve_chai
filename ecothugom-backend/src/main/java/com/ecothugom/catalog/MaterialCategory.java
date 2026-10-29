package com.ecothugom.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "material_categories", schema = "dbo")
public class MaterialCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer id;

    @Nationalized
    @Column(nullable = false, length = 100)
    private String name;

    @Nationalized
    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected MaterialCategory() {}

    MaterialCategory(String name,String description) {
        this.name=name;this.description=description;this.active=true;
    }
    void updateInfo(String name,String description) {this.name=name;this.description=description;}
    void changeStatus(boolean active) {this.active=active;}

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public boolean isActive() {return active;}
}
