package com.ecothugom.orders;

import com.ecothugom.auth.SessionPrincipal;
import jakarta.validation.constraints.*;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class EvidenceController {
    private final EvidenceService evidence;
    public EvidenceController(EvidenceService evidence) {this.evidence=evidence;}
    @PostMapping(value="/api/customer/orders/{id}/items/{itemId}/photo",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public EvidenceService.Upload item(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@PathVariable @Positive long itemId,@RequestParam @Min(0) @Max(2147483646) int version,@RequestParam MultipartFile file) {return evidence.item(actor.id(),id,itemId,version,file);}
    @PostMapping(value="/api/collector/orders/{id}/weighings/{weighingId}/photo",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public EvidenceService.Upload weighing(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Positive long id,@PathVariable @Positive long weighingId,@RequestParam @Min(0) @Max(2147483646) int version,@RequestParam MultipartFile file) {return evidence.weighing(actor.id(),id,weighingId,version,file);}
    @GetMapping("/api/evidence/{name}")
    public ResponseEntity<Resource> read(@AuthenticationPrincipal SessionPrincipal actor,@PathVariable @Pattern(regexp="[a-f0-9]{32}\\.(png|jpg)") String name) {
        var resource=evidence.read(actor,name);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.CONTENT_DISPOSITION,"inline; filename=\"evidence"+(name.endsWith(".png") ? ".png" : ".jpg")+"\"")
            .contentType(name.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG).body(resource);
    }
}
