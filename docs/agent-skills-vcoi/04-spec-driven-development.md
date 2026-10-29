# 04 — Đặc tả theo capability cho VCOI

> **DRAFT · 29/10/2026** — Capability map và đặc tả mẫu để rà soát; không phải map/spec đã được phê duyệt.
> Skill gốc: [spec-driven-development, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/spec-driven-development/SKILL.md).
> Baseline: [VCOI 2c804bc](https://github.com/1250080247-cloud/VCOI/tree/2c804bc8090dee4dcdb2ca150404c534ce35f669).

## Mục tiêu, stack và giả định

Chuyển V01–V13 thành các capability độc lập để một thay đổi có thể được nghiệm thu mà không phải hiểu toàn bộ dự án.
Giữ một đại lý; CUSTOMER bán, COLLECTOR cân/ghi chi, ADMIN điều phối; thanh toán mô phỏng.
Stack đọc từ [package.json:19](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L19) và [pom.xml](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml): React 19.3.1/Vite 8.3.5/JavaScript/npm, Spring Boot 4.1.1/Java 21/SQL Server.
Session cookie, CSRF, ownership, lịch sử và version đơn hiện có là ràng buộc giữ lại.
Mục tiêu dùng dữ liệu thật, hạn mức VND và chính sách bàn giao vẫn cần quyết định; các mục tương ứng dưới đây là DRAFT.

## Capability map đề xuất

| Module id ổn định    | Trách nhiệm và mã vấn đề                                  | Phụ thuộc                                                   |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `verification`       | Test/fixture trong Git, CI phát hiện suite rỗng — V07–V08 | —                                                           |
| `identity`           | Thu hồi phiên khi khóa theo chính sách được chốt — V01    | verification                                                |
| `pickup-address`     | Cùng giới hạn địa chỉ khi lưu và đặt lịch — V05           | verification                                                |
| `edit-concurrency`   | Chống biểu mẫu cũ ghi đè trong phạm vi được chọn — V03    | verification                                                |
| `collector-recovery` | Bàn giao theo trạng thái, lịch và trách nhiệm — V02       | identity, verification                                      |
| `reporting-snapshot` | Tổng quan/chi tiết/export chung bộ dữ liệu — V04          | verification                                                |
| `money-contract`     | Giới hạn/kiểu/làm tròn VND nhất quán — V06                | verification                                                |
| `operations`         | Cấu hình, audit, backup khi vận hành — V10–V12            | verification; kiểm tra tương thích các bản sửa đã phát hành |
| `docs-handoff`       | Lệnh hiện hành, lịch sử, ADR và bàn giao — V09            | —; cập nhật theo từng lát                                   |
| `maps-readiness`     | Điểm xuất phát, quyền GPS, nhà cung cấp — V13             | operations khi dùng dữ liệu thật                            |

ID và phụ thuộc dùng chung [CAPABILITY-MAP.md](CAPABILITY-MAP.md); ưu tiên verification → pickup-address → identity → edit-concurrency.
Không có vòng phụ thuộc; hợp đồng provider ghi tại provider; test tích hợp reporting/money ở T18 sau hai luồng, không rải định nghĩa money khắp UI.
Đây là bản đồ phục vụ bộ tài liệu, chưa tạo các tệp `SPEC-<module-id>.md` được gắn nhãn approved.

## Yêu cầu chức năng và bằng chứng nghiệm thu

| ID    | Yêu cầu đề xuất                                                       | Acceptance quan sát được                                                                                           |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| R-Q01 | Chạy test từ clone mới                                                | Frontend/backend đều phát hiện >0 test; báo số pass/fail/skip; không cần file ngoài Git.                           |
| R-I01 | Nếu khóa có nghĩa thu hồi phiên: cookie cũ không sống lại sau mở khóa | Hai phiên đăng nhập trước khóa, không request lúc khóa, đều nhận 401 sau mở; login mới thành công.                 |
| R-D01 | Bàn giao đúng giai đoạn đã chốt                                       | Người mới ACTIVE/không trùng lịch; version cũ bị từ chối; audit có actor/lý do; quyền người cũ mất đúng.           |
| R-F01 | Phát hiện stale edit trong module được chọn                           | Hai tab cùng revision: lần lưu thứ hai trả 409, không mất thay đổi thứ nhất; UI giữ bản nháp để xem lại.           |
| R-A01 | Địa chỉ đầy đủ tối đa 600 ký tự sau chuẩn hóa/ghép                    | Thêm/sửa/đặt lịch cùng nhận 599/600 và từ chối 601; không thay snapshot đơn cũ.                                    |
| R-M01 | Tiền được backend chấp nhận phải frontend đọc chính xác               | Dưới/đúng/trên giới hạn, nhiều dòng và HALF_UP có kết quả xác định; không làm tròn âm thầm.                        |
| R-R01 | Màn hình và export cùng snapshot                                      | Có giao dịch xen giữa request vẫn tổng dòng = tổng quan = file của cùng snapshot; snapshot hết hạn có phản hồi rõ. |
| R-O01 | Khi dùng dữ liệu thật: cấu hình và khôi phục có bằng chứng            | HTTPS/session/CSRF chạy đúng; restore DB+ảnh trên môi trường mới; quyền ảnh giữ nguyên.                            |

R-D01, R-M01, R-R01 chưa đủ quyết định để tự triển khai mọi chi tiết; xem [02](02-interview-me.md).
Nguồn hiện trạng: [reassign:38](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java#L38), [save address:34](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34), [booking length:43](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43).

## Các lệnh CURRENT có thật

Chạy từ gốc repository; cần Node theo `engines`, npm >=10 và JDK 21 đầy đủ. Không cần database để lint/build hoặc Maven verify khi chưa có test runtime.

```bash
npm --prefix 'Frontend VCoi' ci --ignore-scripts
npm --prefix 'Frontend VCoi' run lint
npm --prefix 'Frontend VCoi' run build
npm --prefix 'Frontend VCoi' run check
npm --prefix 'Frontend VCoi' run dev -- --host 127.0.0.1
(cd ecothugom-backend && sh ./mvnw -B verify)
```

`check` = lint + build; không có script `test`. Maven verify ở baseline báo `No tests to run`.
Lệnh dev cần backend/database riêng nếu sử dụng API; không xem việc mở Vite là khởi động trọn hệ thống.
Nếu JDK môi trường thiếu `ct.sym`, xem workaround có ghi rõ phạm vi trong [báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md); không sửa POM để che lỗi JDK đó.

## Cấu trúc, style và chiến lược test

- `Frontend VCoi/src/features/customer/account-api.js`: schema địa chỉ; `features/booking/schema.js`: form đặt lịch.
- `ecothugom-backend/src/main/java/com/ecothugom/orders/`: controller, DTO, service và workflow.
- `ecothugom-backend/scripts/sql/`: schema/seed hiện có; `docs/`: hợp đồng HTTP/OpenAPI và hồ sơ này.
- **PROPOSED:** test backend tại `src/test/java/com/ecothugom/...`, fixture tại `src/test/resources/`; test frontend colocate `*.test.js(x)`.

Ví dụ style hiện có từ [customer/schemas.js:1](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/schemas.js#L1):

```js
import { z } from "zod";
export const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const version = z.number().int().min(0).max(2147483647);
```

Theo cấu trúc ES module/hooks và schema sẵn có; backend giữ record DTO, validation và transaction tại service.
Unit test chuẩn hóa/ghép địa chỉ; HTTP integration kiểm tra 400/ownership/rollback; browser kiểm tra lỗi và giữ bản nhập.
V01 cần HTTP với cookie thật; khóa/filtered index/thanh toán cạnh tranh cần SQL Server thật, không chỉ H2.
**PROPOSED sau khi có test/config:** `(cd 'Frontend VCoi' && npx --no-install vitest run)` và `(cd ecothugom-backend && sh ./mvnw -B -DfailIfNoTests=true test)`.
Hai lệnh trên không phải bằng chứng test đã tồn tại; cần xác minh cấu hình runner/Surefire và số test thực tế.

## Ranh giới áp dụng

- **Luôn:** đọc file trước sửa; giữ quyền tài nguyên/CSRF; ghi ngày/môi trường; test lỗi biên và lệnh hiện hành.
- **Cần quyết định nếu ngoài task được giao:** chính sách bàn giao, hạn mức VND, kiểu API, schema/migration, thêm dependency, quyền dữ liệu thật.
- **Không làm:** commit secret, xóa test để xanh, ghi approved thay người dùng, bật thanh toán thật bằng đổi nhãn, sửa module ngoài phạm vi.

## Đặc tả một lát `pickup-address`

Mục tiêu: CUSTOMER không lưu được địa chỉ mà chính chức năng đặt lịch sẽ từ chối vì quá dài.
Hiện `PickupAddress` giới hạn từng trường, còn `CustomerOrderService.create` mới kiểm tra tổng 600; frontend đã kiểm tra tổng lúc lưu.
Hợp đồng đề xuất: chuẩn hóa theo quy tắc dùng chung, bỏ thành phần rỗng, ghép bằng `, `, tính độ dài nhất quán và trả lỗi validation 400.
API bị tác động: `POST/PUT /api/customer/addresses` và `POST /api/customer/orders`; không thêm endpoint mới.
Phải đọc lại mapping route trước triển khai; bản ghi địa chỉ cũ quá dài cần báo rõ, không tự cắt làm mất nội dung.
Nghiệm thu R-A01 gồm 599/600/601, khoảng trắng, ward/district rỗng, sửa địa chỉ mặc định và snapshot đơn cũ.
Không đổi hành vi xóa snapshot lịch sử tại [CustomerAddressService:68](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L68).

## Trạng thái và prompt bàn giao

Đã áp dụng cho tài liệu: scope check, capability map, yêu cầu/acceptance, sáu vùng nội dung spec và lệnh CURRENT/PROPOSED.
Chưa thực hiện: phê duyệt map/spec, tạo spec chính thức từng module, thực hiện task hay đạt cổng runtime.

```text
Đọc 04-spec-driven-development và chọn đúng module-id được giao.
Đối chiếu code hiện tại, mở quyết định còn thiếu, rồi hoàn thiện một spec module nhỏ.
Giữ CURRENT tách PROPOSED; mọi acceptance phải có cách quan sát và môi trường kiểm tra.
Không coi capability map DRAFT là phê duyệt triển khai tất cả V01–V13.
```

Phụ thuộc: [02](02-interview-me.md), [05](05-constraint-driven-development.md), [06](06-planning-and-task-breakdown.md), [08](08-source-driven-development.md).
