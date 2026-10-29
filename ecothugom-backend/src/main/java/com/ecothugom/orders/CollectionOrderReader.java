package com.ecothugom.orders;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CollectionOrderReader {
    private final JdbcTemplate jdbc;
    public CollectionOrderReader(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public CollectionOrderResponse forCustomer(long customerId,long orderId) {
        return read("order_id=? AND seller_user_id=?",orderId,customerId);
    }
    public CollectionOrderResponse forCollector(long collectorId,long orderId) {
        return read("order_id=? AND collector_id=?",orderId,collectorId);
    }
    public CollectionOrderResponse forAdmin(long orderId) { return read("order_id=?",orderId); }

    // Predicates are selected only by the explicit server-side scope methods above.
    private CollectionOrderResponse read(String predicate,Object... values) {
        var rows = jdbc.query("""
            SELECT order_id,code,status,collector_id,source_address_id,contact_name_snapshot,contact_phone_snapshot,
                   address_snapshot,seller_note,pickup_start,pickup_end,created_at,updated_at,version,pickup_lat_snapshot,pickup_lng_snapshot
            FROM dbo.collection_orders WHERE
            """ + predicate,(rs,n) -> new CollectionOrderResponse(rs.getLong("order_id"),rs.getString("code"),rs.getString("status"),
                rs.getObject("collector_id",Long.class),rs.getObject("source_address_id",Long.class),
                rs.getString("contact_name_snapshot"),rs.getString("contact_phone_snapshot"),rs.getString("address_snapshot"),
                rs.getString("seller_note"),rs.getObject("pickup_start",LocalDateTime.class).toInstant(ZoneOffset.UTC),
                rs.getObject("pickup_end",LocalDateTime.class).toInstant(ZoneOffset.UTC),
                rs.getObject("created_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),
                rs.getObject("updated_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),rs.getInt("version"),"VND",List.of(),null,
                PickupLocation.from(rs.getBigDecimal("pickup_lat_snapshot"),rs.getBigDecimal("pickup_lng_snapshot"))),values);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn thu gom.");
        var items = jdbc.query("""
            SELECT i.item_id,i.material_id,m.name,m.grade,m.unit,i.estimated_qty,i.estimated_price_rule_id,
                   i.estimated_unit_price,i.estimated_line_total,i.note,i.photo_url
            FROM dbo.collection_items i JOIN dbo.materials m ON m.material_id=i.material_id
            WHERE i.order_id=? ORDER BY i.item_id
            """,(rs,n) -> new CollectionOrderResponse.Item(rs.getLong("item_id"),rs.getInt("material_id"),rs.getString("name"),
                rs.getString("grade"),rs.getString("unit"),rs.getBigDecimal("estimated_qty"),
                rs.getObject("estimated_price_rule_id",Long.class),rs.getBigDecimal("estimated_unit_price"),
                rs.getBigDecimal("estimated_line_total"),rs.getBigDecimal("estimated_unit_price") == null ? "CONTACT_FOR_QUOTE" : "AVAILABLE",
                rs.getString("note"),rs.getString("photo_url")),rows.getFirst().id());
        return rows.getFirst().withItems(items);
    }
}
