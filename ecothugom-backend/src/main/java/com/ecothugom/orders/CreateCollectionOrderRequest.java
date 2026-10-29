package com.ecothugom.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateCollectionOrderRequest(
    @Valid PickupAddress pickupAddress,
    @Positive Long addressId,
    @NotNull OffsetDateTime pickupStart,
    @NotNull OffsetDateTime pickupEnd,
    @Size(max = 1000) String sellerNote,
    @NotNull @Size(min = 1, max = 50) List<@NotNull @Valid Item> items
) {
    public CreateCollectionOrderRequest { sellerNote = optional(sellerNote); }
    @AssertTrue public boolean isAddressSelectionValid() {return (pickupAddress==null)!=(addressId==null);}

    public record PickupAddress(
        @NotBlank @Size(max = 100) String contactName,
        @NotBlank @Pattern(regexp = "0[35789][0-9]{8}") String contactPhone,
        @NotBlank @Size(max = 300) String addressLine,
        @Size(max = 100) String ward,
        @Size(max = 100) String district,
        @NotBlank @Size(max = 100) String province,
        @Valid PickupLocation location
    ) {
        public PickupAddress {
            contactName = optional(contactName);
            contactPhone = optional(contactPhone);
            addressLine = optional(addressLine);
            ward = optional(ward);
            district = optional(district);
            province = optional(province);
        }
        public PickupAddress(String contactName,String contactPhone,String addressLine,String ward,String district,String province) {
            this(contactName,contactPhone,addressLine,ward,district,province,null);
        }
        @Override public String toString() { return "PickupAddress[redacted]"; }
    }

    public record Item(
        @NotNull @Positive Integer materialId,
        @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal estimatedQty,
        @Size(max = 500) String note
    ) {
        public Item { note = optional(note); }
    }

    private static String optional(String value) { return value == null || value.isBlank() ? null : value.strip(); }
    @Override public String toString() { return "CreateCollectionOrderRequest[redacted]"; }
}
