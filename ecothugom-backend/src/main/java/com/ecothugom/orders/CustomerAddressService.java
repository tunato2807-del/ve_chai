package com.ecothugom.orders;

import com.ecothugom.auth.UserAccountRepository;
import com.ecothugom.common.api.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.*;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional(readOnly=true)
public class CustomerAddressService {
    private final JdbcTemplate jdbc;
    private final UserAccountRepository users;
    private final Clock clock;
    public CustomerAddressService(JdbcTemplate jdbc,UserAccountRepository users,Clock clock) {this.jdbc=jdbc;this.users=users;this.clock=clock;}
    public PageResponse<Address> list(long actor,int page,int size) {
        long total=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.addresses WHERE user_id=?",Long.class,actor);
        var rows=jdbc.query("SELECT * FROM dbo.addresses WHERE user_id=? ORDER BY is_default DESC,address_id OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",this::map,actor,(long)page*size,size);
        return PageResponse.from(new PageImpl<>(rows,PageRequest.of(page,size),total));
    }
    public Address detail(long actor,long id) {
        var rows=jdbc.query("SELECT * FROM dbo.addresses WHERE user_id=? AND address_id=?",this::map,actor,id);
        if(rows.isEmpty()) throw missing();return rows.getFirst();
    }
    @Transactional
    public Address create(long actor,Write request) {
        lock(actor);
        long count=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.addresses WHERE user_id=?",Long.class,actor);
        if(count>=100) throw new ResponseStatusException(HttpStatus.CONFLICT,"Mỗi tài khoản lưu tối đa 100 địa chỉ.");
        boolean primary=count==0 || Boolean.TRUE.equals(request.isDefault());
        if(primary) clearDefault(actor);
        var p=request.pickupAddress();var key=new GeneratedKeyHolder();
        jdbc.update(connection->{
            var s=connection.prepareStatement("INSERT INTO dbo.addresses(user_id,contact_name,contact_phone,address_line,ward,district,province,is_default,created_at,lat,lng) VALUES(?,?,?,?,?,?,?,?,?,?,?)",new String[]{"address_id"});
            s.setLong(1,actor);s.setNString(2,p.contactName());s.setString(3,p.contactPhone());s.setNString(4,p.addressLine());s.setNString(5,p.ward());s.setNString(6,p.district());s.setNString(7,p.province());s.setBoolean(8,primary);s.setObject(9,now(),Types.TIMESTAMP);
            s.setBigDecimal(10,p.location()==null ? null : p.location().lat());s.setBigDecimal(11,p.location()==null ? null : p.location().lng());return s;
        },key);
        return detail(actor,Objects.requireNonNull(key.getKey()).longValue());
    }
    @Transactional
    public Address update(long actor,long id,Write request) {
        lock(actor);var old=detail(actor,id);
        if(old.isDefault() && Boolean.FALSE.equals(request.isDefault()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Hãy chọn địa chỉ mặc định khác trước khi bỏ mặc định địa chỉ này.");
        boolean primary=old.isDefault() || Boolean.TRUE.equals(request.isDefault());
        if(primary) clearDefault(actor);
        var p=request.pickupAddress();
        jdbc.update("UPDATE dbo.addresses SET contact_name=?,contact_phone=?,address_line=?,ward=?,district=?,province=?,is_default=?,lat=?,lng=? WHERE user_id=? AND address_id=?",
            p.contactName(),p.contactPhone(),p.addressLine(),p.ward(),p.district(),p.province(),primary,
            p.location()==null ? null : p.location().lat(),p.location()==null ? null : p.location().lng(),actor,id);
        return detail(actor,id);
    }
    @Transactional
    public Address makeDefault(long actor,long id) {
        lock(actor);detail(actor,id);clearDefault(actor);
        jdbc.update("UPDATE dbo.addresses SET is_default=1 WHERE user_id=? AND address_id=?",actor,id);
        return detail(actor,id);
    }
    @Transactional
    public void delete(long actor,long id) {
        lock(actor);var address=detail(actor,id);
        // Saved address is a source only; the historical contact/address snapshots remain unchanged.
        jdbc.update("UPDATE dbo.collection_orders SET source_address_id=NULL WHERE seller_user_id=? AND source_address_id=?",actor,id);
        jdbc.update("DELETE FROM dbo.addresses WHERE user_id=? AND address_id=?",actor,id);
        if(address.isDefault()) {
            var remaining=jdbc.queryForList("SELECT address_id FROM dbo.addresses WHERE user_id=? ORDER BY address_id OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",Long.class,actor);
            if(!remaining.isEmpty()) jdbc.update("UPDATE dbo.addresses SET is_default=1 WHERE user_id=? AND address_id=?",actor,remaining.getFirst());
        }
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public CreateCollectionOrderRequest.PickupAddress forBooking(long actor,long id) {lock(actor);return detail(actor,id).pickupAddress();}
    private void lock(long actor) {users.findForUpdate(actor).orElseThrow(CustomerAddressService::missing);}
    private void clearDefault(long actor) {jdbc.update("UPDATE dbo.addresses SET is_default=0 WHERE user_id=? AND is_default=1",actor);}
    private LocalDateTime now() {return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC).truncatedTo(java.time.temporal.ChronoUnit.MILLIS);}
    private Address map(ResultSet r,int n) throws SQLException {
        return new Address(r.getLong("address_id"),new CreateCollectionOrderRequest.PickupAddress(r.getString("contact_name"),r.getString("contact_phone"),r.getString("address_line"),r.getString("ward"),r.getString("district"),r.getString("province"),
            PickupLocation.from(r.getBigDecimal("lat"),r.getBigDecimal("lng"))),r.getBoolean("is_default"),r.getObject("created_at",LocalDateTime.class).toInstant(ZoneOffset.UTC));
    }
    private static ResponseStatusException missing() {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy địa chỉ của bạn.");}
    public record Write(@NotNull @Valid CreateCollectionOrderRequest.PickupAddress pickupAddress,Boolean isDefault) {
        @Override public String toString() {return "AddressWrite[redacted]";}
    }
    public record Address(long id,CreateCollectionOrderRequest.PickupAddress pickupAddress,boolean isDefault,Instant createdAt) {
        @Override public String toString() {return "Address[id="+id+"]";}
    }
}
