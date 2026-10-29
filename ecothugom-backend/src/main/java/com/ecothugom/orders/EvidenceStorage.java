package com.ecothugom.orders;

import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EvidenceStorage {
    static final String PREFIX="/api/evidence/";
    static final int MAX_BYTES=5*1024*1024;
    private final Path root;
    public EvidenceStorage(@Value("${ecothugom.evidence-directory:.local/evidence}") String directory) {root=Path.of(directory).toAbsolutePath().normalize();}
    public Stored store(MultipartFile file) {
        if(!TransactionSynchronizationManager.isSynchronizationActive()) throw new IllegalStateException("Evidence writes require a transaction");
        if(file.getSize()>MAX_BYTES) throw tooLarge();
        byte[] input;
        try(var stream=file.getInputStream()) {input=stream.readNBytes(MAX_BYTES+1);} catch(IOException ex) {throw invalid();}
        if(input.length>MAX_BYTES) throw tooLarge();if(input.length==0) throw invalid();
        String format;BufferedImage image;
        try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(input))) {
            var readers=ImageIO.getImageReaders(stream);
            if(!readers.hasNext()) throw invalid();var reader=readers.next();
            try {
                reader.setInput(stream,false,true);format=reader.getFormatName().toLowerCase(Locale.ROOT);
                if(!Set.of("png","jpeg","jpg").contains(format)) throw invalid();
                int width=reader.getWidth(0),height=reader.getHeight(0);
                if(width<1 || height<1 || width>8192 || height>8192 || (long)width*height>16_000_000) throw invalid();
                image=reader.read(0);if(image==null) throw invalid();
            } finally {reader.dispose();}
        } catch(IOException | IllegalArgumentException ex) {throw invalid();}
        boolean png=format.equals("png");var encoded=new ByteArrayOutputStream();
        try {if(!ImageIO.write(image,png ? "png" : "jpeg",encoded)) throw invalid();} catch(IOException ex) {throw invalid();}
        if(encoded.size()>MAX_BYTES) throw tooLarge();
        String name=UUID.randomUUID().toString().replace("-","")+(png ? ".png" : ".jpg");
        Path target=path(name);
        boolean created=false;
        try {
            Files.createDirectories(root);
            try(var output=Files.newOutputStream(target,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE)) {created=true;encoded.writeTo(output);}
        } catch(IOException ex) {
            if(created) removeNewFile(target);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Không thể lưu ảnh minh chứng lúc này.");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if(status!=STATUS_COMMITTED) removeNewFile(target);
            }
        });
        return new Stored(PREFIX+name,png ? "image/png" : "image/jpeg");
    }
    public Resource load(String name) {
        Path path=path(name);
        if(Files.isSymbolicLink(path) || !Files.isRegularFile(path)) throw missing();
        return new FileSystemResource(path);
    }
    private void removeNewFile(Path file) {
        try {Files.deleteIfExists(file);} catch(IOException ex) {
            org.slf4j.LoggerFactory.getLogger(EvidenceStorage.class).warn("Unable to remove uncommitted evidence file.");
        }
    }
    private Path path(String name) {
        if(!name.matches("[a-f0-9]{32}\\.(png|jpg)")) throw missing();
        var path=root.resolve(name).normalize();if(!path.startsWith(root)) throw missing();return path;
    }
    private static ResponseStatusException invalid() {return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ảnh phải là JPEG/PNG hợp lệ, tối đa 16 triệu điểm ảnh và mỗi chiều tối đa 8192.");}
    private static ResponseStatusException tooLarge() {return new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"Ảnh phải có dung lượng tối đa 5 MiB, kể cả sau khi chuẩn hóa.");}
    static ResponseStatusException missing() {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy ảnh minh chứng.");}
    public record Stored(String url,String mediaType) {}
}
