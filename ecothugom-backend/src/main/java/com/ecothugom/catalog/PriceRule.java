package com.ecothugom.catalog;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "price_rules", schema = "dbo")
public class PriceRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_rule_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 0)
    private BigDecimal unitPrice;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_to")
    private LocalDateTime validTo;

    @Column(name = "approval_status", nullable = false, length = 20)
    private String approvalStatus;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PriceRule() {}

    PriceRule(Material material, BigDecimal unitPrice, LocalDateTime validFrom, LocalDateTime validTo,
              int versionNumber, long createdBy, LocalDateTime createdAt) {
        this.material = material;
        updateDraft(unitPrice, validFrom, validTo);
        this.approvalStatus = "DRAFT";
        this.versionNumber = versionNumber;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    void updateDraft(BigDecimal price, LocalDateTime from, LocalDateTime to) {
        this.unitPrice = price;
        this.validFrom = from;
        this.validTo = to;
    }

    void approve(long actor, LocalDateTime at) {
        this.approvalStatus = "APPROVED";
        this.approvedBy = actor;
        this.approvedAt = at;
    }

    void reject() { this.approvalStatus = "REJECTED"; }

    public Long getId() { return id; }
    public Integer getMaterialId() { return material.getId(); }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public LocalDateTime getValidFrom() { return validFrom; }
    public LocalDateTime getValidTo() { return validTo; }
    public int getVersionNumber() { return versionNumber; }
    public Material getMaterial() { return material; }
    public String getApprovalStatus() { return approvalStatus; }
    public Long getCreatedBy() { return createdBy; }
    public Long getApprovedBy() { return approvedBy; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getDraftRevision() {
        String snapshot=String.join("\n",id.toString(),material.getId().toString(),unitPrice.toPlainString(),
            validFrom.toString(),validTo==null ? "" : validTo.toString(),approvalStatus,
            Integer.toString(versionNumber),Long.toString(createdBy),createdAt.toString());
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(snapshot.getBytes(StandardCharsets.UTF_8)));
        } catch(NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.",ex);
        }
    }
}
