# 24 — Observability and Instrumentation cho VCoi

Nguồn: [observability-and-instrumentation/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/observability-and-instrumentation/SKILL.md). Ngày đối chiếu: 29/10/2026.

**Trạng thái:** đã xác định câu hỏi vận hành, ranh giới dữ liệu và thiết kế tín hiệu; chưa cài instrumentation, dashboard hay cảnh báo. Không có sự kiện gửi sang dịch vụ theo dõi bên ngoài trong lượt này.

## Bằng chứng và vấn đề của VCoi

- [AccountService.changeStatus](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119) cập nhật trạng thái nhưng không nhận actor quản trị để tạo nhật ký tài khoản.
- Đơn hàng đã có [order_status_logs](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/scripts/sql/01-schema.sql#L247); nhật ký nghiệp vụ này không thay thế metrics/log chẩn đoán.
- [EvidenceStorage](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/EvidenceStorage.java#L65) có cảnh báo dọn ảnh thất bại, chưa đủ để nối với một request cụ thể.
- [ValhallaRouteClient](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/routing/ValhallaRouteClient.java#L44) có timeout/giới hạn nhưng chưa có chuỗi trace/metric ứng dụng trong mã đã đọc. Chưa xác minh agent giám sát cài ngoài tiến trình.

## Bốn câu hỏi cần trả lời

| Câu hỏi                                                   | Tín hiệu đề xuất                                                                | Giới hạn dữ liệu                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Một thao tác đặt lịch/thanh toán mô phỏng đang lỗi ở đâu? | Request ID, log có cấu trúc, span HTTP → service → JDBC                         | Không ghi body liên hệ, cookie, CSRF, mật khẩu.            |
| Tỷ lệ 5xx và độ trễ tăng ở endpoint nào?                  | RED theo method, route template, status class; histogram duration               | Không dùng ID đơn/tài khoản/URL thật làm nhãn metric.      |
| 409 là hành vi bảo vệ version hay lỗi bất thường?         | Counter theo nhóm conflict được định nghĩa trước; log chẩn đoán theo request ID | Không mặc định coi mọi 409/401 là lỗi hạ tầng.             |
| Ai khóa/mở tài khoản, tại thời điểm nào?                  | Audit riêng gồm actor ID, target ID, before/after, timestamp, outcome           | Audit có kiểm soát quyền, retention; không lưu credential. |

## Kế hoạch triển khai theo lát cắt

1. Chốt những trường log được phép và cơ chế request ID tại một filter ở ranh giới HTTP. Header client cung cấp phải có giới hạn độ dài/ký tự; không tin trực tiếp chuỗi tùy ý.
2. Gắn request ID vào response và MDC trong `try/finally`, dọn sau request để không lẫn dữ liệu giữa các thread. Với async/external call, kiểm tra propagation riêng.
3. Định dạng log JSON và tên sự kiện ổn định: `order_write_conflict`, `account_status_changed`, `evidence_store_failed`, `routing_upstream_failed`. Audit thay đổi tài khoản cần cùng tính nguyên tử với cập nhật hoặc cơ chế outbox có hợp đồng rõ.
4. Thu RED cho HTTP/JDBC/provider; theo dõi USE của pool database, dung lượng thư mục ảnh và tiến trình. Dùng API metrics tích hợp phù hợp Spring Boot đã xác minh, không chép mã Express/Node từ ví dụ skill vào Java.
5. Nếu cần tracing, chọn cấu hình Micrometer/OpenTelemetry tương thích phiên bản thực; xác minh chính thức theo [08](08-source-driven-development.md). Không thêm dependency hoặc endpoint telemetry ngoài phạm vi đã được giao.
6. Tạo dashboard trả lời đúng bốn câu hỏi trên. Kênh nhận thông báo/người chịu trách nhiệm là quyết định còn mở, không tự gửi Slack/email.

## Contract sự kiện đề xuất

Ví dụ dữ liệu giả lập, chưa phải log đã thu được:

```json
{
  "event": "account_status_changed",
  "requestId": "generated-or-validated-id",
  "entryPoint": "admin_http",
  "actorId": 7,
  "targetId": 21,
  "before": "ACTIVE",
  "after": "LOCKED",
  "outcome": "committed"
}
```

`actorId`/`targetId` thuộc audit được phân quyền, **không** là label metrics. Không gán `committed` trước khi transaction thực sự commit. Nếu thêm đường vào từ CLI/scheduler, tạo `entryPoint` ở chính điểm vào và truyền cùng request/run ID.

## Cảnh báo và runbook

Ngưỡng dưới đây cần được chốt từ baseline/SLO; chưa có số liệu để bật một con số tùy ý:

| Triệu chứng                                         | Hành động                                           | Runbook tối thiểu                                                                            |
| --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 5xx tăng kéo dài ở tạo đơn hoặc khoản chi           | Page khi vượt ngưỡng đã chốt, không báo mọi 400/409 | Kiểm tra deployment, request ID mẫu và pool DB; dừng rollout nếu tính đúng đắn bị ảnh hưởng. |
| Tỷ lệ tìm đường thất bại tăng, luồng chính vẫn chạy | Ticket hoặc page tùy SLO                            | Kiểm tra timeout/status provider; cho tiếp tục bằng địa chỉ và số liên hệ đã được phép xem.  |
| Không lưu được minh chứng                           | Phân mức theo ảnh hưởng nghiệp vụ                   | Kiểm tra quyền ghi/dung lượng và lỗi transaction; không công khai thư mục ảnh để chữa tạm.   |

Mỗi cảnh báo cần owner, thời gian đánh giá và liên kết runbook có thật. Không khẳng định kênh thông báo hoạt động trước khi bắn thử được chủ hệ thống cho phép.

## Nghiệm thu

- [ ] Gây lỗi có kiểm soát trong môi trường thử, tìm được request từ response → log → JDBC/provider; không phải mở mã để đoán.
- [ ] Request ID/MDC không rò sang request sau hoặc mất qua async boundary đã sử dụng.
- [ ] Metric có label hữu hạn; histogram xem được p50/p95/p99; không có PII/ID riêng lẻ trong label.
- [ ] Log và trace thực tế không có password/hash/token/cookie/body/địa chỉ/tọa độ không cần thiết.
- [ ] Audit khóa/mở có đúng người thực hiện, trước/sau, timestamp và kết quả; rollback không ghi một lần thay đổi thành công giả.
- [ ] Cảnh báo đã được thử một lần, tới đúng nơi và runbook có người chịu trách nhiệm.

Phụ thuộc: [18 bảo mật](18-security-and-hardening.md), [21 CI](21-ci-cd-and-automation.md), [25 phát hành](25-shipping-and-launch.md). Liên quan V11–V12 trong [báo cáo rà soát](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Prompt bàn giao

> Áp dụng skill observability-and-instrumentation cho luồng khóa/mở tài khoản VCoi. Đọc bốn câu hỏi và contract ở tài liệu này, giới hạn một lát cắt, xác minh API theo phiên bản Spring trước khi dùng. Viết test cho actor/audit/rollback và redaction. Không xuất PII hoặc tự gửi sự kiện sang bên thứ ba. Báo rõ tín hiệu nào đã nhìn thấy trong runtime và tín hiệu nào còn chưa có.
