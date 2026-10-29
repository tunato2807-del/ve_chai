package com.ecothugom.orders;

import com.ecothugom.catalog.CurrentPriceResponse;
import com.ecothugom.catalog.CurrentPriceService;
import java.math.RoundingMode;
import java.sql.Statement;
import java.sql.Types;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CustomerOrderService {
    private final JdbcTemplate jdbc;
    private final CurrentPriceService prices;
    private final Clock clock;
    private final CollectionOrderReader reader;
    private final CustomerAddressService addresses;

    public CustomerOrderService(JdbcTemplate jdbc,CurrentPriceService prices,Clock clock,CollectionOrderReader reader,CustomerAddressService addresses) {
        this.jdbc = jdbc;
        this.prices = prices;
        this.clock = clock;
        this.reader = reader;
        this.addresses = addresses;
    }

    @Transactional
    public CollectionOrderResponse create(long customerId,CreateCollectionOrderRequest request) {
        Instant asOf = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        LocalDateTime now = LocalDateTime.ofInstant(asOf,ZoneOffset.UTC);
        var window=PickupWindow.of(request.pickupStart(),request.pickupEnd(),asOf);
        LocalDateTime start=window.start(),end=window.end();
        var address = request.addressId()==null ? request.pickupAddress() : addresses.forBooking(customerId,request.addressId());
        String snapshot = Arrays.stream(new String[]{address.addressLine(),address.ward(),address.district(),address.province()})
            .filter(Objects::nonNull).collect(Collectors.joining(", "));
        if (snapshot.length() > 600) throw invalid("Địa chỉ đầy đủ phải có tối đa 600 ký tự.");

        var ids = request.items().stream().map(CreateCollectionOrderRequest.Item::materialId).distinct().toList();
        if (ids.size() != request.items().size()) throw invalid("Mỗi loại vật liệu chỉ được xuất hiện một lần trong đơn.");
        Map<Integer,CurrentPriceResponse> estimates = prices.forMaterials(ids,asOf);
        for (var item : request.items()) {
            var estimate = estimates.get(item.materialId());
            if (estimate == null) throw invalid("Có vật liệu không tồn tại hoặc hiện không được thu mua.");
            if (item.estimatedQty() != null && estimate.unitPrice() != null &&
                item.estimatedQty().multiply(estimate.unitPrice()).setScale(0,RoundingMode.HALF_UP).precision() > 18) {
                throw invalid("Thành tiền ước tính vượt giới hạn cho phép. Hãy giảm khối lượng.");
            }
        }

        String code = "TG-" + UUID.randomUUID().toString().replace("-","");
        var key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("""
                INSERT INTO dbo.collection_orders
                (code,seller_user_id,source_address_id,contact_name_snapshot,contact_phone_snapshot,address_snapshot,
                 pickup_start,pickup_end,status,seller_note,version,created_at,updated_at,pickup_lat_snapshot,pickup_lng_snapshot)
                VALUES (?,?,?,?,?,?,?,?,'PENDING',?,0,?,?,?,?)
                """,Statement.RETURN_GENERATED_KEYS);
            statement.setString(1,code);
            statement.setLong(2,customerId);
            statement.setObject(3,request.addressId(),Types.BIGINT);
            statement.setNString(4,address.contactName());
            statement.setString(5,address.contactPhone());
            statement.setNString(6,snapshot);
            statement.setObject(7,start,Types.TIMESTAMP);
            statement.setObject(8,end,Types.TIMESTAMP);
            statement.setNString(9,request.sellerNote());
            statement.setObject(10,now,Types.TIMESTAMP);
            statement.setObject(11,now,Types.TIMESTAMP);
            statement.setBigDecimal(12,address.location()==null ? null : address.location().lat());
            statement.setBigDecimal(13,address.location()==null ? null : address.location().lng());
            return statement;
        },key);
        long orderId = Objects.requireNonNull(key.getKey(),"Missing generated order ID").longValue();
        jdbc.batchUpdate("""
            INSERT INTO dbo.collection_items
            (order_id,material_id,estimated_qty,estimated_price_rule_id,estimated_unit_price,note)
            VALUES (?,?,?,?,?,?)
            """,request.items(),50,(statement,item) -> {
                var estimate = estimates.get(item.materialId());
                statement.setLong(1,orderId);
                statement.setInt(2,item.materialId());
                statement.setBigDecimal(3,item.estimatedQty());
                statement.setObject(4,estimate.priceRuleId(),Types.BIGINT);
                statement.setBigDecimal(5,estimate.unitPrice());
                statement.setNString(6,item.note());
            });
        jdbc.update("""
            INSERT INTO dbo.order_status_logs(order_id,old_status,new_status,changed_by,reason,changed_at)
            VALUES (?,NULL,'PENDING',?,N'Khách hàng đặt lịch thu gom.',?)
            """,orderId,customerId,now);
        return detail(customerId,orderId);
    }

    public CollectionOrderResponse detail(long customerId,long orderId) {
        return reader.forCustomer(customerId,orderId);
    }

    private ResponseStatusException invalid(String detail) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,detail); }
}
