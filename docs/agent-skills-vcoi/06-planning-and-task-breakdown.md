# 06 — Chia việc VCOI thành các lát kiểm chứng được

> **DRAFT · 29/10/2026** — Backlog kỹ thuật đề xuất; chưa giao triển khai hoặc đánh dấu task runtime hoàn tất.
> Skill gốc: [planning-and-task-breakdown, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/planning-and-task-breakdown/SKILL.md).
> Tham chiếu: [Definition of Done](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/definition-of-done.md).

## Mục tiêu và đầu vào

Mỗi task phải kết thúc bằng hành vi quan sát được, khoảng tối đa 5 file và một bước kiểm chứng có ý nghĩa.
Đây là bảng phân rã mẫu cho [capability map DRAFT](04-spec-driven-development.md); không giả định spec đã được phê duyệt.
Kế hoạch tổng và trạng thái task dùng [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md) của bộ hồ sơ.
Các mã Txx dưới đây tham chiếu task canonical; phần này giải thích lát cắt, không duy trì checklist trạng thái thứ hai.
Trước khi tạo kế hoạch thực thi ở `tasks/` gốc dự án phải đọc kế hoạch hiện có; không ghi đè việc khác đang dang dở.

## Bằng chứng và đồ thị phụ thuộc

- [README:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7): archive test nằm ngoài Git, không chắc có thể khôi phục nguyên bộ.
- [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10): cần tạo lại đường chạy test thay vì gọi script lịch sử.
- [CustomerOrderService:43](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43) và [CustomerAddressService:34](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34): một lát V05 nhỏ, có khác biệt hợp đồng tái hiện được.
- [AccountService:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119): V01 cần schema tương thích trước khi dùng thông tin thu hồi phiên mới.

```text
T01 test frontend ────────┬── T04 CI có suite thật
T02 test backend ─────────┘      T21 hướng dẫn cập nhật cùng mỗi lát
  ├── T03 fixture SQL Server cho migration/cạnh tranh
  ├── T05 địa chỉ lưu được phải đặt lịch được
  └── T06 schema phiên tương thích ── T07 cookie cũ hết hiệu lực sau khóa–mở
```

T01/T02 là nền tái lập có hành vi cụ thể; T06 mở rộng dữ liệu có chủ đích, chưa đổi hành vi auth; SQL Server thật xem T03.
Không làm hết database rồi hết API rồi hết UI; T05 hoàn thành một đường nhập địa chỉ đang có UI/frontend validator.

## T01 — Chạy test validator địa chỉ frontend từ clone mới

**Phụ thuộc:** không; đọc rule chất lượng trước. **Quy mô:** M, tối đa 3 file.
**File PROPOSED:** `Frontend VCoi/package.json`, `vitest.config.js` trong frontend, `src/features/customer/address-contract.test.js`.
**Acceptance:** runner phát hiện >0 test; 599/600 nhận, 601 bị chặn theo schema hiện có; ward/district rỗng được chuẩn hóa đúng.
**Verify:** sau khi tạo cấu hình/test, `(cd 'Frontend VCoi' && npx --no-install vitest run src/features/customer/address-contract.test.js)`; `npm --prefix 'Frontend VCoi' run check`.
**Giới hạn:** ca hiện trạng frontend này có thể đã xanh; không giả vờ nó chứng minh backend đã từ chối 601.

## T02 — Tái lập test backend với một HTTP case địa chỉ

**Phụ thuộc:** không; dùng test dependency hiện có. **Quy mô:** M, tối đa 3 file.
**File PROPOSED:** `src/test/java/com/ecothugom/SmokeTests.java`, `src/test/resources/application-test.properties`, `src/test/resources/schema-test.sql` trong backend.
**Acceptance:** đăng nhập CUSTOMER bằng fixture giả, lưu địa chỉ hợp lệ 600 thành công, người khác không đọc được; test chạy không cần archive ngoài Git.
**Verify:** `(cd ecothugom-backend && sh ./mvnw -B -Dtest=SmokeTests test)` sau khi test tồn tại; báo count >0 và scope H2.
**Giới hạn:** schema H2 chỉ cho bài toán này; không tái tạo toàn SQL Server bằng một fixture giả rồi suy rộng kết luận.

## Điểm kiểm tra sau T01–T02

Test ở cả hai dự án được phát hiện >0, build hiện hành chạy được; lưu log số test và lỗi môi trường nếu có.
Mô tả rõ khác biệt test hiện trạng, test hồi quy và test cần SQL Server; không đổi kết quả H2 thành chứng minh production.

## T05 — CUSTOMER không lưu được địa chỉ vượt hợp đồng đặt lịch

**Phụ thuộc:** T01, T02; R-A01. **Quy mô:** M, tối đa 4 file.
**File:** `CreateCollectionOrderRequest.java`, `PickupAddressFormatter.java` (đề xuất), `CustomerOrderService.java`, `AddressValidationTests.java` (đề xuất) trong backend theo đường dẫn task canonical.
**Acceptance:** test mới cho POST/PUT 601 đỏ trước sửa rồi nhận 400 sau sửa; 599/600 nhận; sửa địa chỉ không đổi snapshot đơn cũ.
**Verify:** focused `AddressValidationTests`, Maven verify và frontend check; walkthrough form hiện có để thấy lỗi địa chỉ không làm mất bản nhập.
**Phạm vi:** thống nhất chuẩn hóa/ghép; không thêm revision địa chỉ hoặc viết lại form trong cùng task.

## T06 — Chốt chính sách và mở rộng schema phiên tương thích

**Phụ thuộc:** T02; ghi quyết định I02 về ý nghĩa khóa trước patch schema; chưa coi là quyết định đã duyệt. **Quy mô:** M, tối đa 3 file.
**File:** `docs/decisions/session-revocation.md` (đề xuất), backend `scripts/sql/migrations/session-version.sql` (đề xuất), `auth/UserAccount.java`.
**Acceptance:** dữ liệu mới/cũ có giá trị version hợp lệ; chạy migration lặp theo hợp đồng không phá dữ liệu; code cũ còn chạy khi cột mới chưa được dùng.
**Verify:** migration trên SQL Server thử nghiệm theo T03 có bản sao dữ liệu giả; đối chiếu schema/dữ liệu trước/sau; ghi đường rollback/forward-fix.
**Phạm vi:** chỉ mở rộng tương thích, chưa tuyên bố thu hồi cookie; không chạy migration trên dữ liệu thật trong nhiệm vụ soạn tài liệu.

## T07 — Mọi cookie cũ hết hiệu lực sau khóa–mở

**Phụ thuộc:** T06 và chính sách thu hồi được ghi nhận. **Quy mô:** M, tối đa 4 file.
**File:** `auth/AccountService.java`, `auth/SessionPrincipal.java`, `auth/AccountSessionFilter.java`, `src/test/java/com/ecothugom/auth/SessionRevocationTests.java` trong backend.
**Acceptance:** hai phiên cũ không request lúc LOCKED đều nhận 401 sau mở; login mới thành công; đổi tên/email không thu hồi phiên ngoài chính sách.
**Verify:** focused `SessionRevocationTests`, Maven verify; kiểm tra session/CSRF qua HTTP thật; test race SQL Server nếu task bao gồm cạnh tranh.
**Phạm vi:** thu hồi phiên; không đồng thời thêm bàn giao V02, Redis hoặc audit tài khoản đầy đủ V11.

## Điểm kiểm tra sau T05–T07

Ca hồi quy cho lỗi cũ đỏ trước/xanh sau; phiên mới và luồng đặt lịch hợp lệ còn hoạt động.
Review compatibility schema, quyền và diff floor; kết quả migration phải ghi đúng SQL Server hay H2.

## T04/T21 — Đưa kiểm chứng và hướng dẫn vào đường chạy thật

| Task                    | Phụ thuộc, file dự kiến                                                                                                  | Acceptance và verify                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T04 CI chạy suite thật  | T01/T02; integration cần T03; tối đa 1 file: `.github/workflows/ci.yml`                                                  | PR/push main chạy lint → test → build; suite rỗng đỏ; thử một lint lỗi và một assertion lỗi; xem log/artifact của job thật. Workflow là PROPOSED.            |
| T21 Hướng dẫn clone mới | Cập nhật theo từng lát; tối đa 4 file: `README.md`, `docs/history/README-history.md`, `docs/setup.md`, `docs/testing.md` | Người mới chạy theo lệnh hiện hành không cần ổ D:; lệnh lịch sử tách rõ; đối chiếu file/lệnh với checkout và ghi kết quả chạy. Các tệp docs mới là PROPOSED. |

Điểm kiểm tra T04/T21: không chỉ đọc YAML; cố ý gây lỗi phải thấy job đỏ, sửa lại thấy job xanh với count >0; không cần đợi T07 mới làm CI.

## Các nhánh còn phải phân rã sau quyết định

| Module                               | Đầu vào cần có trước khi lập task code                                 | Giới hạn để không thành task khổng lồ                                                          |
| ------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| collector-recovery / V02             | Ma trận từng trạng thái, dữ liệu giữ lại, trách nhiệm chi, audit actor | Mỗi lát một trạng thái/nhóm tương đương; hợp đồng trước UI; mỗi task ≤5 file.                  |
| edit-concurrency / V03               | Chọn biểu mẫu và hợp đồng revision/409                                 | Bắt đầu một tài nguyên; migration tương thích → API → UI conflict thành các lát nhỏ.           |
| money-contract / V06                 | Hạn mức VND, kiểu truyền và làm tròn                                   | Unit price → tổng quote → khoản chi/báo cáo; mỗi lát có test biên, không thay tất cả một bước. |
| reporting-snapshot / V04             | Ngữ nghĩa snapshot/cohort/expiry và kiểu tiền                          | Hợp đồng/provider → client chung snapshot → export; test giao dịch xen giữa các lần đọc.       |
| operations, maps-readiness / V10–V13 | Mục tiêu vận hành, quyền dữ liệu, hạ tầng và nhà cung cấp              | Tách HTTPS/session, audit, restore DB+ảnh, vị trí xuất phát thành task độc lập.                |

## Rủi ro, trạng thái và prompt bàn giao

Archive không truy cập được: viết lại ca quan trọng tối thiểu, không khẳng định khôi phục toàn bộ suite cũ.
Không có SQL Server: tiếp tục phần test độc lập, giữ acceptance khóa/migration/cạnh tranh ở trạng thái chưa kiểm chứng.
Đã áp dụng cho hồ sơ: đồ thị, lát nhỏ, dependencies, acceptance, checkpoint và rủi ro; chưa tạo mã/test/workflow hay chạy các lệnh PROPOSED.

```text
Đọc 06 và tasks/plan.md/tasks/todo.md. Chọn một task canonical, map về capability và R-ID.
Đọc file thực tế trước sửa, kiểm tra kích thước ≤5 file; tách tiếp nếu vượt hoặc dính module khác.
Ghi failing case, exact command, count và môi trường. Không tick done chỉ từ build hoặc tài liệu.
Giữ kế hoạch dang dở, không ghi đè hoặc tự tạo tracker ngoài phạm vi được giao.
```

Phụ thuộc: [04](04-spec-driven-development.md), [05](05-constraint-driven-development.md), [07](07-context-engineering.md), [08](08-source-driven-development.md).
