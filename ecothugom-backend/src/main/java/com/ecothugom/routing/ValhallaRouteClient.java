package com.ecothugom.routing;

import com.ecothugom.orders.*;
import java.net.URI;
import java.net.ProxySelector;
import java.net.InetSocketAddress;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Component
public class ValhallaRouteClient implements RouteProvider,AutoCloseable {
    private final ObjectMapper json;
    private final URI url;
    private final HttpClient http;
    private final long timeout;
    private long lastRequest;private boolean requested;
    @Autowired public ValhallaRouteClient(ObjectMapper json,
        @Value("${ecothugom.routing-url:https://valhalla1.openstreetmap.de/route}") String url,
        @Value("${ecothugom.routing-timeout-ms:15000}") long timeout,
        @Value("${ecothugom.routing-proxy-url:}") String proxy) {
        this.json=json;this.url=URI.create(url);this.timeout=timeout;
        boolean local="http".equals(this.url.getScheme()) && this.url.getHost()!=null && Set.of("localhost","127.0.0.1","[::1]").contains(this.url.getHost());
        if((!"https".equals(this.url.getScheme()) && !local) || this.url.getHost()==null || this.url.getUserInfo()!=null || this.url.getFragment()!=null || this.url.getQuery()!=null || timeout<100 || timeout>15000)
            throw new IllegalArgumentException("Routing requires an HTTPS endpoint (HTTP loopback for local development) and a 100–15000 ms timeout.");
        var builder=HttpClient.newBuilder().connectTimeout(Duration.ofMillis(Math.min(5000,timeout))).followRedirects(HttpClient.Redirect.NEVER);
        if(!local && !proxy.isBlank()) {
            var via=URI.create(proxy);int port=via.getPort()<0 ? 80 : via.getPort();
            if(!"http".equals(via.getScheme()) || via.getHost()==null || via.getUserInfo()!=null || via.getQuery()!=null || via.getFragment()!=null || port<1 || port>65535)
                throw new IllegalArgumentException("Routing proxy must be an HTTP proxy URL without embedded credentials.");
            builder.proxy(ProxySelector.of(InetSocketAddress.createUnresolved(via.getHost(),port)));
        }
        this.http=builder.build();
    }
    public ValhallaRouteClient(ObjectMapper json,String url,long timeout) {this(json,url,timeout,Objects.requireNonNullElse(System.getenv("ROUTING_PROXY_URL"),""));}
    @Override public RoutePath route(PickupLocation origin,PickupLocation destination) {
        if(!reserve()) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Hãy chờ một lát rồi tìm đường lại.");
        var payload=Map.of("locations",List.of(point(origin),point(destination)),"costing","auto",
            "costing_options",Map.of("auto",Map.of("shortest",true,"disable_hierarchy_pruning",true)),
            "units","kilometers","language","vi-VN","shape_format","polyline6","directions_type","instructions");
        var request=HttpRequest.newBuilder(url).timeout(Duration.ofMillis(timeout)).header("Content-Type","application/json")
            .header("User-Agent","VCoi-course-project/1.0").header("X-Client-Id","VCoi-course-project-local")
            .POST(HttpRequest.BodyPublishers.ofByteArray(json.writeValueAsBytes(payload))).build();
        var future=http.sendAsync(request,info->new BoundedBody(1_000_000));
        HttpResponse<byte[]> response;
        try {response=future.get(timeout,TimeUnit.MILLISECONDS);}
        catch(InterruptedException ex) {future.cancel(true);Thread.currentThread().interrupt();throw unavailable();}
        catch(ExecutionException|TimeoutException ex) {future.cancel(true);throw unavailable();}
        if(response.statusCode()==400 || response.statusCode()==404)
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,"Chưa tìm được tuyến ô tô giữa hai điểm. Hãy kiểm tra vị trí hoặc thử điểm xuất phát khác.");
        if(response.statusCode()!=200) throw unavailable();
        try {return ValhallaRouteDecoder.decode(json.readTree(response.body()));}
        catch(ResponseStatusException ex) {throw ex;}
        catch(RuntimeException ex) {throw ValhallaRouteDecoder.invalid();}
    }
    private Map<String,Object> point(PickupLocation location) {return Map.of("lat",location.lat(),"lon",location.lng());}
    private synchronized boolean reserve() {
        long now=System.nanoTime();
        if(requested && now-lastRequest<1_100_000_000L) return false;
        requested=true;lastRequest=now;return true;
    }
    private ResponseStatusException unavailable() {return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Dịch vụ tìm đường đang bận hoặc chưa kết nối được. Hãy thử lại sau.");}
    @Override public void close() {http.close();}

    // Bound both response size and total completion time, including a provider that stalls mid-body.
    private static final class BoundedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final HttpResponse.BodySubscriber<byte[]> delegate=HttpResponse.BodySubscribers.ofByteArray();
        private final long limit;private long bytes;private Flow.Subscription subscription;private boolean failed;
        BoundedBody(long limit) {this.limit=limit;}
        @Override public CompletionStage<byte[]> getBody() {return delegate.getBody();}
        @Override public void onSubscribe(Flow.Subscription value) {subscription=value;delegate.onSubscribe(value);}
        @Override public void onNext(List<ByteBuffer> chunks) {
            if(failed)return;
            for(var chunk:chunks)bytes+=chunk.remaining();
            if(bytes>limit){failed=true;subscription.cancel();delegate.onError(new IllegalStateException("Routing response size limit exceeded."));}
            else delegate.onNext(chunks);
        }
        @Override public void onError(Throwable error) {if(!failed)delegate.onError(error);}
        @Override public void onComplete() {if(!failed)delegate.onComplete();}
    }
}
