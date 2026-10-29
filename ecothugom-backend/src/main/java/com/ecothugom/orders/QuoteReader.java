package com.ecothugom.orders;

import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Callers authorize the order before reading any quote data. */
@Component
public class QuoteReader {
    private final JdbcTemplate jdbc;
    public QuoteReader(JdbcTemplate jdbc) {this.jdbc=jdbc;}
    public List<QuoteResponse> list(long orderId) {
        var items=jdbc.query("""
            SELECT i.* FROM dbo.quote_items i JOIN (
                SELECT quote_id FROM dbo.order_quotes WHERE order_id=? ORDER BY version_number DESC OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
            ) q ON q.quote_id=i.quote_id ORDER BY i.quote_id,i.quote_item_id
            """,(rs,n)->Map.entry(rs.getLong("quote_id"),item(rs)),orderId);
        var grouped=new HashMap<Long,List<QuoteResponse.Item>>();
        for(var row:items) grouped.computeIfAbsent(row.getKey(),k->new ArrayList<>()).add(row.getValue());
        return jdbc.query("""
            SELECT q.*,o.status AS order_status,o.version AS order_version FROM dbo.order_quotes q
            JOIN dbo.collection_orders o ON o.order_id=q.order_id WHERE q.order_id=?
            ORDER BY q.version_number DESC OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
            """,(rs,n)->quote(rs,grouped.getOrDefault(rs.getLong("quote_id"),List.of())),orderId);
    }
    public QuoteResponse one(long orderId,long quoteId) {
        var items=jdbc.query("SELECT * FROM dbo.quote_items WHERE order_id=? AND quote_id=? ORDER BY quote_item_id",(rs,n)->item(rs),orderId,quoteId);
        var rows=jdbc.query("""
            SELECT q.*,o.status AS order_status,o.version AS order_version FROM dbo.order_quotes q
            JOIN dbo.collection_orders o ON o.order_id=q.order_id WHERE q.order_id=? AND q.quote_id=?
            """,(rs,n)->quote(rs,items),orderId,quoteId);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy báo giá.");
        return rows.getFirst();
    }
    private QuoteResponse quote(ResultSet r,List<QuoteResponse.Item> items) throws SQLException {
        return new QuoteResponse(r.getLong("quote_id"),r.getLong("order_id"),r.getString("order_status"),r.getInt("order_version"),r.getInt("version_number"),r.getString("status"),
            r.getBoolean("is_current"),r.getBigDecimal("total_amount"),"VND",instant(r,"valid_until"),r.getLong("created_by"),instant(r,"created_at"),instant(r,"sent_at"),
            r.getObject("responded_by",Long.class),instant(r,"responded_at"),r.getString("response_note"),r.getInt("version"),items);
    }
    private QuoteResponse.Item item(ResultSet r) throws SQLException {
        return new QuoteResponse.Item(r.getLong("quote_item_id"),r.getLong("item_id"),r.getLong("weighing_id"),r.getInt("material_id"),r.getLong("price_rule_id"),
            r.getString("material_name_snapshot"),r.getString("grade_snapshot"),r.getString("unit_snapshot"),r.getBigDecimal("actual_qty"),r.getBigDecimal("unit_price_snapshot"),r.getBigDecimal("line_total"));
    }
    private Instant instant(ResultSet r,String col) throws SQLException {
        var time=r.getObject(col,LocalDateTime.class);return time==null?null:time.toInstant(ZoneOffset.UTC);
    }
}
