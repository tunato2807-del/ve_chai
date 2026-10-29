# Task list áp dụng VCoi — DRAFT

Tất cả task sửa ứng dụng dưới đây **chưa thực hiện trong lượt tạo bộ tài liệu**. Không thay thế một kế hoạch đang dở ở gốc repository. Xem [plan.md](plan.md) và [capability map](../CAPABILITY-MAP.md). Những đường dẫn “đề xuất” chưa tồn tại ở commit nền; lệnh test mới chỉ hợp lệ sau khi harness đã được tạo và xác minh. Mỗi task phải xem lại HEAD và hợp đồng tại lúc bắt đầu.

Các task T09/T17 là **task phân rã**, không phải giấy phép sửa nhiều module một lần. Danh sách consumer chưa biết đủ thì giữ việc triển khai ở trạng thái chờ phân rã.

## [ ] T01 — Khôi phục harness frontend tối thiểu

**Module:** `verification`. **Phụ thuộc:** —. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `Frontend VCoi/package.json`
- `Frontend VCoi/vitest.config.js (đề xuất)`
- `Frontend VCoi/src/features/customer/address-contract.test.js (đề xuất)`

**Nghiệm thu:**

- [ ] Chạy được runner và phát hiện ít nhất một test; phục hồi hoặc viết mới có nguồn rõ ràng.
- [ ] Ca validator có kết quả quan sát được, không chép số test lịch sử.

**Kiểm chứng:** Chạy lệnh test vừa khai báo (chưa tồn tại tại commit nền), rồi npm run check; lưu số test thực thi.

## [ ] T02 — Khôi phục harness backend tối thiểu

**Module:** `verification`. **Phụ thuộc:** —. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/test/java/com/ecothugom/SmokeTests.java (đề xuất)`
- `ecothugom-backend/src/test/resources/application-test.properties (đề xuất)`
- `ecothugom-backend/src/test/resources/schema-test.sql (đề xuất)`

**Nghiệm thu:**

- [ ] Có test thực thi thật và fixture không chứa dữ liệu thật.
- [ ] Nêu rõ test nào dùng H2, test nào cần SQL Server; không đổi schema sản phẩm để qua test.

**Kiểm chứng:** Chạy mvnw test với fixture mới, lưu số test; mvnw verify với JDK 21 đầy đủ.

## [ ] T03 — Chuẩn bị kiểm thử SQL Server tách biệt

**Module:** `verification`. **Phụ thuộc:** T02. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/pom.xml (chỉ nếu dependency đã chốt)`
- `ecothugom-backend/src/test/java/com/ecothugom/SqlServerFixture.java (đề xuất)`
- `ecothugom-backend/src/test/java/com/ecothugom/PaymentConcurrencyTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Môi trường thử không trỏ vào EcoThuGomDB có dữ liệu người dùng.
- [ ] Hai request ghi khoản chi cạnh tranh cho đúng kết quả; kiểm tra filtered unique index thật.

**Kiểm chứng:** Chạy trên SQL Server được cấp cho test; báo rõ skip/fail nếu không có, không đổi sang H2 để gắn nhãn đạt.

## [ ] T04 — Thêm CI cho hai dự án

**Module:** `verification`. **Phụ thuộc:** T01, T02; integration phụ thuộc T03. **Phạm vi dự kiến:** 1 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `.github/workflows/ci.yml (đề xuất)`

**Nghiệm thu:**

- [ ] PR/push main chạy lint, test, build; suite bắt buộc không có test phải fail.
- [ ] Lỗi cố ý trong nhánh thử làm check đỏ; không viết lại lockfile hoặc dùng secret production.

**Kiểm chứng:** Xác minh workflow bằng một PR/nhánh kiểm tra sau khi được giao bật CI; kiểm tra lại bộ lệnh thực tế.

## [ ] T05 — Từ chối địa chỉ không dùng được ngay khi lưu

**Module:** `pickup-address`. **Phụ thuộc:** T01, T02. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/orders/CreateCollectionOrderRequest.java`
- `ecothugom-backend/src/main/java/com/ecothugom/orders/PickupAddressFormatter.java (đề xuất)`
- `ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java`
- `ecothugom-backend/src/test/java/com/ecothugom/orders/AddressValidationTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Địa chỉ ghép 606 ký tự bị từ chối tại thêm/sửa, không đợi lúc đặt lịch.
- [ ] Biên 599/600/601 sau chuẩn hóa đúng; cùng cách ghép địa chỉ trong validator và snapshot.

**Kiểm chứng:** Quan sát test RED theo hành vi mong muốn trước sửa, GREEN sau sửa; regression địa chỉ lưu và snapshot đơn cũ.

## [ ] T06 — Chốt chính sách và schema thu hồi phiên

**Module:** `identity`. **Phụ thuộc:** T02; chính sách V01 còn cần chốt. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/decisions/session-revocation.md (đề xuất)`
- `ecothugom-backend/scripts/sql/migrations/session-version.sql (đề xuất)`
- `ecothugom-backend/src/main/java/com/ecothugom/auth/UserAccount.java`

**Nghiệm thu:**

- [ ] Có contract khi nào tăng sessionVersion và cách xử lý phiên đang tồn tại.
- [ ] Migration thêm trường không phá đọc/ghi hiện tại; có kế hoạch rollback không phục hồi cookie bị thu hồi.

**Kiểm chứng:** Review chính sách; thử migration trên bản DB thử và xác minh dữ liệu trước/sau, chưa chạm production.

## [ ] T07 — Thực thi thu hồi phiên khi khóa/mở

**Module:** `identity`. **Phụ thuộc:** T06. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java`
- `ecothugom-backend/src/main/java/com/ecothugom/auth/SessionPrincipal.java`
- `ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java`
- `ecothugom-backend/src/test/java/com/ecothugom/auth/SessionRevocationTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Khóa–mở không request xen giữa vẫn thu hồi mọi phiên cũ; login mới đúng.
- [ ] Sửa hồ sơ không làm logout ngoài chính sách; đổi mật khẩu và multi-session không hồi quy.

**Kiểm chứng:** Test hành vi và HTTP thật; kiểm tra race có kiểm soát với fixture T03 nếu cần.

## [ ] T08 — Chốt phạm vi concurrency của biểu mẫu

**Module:** `edit-concurrency`. **Phụ thuộc:** T01, T02. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/decisions/edit-concurrency.md (đề xuất)`
- `ecothugom-backend/docs/admin-catalog-openapi.json`

**Nghiệm thu:**

- [ ] Chọn module nào cần revision và cách trả 409 cho dữ liệu cũ; ghi rõ lựa chọn last-write-wins nếu giữ.
- [ ] Có contract rollout tương thích cho client cũ và mới.

**Kiểm chứng:** Review kịch bản hai tab, schema request/response và consumer tương ứng; chưa triển khai tất cả module trong task này.

## [ ] T09 — Lập lát cắt revision cho một biểu mẫu

**Module:** `edit-concurrency`. **Phụ thuộc:** T08. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `tasks/todo.md ở vị trí đã chọn`
- `docs/specs/edit-concurrency-category.md (đề xuất)`

**Nghiệm thu:**

- [ ] Chia migration/entity, API/test và frontend/test thành các task nhỏ có checkpoint tương thích.
- [ ] Danh mục được chọn trước; profile/địa chỉ/vật liệu là task riêng, không thêm version hàng loạt.

**Kiểm chứng:** Chỉ chuyển sang code khi danh sách file từng task không vượt khoảng 5 file và đường tương thích đã rõ.

## [ ] T10 — Chốt contract bàn giao ngoại lệ

**Module:** `collector-recovery`. **Phụ thuộc:** T07. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/decisions/collector-handoff.md (đề xuất)`
- `ecothugom-backend/docs/collection-workflow-openapi.json`

**Nghiệm thu:**

- [ ] Quy định trạng thái cho phép, actor, cân/ảnh/quote/payment và lịch sử được giữ.
- [ ] Người cũ bị khóa không bắt buộc mở lại để người mới làm tiếp; không mở mọi trạng thái tùy ý.

**Kiểm chứng:** Walkthrough EN_ROUTE, ARRIVED, AWAITING_SELLER_APPROVAL và AWAITING_PAYMENT với chủ nghiệp vụ.

## [ ] T11 — Triển khai bàn giao ARRIVED ở backend

**Module:** `collector-recovery`. **Phụ thuộc:** T10, T03. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeRequests.java`
- `ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java`
- `ecothugom-backend/src/main/java/com/ecothugom/orders/AdminOrderController.java`
- `ecothugom-backend/src/test/java/com/ecothugom/orders/HandoffTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Chỉ trạng thái/policy đã chốt; kiểm tra ACTIVE, lịch, version, ownership và audit trong transaction.
- [ ] Sai version/race/nhân viên bị khóa không làm thay dữ liệu; giữ phiếu cân theo contract.

**Kiểm chứng:** TDD tập trung và integration SQL Server; nếu cần schema mới, dừng lát cắt và tách migration trước.

## [ ] T12 — Giao diện bàn giao theo contract

**Module:** `collector-recovery`. **Phụ thuộc:** T11, T01. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `Frontend VCoi/src/features/orders/ReassignmentForm.jsx`
- `Frontend VCoi/src/features/orders/dispatch-api.js`
- `Frontend VCoi/src/features/orders/AdminDispatch.jsx`
- `Frontend VCoi/src/features/orders/handoff.test.jsx (đề xuất)`

**Nghiệm thu:**

- [ ] Cho admin xem lại đúng người/trạng thái/lý do và xác nhận theo API mới.
- [ ] 409/timeout khóa thao tác đến khi đọc lại; không tự gửi lại lệnh bàn giao.

**Kiểm chứng:** Component test và browser ba vai trò, gồm người cũ mất quyền xem đơn/ảnh.

## [ ] T13 — Chốt thiết kế snapshot báo cáo

**Module:** `reporting-snapshot`. **Phụ thuộc:** T03. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/decisions/report-snapshot.md (đề xuất)`
- `ecothugom-backend/docs/reporting-contract.md (đề xuất)`

**Nghiệm thu:**

- [ ] Chọn guarantee một tập dữ liệu cho overview, chi tiết, export và các trang.
- [ ] Đánh giá isolation SQL Server, phantom, chi phí và quyền cấu hình trước khi thay.

**Kiểm chứng:** Có testplan giao dịch đồng thời và tiêu chí tổng tiền/khối lượng khớp; không tự bật database option.

## [ ] T14 — Tạo API báo cáo nhất quán

**Module:** `reporting-snapshot`. **Phụ thuộc:** T13. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java`
- `ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportController.java`
- `ecothugom-backend/src/test/java/com/ecothugom/reports/ReportSnapshotTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Kết quả API theo snapshot contract; không chỉ gộp HTTP mà vẫn đọc nhiều thời điểm.
- [ ] Test có insert thanh toán giữa các lần đọc trên SQL Server; không chỉ assert mock.

**Kiểm chứng:** Integration T03 và kiểm tra tổng theo kỳ, đơn tranh chấp đã trả tiền, vật liệu nhiều nhóm.

## [ ] T15 — Đồng bộ giao diện/export với snapshot

**Module:** `reporting-snapshot`. **Phụ thuộc:** T14, T01. **Phạm vi dự kiến:** 5 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `Frontend VCoi/src/features/admin/useAdminReports.js`
- `Frontend VCoi/src/features/admin/reports-api.js`
- `Frontend VCoi/src/pages/AdminReportsPage.jsx`
- `Frontend VCoi/src/features/admin/reports-export.js`
- `Frontend VCoi/src/features/admin/report-snapshot.test.js (đề xuất)`

**Nghiệm thu:**

- [ ] Overview, biểu đồ, CSV/XLSX dùng cùng tập dữ liệu hoặc token.
- [ ] Không xuất khi thiếu hoặc mâu thuẫn; không cộng paidOrders từng vật liệu thành tổng đơn.

**Kiểm chứng:** Test hai phản hồi 44.000/48.000 VND bị từ chối theo contract mới; kiểm tra xuất file trong trình duyệt và mở file thật trong môi trường có Excel/LibreOffice.

## [ ] T16 — Chốt giới hạn/kiểu tiền VND

**Module:** `money-contract`. **Phụ thuộc:** T01, T02. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/decisions/money-contract.md (đề xuất)`
- `ecothugom-backend/docs/money-contract.md (đề xuất)`

**Nghiệm thu:**

- [ ] Chọn giới hạn nghiệp vụ hoặc chuỗi thập phân chính xác; bao gồm tổng dòng, tổng đơn, tổng báo cáo.
- [ ] Có rollout theo version client; không làm tròn ngầm hoặc đổi JSON type một phía.

**Kiểm chứng:** Đối chiếu DTO, Zod, SQL DECIMAL và mọi consumer bằng ví dụ sát biên đã chốt.

## [ ] T17 — Lập lát cắt thực thi hợp đồng tiền

**Module:** `money-contract`. **Phụ thuộc:** T16. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `tasks/todo.md ở vị trí đã chọn`
- `docs/specs/money-rollout.md (đề xuất)`

**Nghiệm thu:**

- [ ] Tách tương thích dữ liệu đọc, validation backend, parser client, export và chuyển hợp đồng thành các task không quá khoảng 5 file.
- [ ] Mỗi lát cắt có case giữ nguyên chính xác và lộ trình client cũ; chưa đổi toàn bộ tiền trong một commit.

**Kiểm chứng:** Đếm consumer trước khi chốt patch; test biên đơn giá, tổng nhiều dòng, HALF_UP và tổng hợp lớn.

## [ ] T18 — Kiểm chứng tích hợp báo cáo và tiền

**Module:** `reporting-snapshot + money-contract`. **Phụ thuộc:** T15, các task thực thi sinh từ T17. **Phạm vi dự kiến:** 2 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/test/java/com/ecothugom/reports/ReportMoneyContractTests.java (đề xuất)`
- `Frontend VCoi/src/features/admin/report-money.test.js (đề xuất)`

**Nghiệm thu:**

- [ ] Tổng báo cáo giữ đúng tiền/khối lượng sau payment và khiếu nại.
- [ ] Chặn schema không tương thích, tổng vượt miền đã chọn và dữ liệu snapshot lệch.

**Kiểm chứng:** SQL Server concurrency, frontend contract test và file xuất thực; không chỉ kiểm tra mỗi helper.

## [ ] T19 — Audit thay đổi trạng thái tài khoản

**Module:** `operations`. **Phụ thuộc:** T07, T03. **Phạm vi dự kiến:** 5 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/auth/AdminUserController.java`
- `ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java`
- `ecothugom-backend/src/main/java/com/ecothugom/auth/AccountAudit.java (đề xuất)`
- `ecothugom-backend/scripts/sql/migrations/account-audit.sql (đề xuất)`
- `ecothugom-backend/src/test/java/com/ecothugom/auth/AccountAuditTests.java (đề xuất)`

**Nghiệm thu:**

- [ ] Actor, target, before/after, timestamp, outcome được lưu đúng và có quyền đọc phù hợp.
- [ ] Rollback không ghi audit thành công giả; không lưu password, cookie, CSRF hoặc body.

**Kiểm chứng:** Test transaction/audit + kiểm tra log runtime bằng dữ liệu giả lập.

## [ ] T20 — Thêm request ID và telemetry tối thiểu

**Module:** `operations`. **Phụ thuộc:** T19; lựa chọn instrumentation phải chốt. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `ecothugom-backend/src/main/java/com/ecothugom/common/RequestIdFilter.java (đề xuất)`
- `ecothugom-backend/src/main/resources/logback-spring.xml (đề xuất)`
- `ecothugom-backend/src/test/java/com/ecothugom/RequestIdTests.java (đề xuất)`
- `docs/runbooks/request-errors.md (đề xuất)`

**Nghiệm thu:**

- [ ] Correlation được tạo/validate và dọn MDC đúng; log có cấu trúc, không PII.
- [ ] Chọn phạm vi RED/tracing, label hữu hạn; không tự tích hợp dịch vụ ngoài nếu chưa giao.

**Kiểm chứng:** Gây lỗi trong staging, tìm bằng request ID; chỉ đánh dấu metrics/tracing khi đã thấy series/span thực; tách task nếu cần dependency mới.

## [ ] T21 — Tách hướng dẫn hiện hành khỏi lịch sử

**Module:** `docs-handoff`. **Phụ thuộc:** Có thể đi cùng mỗi lát cắt. **Phạm vi dự kiến:** 4 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `README.md`
- `docs/history/README-history.md (đề xuất)`
- `docs/setup.md (đề xuất)`
- `docs/testing.md (đề xuất)`

**Nghiệm thu:**

- [ ] Lệnh hiện hành chạy được từ clone; script thiếu được phân loại không ngụy tạo.
- [ ] Giữ quyết định/lịch sử và cập nhật link nguồn; không xóa báo cáo cũ đã có ngữ cảnh.

**Kiểm chứng:** Kiểm tra liên kết, scriptname và chạy theo quick start trong checkout mới phù hợp Windows/SQL Server.

## [ ] T22 — Diễn tập backup/restore và cấu hình pilot

**Module:** `operations`. **Phụ thuộc:** T03; mục tiêu vận hành cần chốt. **Phạm vi dự kiến:** 3 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/runbooks/backup-restore.md (đề xuất)`
- `docs/deployment.md (đề xuất)`
- `ecothugom-backend/src/main/resources/application-pilot.properties (đề xuất nếu cần)`

**Nghiệm thu:**

- [ ] Khôi phục DB và thư mục ảnh cùng nhau; ownership và biên nhận đúng.
- [ ] HTTPS, cookie, SQL TLS, profile và khởi động lại phiên có bằng chứng; không ghi secret trong Git.

**Kiểm chứng:** Môi trường staging riêng; ghi RTO/RPO đã đo; chưa chạm DB production hoặc DNS thật.

## [ ] T23 — Đánh giá sẵn sàng demo/pilot

**Module:** `operations`. **Phụ thuộc:** Các bản sửa được chọn đã đạt; T22 nếu dữ liệu thật. **Phạm vi dự kiến:** 1 tệp; phải chia tiếp nếu phát sinh thêm phần độc lập.

**Tệp dự kiến** (tính từ gốc repository):

- `docs/releases/pilot-readiness.md (đề xuất)`

**Nghiệm thu:**

- [ ] Bảng gate có owner, bằng chứng, rollback và thời gian quan sát; mục còn mở không bị đánh dấu đạt.
- [ ] Demo giữ nhãn mô phỏng và điểm tạm; pilot chỉ mở khi các điều kiện dữ liệu thật đạt.

**Kiểm chứng:** Theo tài liệu 25-shipping-and-launch.md; không coi push Markdown là deploy và không phát hành khi chưa có phạm vi triển khai.

## Checkpoint chung

- [ ] A — T01–T04 có test thực thi, CI phát hiện lỗi, SQL Server kiểm chứng riêng.
- [ ] B — T05–T09 có regression và không làm mất snapshot/ownership.
- [ ] C — T10–T12 có bàn giao theo chính sách, quyền và lịch sử đúng.
- [ ] D — T13–T18 khớp tiền/khối lượng trong giao dịch đồng thời và file xuất.
- [ ] E — T19–T23 có tín hiệu vận hành, restore và cổng phát hành phù hợp mục tiêu.

Không ghi ngày hoàn tất/owner giả định. Khi bắt đầu triển khai, bổ sung người chịu trách nhiệm và đường dẫn bằng chứng từng task; checkbox chỉ đổi sau kiểm chứng.
