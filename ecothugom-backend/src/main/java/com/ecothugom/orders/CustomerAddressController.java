package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/customer/addresses") @PreAuthorize("hasRole('CUSTOMER')")
public class CustomerAddressController {
    private final CustomerAddressService addresses;
    public CustomerAddressController(CustomerAddressService addresses) {this.addresses=addresses;}
    @GetMapping public PageResponse<CustomerAddressService.Address> list(@AuthenticationPrincipal SessionPrincipal actor,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {return addresses.list(actor.id(),page,size);}
    @GetMapping("/{id}") public CustomerAddressService.Address detail(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return addresses.detail(actor.id(),id);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CustomerAddressService.Address create(@AuthenticationPrincipal SessionPrincipal actor,@Valid @RequestBody CustomerAddressService.Write request) {return addresses.create(actor.id(),request);}
    @PutMapping("/{id}") public CustomerAddressService.Address update(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@Valid @RequestBody CustomerAddressService.Write request) {return addresses.update(actor.id(),id,request);}
    @PutMapping("/{id}/default") public CustomerAddressService.Address primary(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {return addresses.makeDefault(actor.id(),id);}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id) {addresses.delete(actor.id(),id);}
}
