# Kế hoạch áp dụng — sửa từng lát cắt VCoi

**DRAFT.** Phạm vi hiện đã được giao là tạo bộ tài liệu Markdown. Kế hoạch dưới đây là đầu vào cho lần triển khai tiếp theo; chưa có task sửa ứng dụng nào được làm trong lượt này. Task list chính của gói: [todo.md](todo.md). Chưa chọn external tracker.

## Nền và mục tiêu

Nguồn `1250080247-cloud/VCOI@2c804bc8090dee4dcdb2ca150404c534ce35f669`. Giữ stack Java 21/Spring Boot/SQL Server và React/Vite, một đại lý, thanh toán mô phỏng. Mục tiêu đầu tiên là có regression chạy lại được, rồi sửa các lỗi/giới hạn được xác nhận trong [báo cáo](../../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md). Không mở rộng thành sàn nhiều đại lý.

## Thứ tự và checkpoint

1. **T01–T04:** harness frontend/backend, SQL Server integration và CI. Checkpoint A: có test thực thi, lỗi cố ý làm CI đỏ, build không bị đổi dependency ngoài ý định.
2. **T05–T09:** địa chỉ, thu hồi phiên và concurrency theo phạm vi đã chốt. Checkpoint B: ca lỗi RED trước sửa/GREEN sau sửa, regression ownership và snapshot lịch sử vẫn đạt.
3. **T10–T12:** chốt và triển khai bàn giao ngoại lệ theo giai đoạn. Checkpoint C: người cũ bị khóa không còn quyền; người mới tiếp tục được, lịch sử không mất.
4. **T13–T18:** snapshot báo cáo và hợp đồng tiền, chia backend/client/contract thành lát cắt có thể kiểm tra riêng. Checkpoint D: giao dịch đồng thời trên SQL Server không làm lệch báo cáo; tiền không làm tròn ngầm.
5. **T19–T23:** audit/telemetry, tài liệu hiện hành, backup/restore/cấu hình và pilot readiness theo nhu cầu thực. Checkpoint E: có dữ liệu quan sát và diễn tập khôi phục trước khi tiếp nhận dữ liệu thật.

Các nhánh độc lập có thể chuẩn bị tài liệu/test riêng sau khi hợp đồng đã chốt. Không áp migration đồng thời hoặc để hai task ghi cùng schema/DTO mà chưa điều phối. Mọi task phải xem lại HEAD và kế hoạch đang dở trước khi bắt đầu.

## Quyết định kỹ thuật đang mở

- Nguồn archive test có thể truy cập hay cần viết lại harness tối thiểu? Không chép số lượng test lịch sử thành mục tiêu đã đạt.
- Thu hồi phiên, phạm vi chống ghi đè, trạng thái bàn giao và bảo toàn quote/cân/khoản chi cần chính sách thống nhất.
- SNAPSHOT transaction, tập kết quả có token hay một truy vấn báo cáo: cần đo và kiểm chứng SQL Server; không tự bật tùy chọn database production.
- Giới hạn VND nghiệp vụ hay chuỗi thập phân: ảnh hưởng cả API/client/export, cần hợp đồng và rollout tương thích.
- Mục tiêu đồ án hay pilot thật; owner, hosting, retention, SLO/RTO/RPO chưa chốt.

Đây là đề xuất cho người thực hiện xét, không phải lý do ngăn việc viết bộ tài liệu đã được yêu cầu. Khi được giao sửa một lỗi cụ thể với chính sách đủ rõ, tiến hành trong phạm vi đó, không hỏi lại các phê duyệt đã có.

## Rủi ro và kiểm chứng

| Rủi ro                                   | Giảm thiểu                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Build xanh nhưng không có test           | Fail nếu suite cần thiết không tìm thấy test, lưu số test thực thi.                        |
| H2 bỏ sót filtered index/locking/phantom | Job SQL Server cho các ca cạnh tranh; báo rõ H2 chỉ bổ sung.                               |
| Migration làm ứng dụng cũ không đọc được | Expand/backfill/verify trước switch, diễn tập rollback tương thích.                        |
| Refactor đồng thời với đổi nghiệp vụ     | Tách commit/task; test bảo toàn trước khi đơn giản hóa.                                    |
| Gói tài liệu bị coi là lệnh deploy       | Mọi quyết định triển khai/flag/database giữ trạng thái chưa làm; đọc cổng phát hành riêng. |

## Definition of Done dự thảo

Một task chỉ hoàn tất khi acceptance criteria của task và các điều kiện chung cùng đạt: test hành vi có ý nghĩa, runtime phù hợp, regression liên quan, lint/build, không đổi scope/credential, hợp đồng/tài liệu cập nhật, đường quay lại rõ cho thay đổi rủi ro. Đánh dấu thông qua người có trách nhiệm theo quy trình repository khi merge/deploy; không bịa phê duyệt hoặc bắt hỏi lại điều đã được giao.

Các lệnh test tập trung ở todo là **mục tiêu sau khi tạo harness**, trừ khi được ghi hiện có. Không chạy chúng rồi báo ứng dụng lỗi chỉ vì script chưa được khai báo tại commit nền.
