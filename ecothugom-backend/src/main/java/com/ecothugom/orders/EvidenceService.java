package com.ecothugom.orders;

import com.ecothugom.auth.*;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional(readOnly=true)
public class EvidenceService {
    private final JdbcTemplate jdbc;
    private final OrderWorkflow workflow;
    private final OrderReadAccess access;
    private final EvidenceStorage storage;
    private final AccountService accounts;
    public EvidenceService(JdbcTemplate jdbc,OrderWorkflow workflow,OrderReadAccess access,EvidenceStorage storage,AccountService accounts) {this.jdbc=jdbc;this.workflow=workflow;this.access=access;this.storage=storage;this.accounts=accounts;}
    @Transactional
    public Upload item(long actor,long id,long itemId,int version,MultipartFile file) {
        var before=workflow.customer(id,actor);
        if(before.version()!=version || !Set.of(OrderStatus.PENDING,OrderStatus.CONFIRMED,OrderStatus.ASSIGNED).contains(before.status())) throw OrderWorkflow.conflict();
        if(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.collection_items WHERE order_id=? AND item_id=?",Integer.class,id,itemId)!=1) throw EvidenceStorage.missing();
        if(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.collection_items WHERE item_id=? AND photo_url IS NOT NULL",Integer.class,itemId)>0) throw OrderWorkflow.conflict();
        workflow.change(before,before.status());var stored=storage.store(file);
        if(jdbc.update("UPDATE dbo.collection_items SET photo_url=? WHERE order_id=? AND item_id=? AND photo_url IS NULL",stored.url(),id,itemId)!=1) throw OrderWorkflow.conflict();
        workflow.audit(before,before.status(),actor,"Khách thêm ảnh vật liệu.");
        return new Upload(id,before.version()+1,stored.url(),stored.mediaType());
    }
    @Transactional
    public Upload weighing(long actor,long id,long weighingId,int version,MultipartFile file) {
        accounts.lockActiveCollector(actor);
        var before=workflow.collector(id,actor);workflow.expect(before,OrderStatus.ARRIVED,version);
        var items=jdbc.queryForList("SELECT w.item_id FROM dbo.weighing_records w JOIN dbo.collection_items i ON i.item_id=w.item_id WHERE i.order_id=? AND w.weighing_id=?",Long.class,id,weighingId);
        if(items.isEmpty()) throw EvidenceStorage.missing();
        Long latest=jdbc.queryForObject("SELECT MAX(weighing_id) FROM dbo.weighing_records WHERE item_id=?",Long.class,items.getFirst());
        if(latest==null || latest!=weighingId || jdbc.queryForObject("SELECT COUNT(*) FROM dbo.quote_items WHERE weighing_id=?",Integer.class,weighingId)>0 || jdbc.queryForObject("SELECT COUNT(*) FROM dbo.weighing_records WHERE weighing_id=? AND photo_url IS NOT NULL",Integer.class,weighingId)>0) throw OrderWorkflow.conflict();
        workflow.change(before,before.status());var stored=storage.store(file);
        if(jdbc.update("UPDATE dbo.weighing_records SET photo_url=? WHERE weighing_id=? AND photo_url IS NULL",stored.url(),weighingId)!=1) throw OrderWorkflow.conflict();
        workflow.audit(before,before.status(),actor,"Nhân viên thêm ảnh phiếu cân.");return new Upload(id,before.version()+1,stored.url(),stored.mediaType());
    }
    public Resource read(SessionPrincipal actor,String name) {
        String url=EvidenceStorage.PREFIX+name;
        var orders=jdbc.queryForList("""
            SELECT order_id FROM dbo.collection_items WHERE photo_url=?
            UNION SELECT i.order_id FROM dbo.weighing_records w JOIN dbo.collection_items i ON i.item_id=w.item_id WHERE w.photo_url=?
            """,Long.class,url,url);
        for(long order:orders) {
            try {access.require(actor,order);return storage.load(name);}
            catch(ResponseStatusException ex) {if(ex.getStatusCode().value()!=404) throw ex;}
        }
        throw EvidenceStorage.missing();
    }
    public record Upload(long orderId,int orderVersion,String url,String mediaType) {}
}
