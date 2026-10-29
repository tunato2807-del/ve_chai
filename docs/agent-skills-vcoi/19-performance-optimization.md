# 19 — Đo và tối ưu hiệu năng VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: có một lượt Lighthouse lab ban đầu; chưa có baseline tải, p95 SQL Server hoặc INP người dùng thật.

Nguồn: [performance-optimization/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/performance-optimization/SKILL.md),
[optimization-patterns.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/performance-optimization/references/optimization-patterns.md),
[performance-checklist.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/performance-checklist.md).
Mã đối chiếu: `2c804bc8090dee4dcdb2ca150404c534ce35f669`; liên quan [V04, V07–V08, V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Điểm xuất phát từ mã thật

| Bằng chứng                                                                                                                                                                                                                                       | Hướng đo, chưa phải kết luận chậm                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [App.jsx:11](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/App.jsx#L11) đã lazy-load nhiều trang nghiệp vụ.                                                                         | Đo initial JS và chunk khi mở báo cáo/bản đồ trước khi đề xuất tách bundle thêm.         |
| [reports-api.js:66](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/reports-api.js#L66) tải mọi trang vật liệu, tối đa bốn request cùng lượt.                          | Đo số request, payload, heap và thời gian dựng biểu đồ/export khi số nhóm tăng.          |
| [AdminReportService.java:17](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java#L17) thực hiện nhiều SELECT tổng hợp trong kỳ. | Lấy query plan, logical reads, duration, lock wait và tính nhất quán dưới ghi đồng thời. |
| [application.properties:13](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application.properties#L13) đặt Hikari maximum-pool-size=5.                              | Đo thời gian chờ pool và DB trước khi thay kích thước.                                   |

Không có số đo chứng minh N+1, thiếu index hoặc pool quá nhỏ.
Thành công lint/build và 142 phép đối chiếu H2 không chứng minh tốc độ trên SQL Server.
V04 là rủi ro nhất quán báo cáo; tối ưu không được bỏ kiểm tra để làm số đo đẹp hơn.

## Phép đo lab đã có, chưa phải kết quả tối ưu

Ngày 29/10, một lượt Lighthouse 13.5.0/Chromium, mobile simulated throttling, Vite preview production và backend local/H2:
Performance **69/100**, FCP **3.070 ms**, LCP **6.457 ms**, TBT **161 ms**, CLS **0,001829**, tổng transfer **1.191.618 byte**.
Không có runtimeError/warning trong lượt này; xem [EVIDENCE.md](EVIDENCE.md) và [lighthouse-summary.json](evidence/lighthouse-summary.json) để biết route `/`, URL localhost tạm và các thông số lab đã lưu.
LCP được gán cho `img.hero-image`; `/recycling-yard.webp` tải 446.300 byte, insight ước tính tiết kiệm 314.310 byte cho ảnh này.
Các ước tính khác: toàn mục ảnh khoảng 566 KiB, unused JavaScript khoảng 94 KiB, render-blocking khoảng 900 ms.
Đây là tín hiệu điều tra LCP và giả thuyết thử kích thước/nén ảnh, `sizes` và JS; chưa chứng minh nút thắt hay hiệu quả sau sửa.
Browser smoke có 16 ca route công khai/login/register theo ma trận kiểm tra đã ghi, hai độ rộng 320/1440 và sáng/tối; 0 axe violation/page error/overflow, 5 tương tác đạt.
Các ca này không thay thế đo INP thực, toàn bộ hành trình ba vai trò hoặc concurrency SQL Server; chưa có before/after.

## Thiết kế phép đo tái lập

1. Ghi commit, OS, CPU/RAM, Node/npm/JDK, SQL Server edition/version và cấu hình DB.
   Chạy bản production frontend, backend cùng profile thử nghiệm, dataset tổng hợp; không benchmark Vite dev server.
2. Chọn hành trình: mở bảng giá, đăng nhập rồi danh sách/chi tiết đơn, quản trị báo cáo 30/366 ngày, xuất báo cáo.
   Đo routing riêng vì timeout và nhà cung cấp ngoài hệ thống có ảnh hưởng khác.
3. Tạo hai dataset đề xuất 10.000/100.000 khoản chi mô phỏng, phân bố ngày/vật liệu có chủ đích.
   Đây là dữ liệu sẽ tạo trong môi trường riêng, chưa phải quy mô đã quan sát của VCOI.
4. Frontend: lưu DevTools Network/Performance trace, kích thước gzip/brotli, long task và heap khi export.
   Lặp ít nhất năm lượt cho mỗi trang trên cùng cấu hình máy/mạng; tách cache lạnh và cache ấm.
5. API đọc: đề xuất 1.000 request mỗi ca, concurrency 1/10/25, ba lượt lặp sau warm-up cố định.
   Ghi số mẫu thành công/thất bại, p50/p95/p99, throughput, CPU, heap/GC, pool wait và thời gian DB.
   Đăng nhập lấy session hợp lệ trước; không tắt CSRF/rate limit để đo các thao tác ghi.
6. SQL Server: lấy actual execution plan và `SET STATISTICS IO, TIME ON` cho truy vấn đại diện trong DB thử.
   So sánh estimated/actual rows, seek/scan, sort, statistics và blocking; không chép `EXPLAIN ANALYZE` của PostgreSQL.
7. Giữ fixture, số mẫu, thời gian, seed và trạng thái cache giống nhau giữa baseline và bản sửa.
   Tách phép thử concurrency đúng đắn của V04/thanh toán khỏi phép đo throughput đơn thuần.

## Ngân sách đề xuất, cần chốt sau baseline

| Chỉ số                     | Mục tiêu ban đầu để thảo luận                                   | Trạng thái hiện tại                                                            |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| LCP / INP / CLS            | ≤2,5 giây / ≤200 ms / ≤0,1, theo ngưỡng Good trong skill.       | Lab một lượt: LCP 6,457 giây, CLS 0,001829; chưa có INP/p75 người dùng thật.   |
| API đọc danh sách/chi tiết | p95 ≤500 ms ở concurrency 10 trên cấu hình ghi rõ.              | Ngân sách đề xuất, chưa phải SLA hay kết quả đạt.                              |
| Báo cáo 366 ngày           | p95 ≤2 giây; export hoàn tất ≤10 giây ở dataset đã chốt.        | Ngân sách đề xuất; cần cân đối quy mô thực.                                    |
| Initial JS                 | Ghi byte nén baseline và chặn tăng quá 10% nếu chưa giải trình. | Chưa tách byte initial JS; total transfer 1.191.618 byte không tương đương JS. |

Nếu chưa có người dùng thật, INP từ tương tác lab chỉ là phép đo chẩn đoán.
RUM sau này cần thiết kế thu thập tối thiểu, không gửi URL chứa ID đơn/địa chỉ hay nội dung form.
Chưa cài công cụ mới hoặc bật telemetry trong gói tài liệu này.

## Thực hiện một thử nghiệm tối ưu

1. Viết giả thuyết từ trace/plan: phần nào chiếm thời gian, vì sao thay đổi có thể giảm nó.
2. Chọn một thay đổi: giới hạn dữ liệu biểu đồ, export phía server, cải thiện query hoặc chunk theo kết quả đo.
   Không thêm index/cache/React.memo đồng loạt; giữ thứ tự phân trang ổn định và quyền truy cập.
3. Với index, đo cả chi phí ghi; cú pháp/khả năng tạo online phải đúng edition SQL Server.
   Với cache, ghi key chứa người xem/quyền và toàn bộ bộ lọc, TTL, invalidation và chống stampede.
   Không cache quyền đã thu hồi hoặc trạng thái chấp thuận/khoản chi theo cách cho phép thao tác trên dữ liệu cũ.
4. Đo lại cùng điều kiện; giữ khi mức cải thiện vượt biến động giữa các lượt và test nghiệp vụ vẫn đạt.
   Hoàn nguyên thay đổi trung tính, chậm hơn hoặc làm sai kết quả; ghi lại cả thử nghiệm bị bỏ.
5. Sau khi có phép đo ổn định, thêm budget CI phù hợp và theo dõi chỉ số người dùng thật khi có vận hành.

Mẫu sổ đo, các ô dưới đây phải được điền bằng artifact thực:

| Commit/ý tưởng | Dataset và điều kiện | Baseline → sau sửa | Biến động | Giữ/bỏ và lý do |
| -------------- | -------------------- | ------------------ | --------- | --------------- |
| Chưa thử       | Chưa đo              | Chưa đo            | Chưa đo   | Chưa kết luận   |

## Tiêu chí nghiệm thu

- [ ] Có artifact trước/sau, cấu hình máy, dataset, cache, số mẫu và tỷ lệ lỗi.
- [ ] Nút thắt xác định được từ trace/plan, cải thiện vượt độ nhiễu.
- [ ] Tổng tiền/khối lượng, snapshot báo cáo, quyền và luồng ba vai trò giữ đúng.
- [ ] Thử nghiệm không hiệu quả được hoàn nguyên và lưu lý do để tránh lặp lại.
- [ ] Có budget đo được; việc thiếu RUM hoặc SQL Server thật được ghi rõ.
- [ ] Không tuyên bố đạt p95/LCP khi chỉ mới lint/build hoặc tạo một bảng mục tiêu.

## Phụ thuộc và bàn giao

Khôi phục test V07; chốt snapshot V04 trước khi tối ưu báo cáo và dùng [21](21-ci-cd-and-automation.md) cho gate ổn định.

> Đo baseline VCOI trên SQL Server thử với dữ liệu tổng hợp, ưu tiên báo cáo 366 ngày và export.
> Nộp trace/query plan, điều kiện cache và số mẫu; chỉ đề xuất một tối ưu từ bằng chứng.
> Đo lại cùng điều kiện, giữ khi vượt nhiễu và đúng nghiệp vụ; không thêm dịch vụ hay telemetry ngoài phạm vi.
