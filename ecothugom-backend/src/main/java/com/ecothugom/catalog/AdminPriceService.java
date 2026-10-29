package com.ecothugom.catalog;

import com.ecothugom.common.api.PageResponse;
import java.time.*;
import java.time.temporal.ChronoUnit;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class AdminPriceService {
    private final PriceRuleRepository prices;
    private final MaterialRepository materials;
    private final Clock clock;
    public AdminPriceService(PriceRuleRepository prices,MaterialRepository materials,Clock clock) {
        this.prices=prices; this.materials=materials; this.clock=clock;
    }

    public PageResponse<AdminPriceResponse> list(Integer materialId,AdminPriceRequests.ApprovalStatus status,int page,int size) {
        return PageResponse.from(prices.findForAdmin(materialId,status==null ? null : status.name(),
            PageRequest.of(page,size,Sort.by("id").descending())).map(AdminPriceResponse::from));
    }
    public PageResponse<AdminPriceResponse> history(int materialId,int page,int size) {
        if(!materials.existsById(materialId)) throw missing("vật liệu");
        return PageResponse.from(prices.findForAdmin(materialId,null,
            PageRequest.of(page,size,Sort.by("versionNumber").descending())).map(AdminPriceResponse::from));
    }
    public AdminPriceResponse detail(long id) {
        return AdminPriceResponse.from(prices.findById(id).orElseThrow(()->missing("phiên bản giá")));
    }
    @Transactional
    public AdminPriceResponse create(long actor,AdminPriceRequests.Create request) {
        var period=period(request.validFrom(),request.validTo());
        // Serialize sequence allocation on the material, including when it has no price rows yet.
        var material=materials.findForUpdate(request.materialId()).orElseThrow(()->missing("vật liệu"));
        int last=prices.latestVersion(material.getId());
        if(last==Integer.MAX_VALUE) throw new ResponseStatusException(HttpStatus.CONFLICT,"Đã đạt giới hạn số phiên bản giá của vật liệu.");
        var rule=new PriceRule(material,request.unitPrice(),period.from(),period.to(),last+1,actor,
            LocalDateTime.ofInstant(clock.instant().truncatedTo(ChronoUnit.MILLIS),ZoneOffset.UTC));
        return AdminPriceResponse.from(prices.saveAndFlush(rule));
    }
    @Transactional
    public AdminPriceResponse update(long id,AdminPriceRequests.Update request) {
        var period=period(request.validFrom(),request.validTo());
        var rule=draftForUpdate(id,request.expectedRevision());
        rule.updateDraft(request.unitPrice(),period.from(),period.to());
        prices.flush(); return AdminPriceResponse.from(rule);
    }
    @Transactional
    public AdminPriceResponse approve(long id,long actor,String expectedRevision) {
        var rule=draftForUpdate(id,expectedRevision);
        rule.approve(actor,LocalDateTime.ofInstant(clock.instant().truncatedTo(ChronoUnit.MILLIS),ZoneOffset.UTC));
        prices.flush(); return AdminPriceResponse.from(rule);
    }
    @Transactional
    public AdminPriceResponse reject(long id,String expectedRevision) {
        var rule=draftForUpdate(id,expectedRevision);
        rule.reject(); prices.flush(); return AdminPriceResponse.from(rule);
    }
    private PriceRule draftForUpdate(long id,String expectedRevision) {
        var rule=prices.findForUpdate(id).orElseThrow(()->missing("phiên bản giá"));
        if(!"DRAFT".equals(rule.getApprovalStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Chỉ giá DRAFT mới được sửa, duyệt hoặc từ chối. Hãy tải lại phiên bản giá.");
        if(!rule.getDraftRevision().equals(expectedRevision))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Bản nháp đã được thay đổi trong phiên quản trị khác. Hãy tải lại phiên bản giá.");
        return rule;
    }
    private Period period(OffsetDateTime from,OffsetDateTime to) {
        var start=databaseTime(from); var end=to==null ? null : databaseTime(to);
        if(end!=null && !end.isAfter(start)) throw invalidPeriod();
        return new Period(start,end);
    }
    private LocalDateTime databaseTime(OffsetDateTime value) {
        var utc=LocalDateTime.ofInstant(value.toInstant().truncatedTo(ChronoUnit.MILLIS),ZoneOffset.UTC);
        if(utc.getYear()<1 || utc.getYear()>9999) throw invalidPeriod();
        return utc;
    }
    private ResponseStatusException invalidPeriod() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thời gian phải trong năm 0001–9999 theo UTC; validTo phải sau validFrom khi lưu đến mili giây.");
    }
    private ResponseStatusException missing(String type) {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy "+type+".");}
    private record Period(LocalDateTime from,LocalDateTime to) {}
}
