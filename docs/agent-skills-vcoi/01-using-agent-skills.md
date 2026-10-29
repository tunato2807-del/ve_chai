# 01 — Điều phối Agent Skills cho VCOI

> **DRAFT · 29/10/2026** — Hướng dẫn áp dụng và hồ sơ rà soát; chưa phải xác nhận hoàn tất sửa ứng dụng.
> Skill gốc: [using-agent-skills, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/using-agent-skills/SKILL.md).
> Mã nguồn đối chiếu: [VCOI, commit 2c804bc](https://github.com/1250080247-cloud/VCOI/tree/2c804bc8090dee4dcdb2ca150404c534ce35f669).

## Mục tiêu và phạm vi đã được giao

Áp dụng cách tư duy của cả 25 skill để người phát triển có thể tiếp tục VCOI bằng các bước nhỏ, có bằng chứng.
Đầu ra hiện tại là các tệp Markdown trong bộ hồ sơ này, được người dùng yêu cầu tạo trực tiếp.
Việc tạo tài liệu không cần lặp lại bước xin phép lưu, phỏng vấn hoặc xin duyệt từng tệp.
Các lựa chọn nghiệp vụ trong tài liệu vẫn là đề xuất; không suy ra chúng đã được chủ dự án phê duyệt.
Triển khai tính năng, thay schema, thay dependency, merge và phát hành cần căn cứ phạm vi công việc được giao ở lượt thực hiện.

## Bối cảnh phải giữ khi chọn skill

- VCOI phục vụ **một đại lý thu mua**; CUSTOMER bán phế liệu, COLLECTOR cân/ghi khoản chi, ADMIN điều phối.
- Frontend dùng JavaScript, React 19.3.1, Vite 8.3.5, npm; backend dùng Java 21, Spring Boot 4.1.1 và SQL Server.
- Xác thực dùng session cookie/CSRF; thanh toán là mô phỏng, không có xác nhận chuyển tiền từ ngân hàng.
- Giữ snapshot đơn cũ, lịch sử cân/báo giá và các kiểm tra ownership/version hiện có.
- Không tự mở rộng thành sàn nhiều đại lý, đổi sang JWT, chuyển database hoặc thêm TypeScript.

## Bằng chứng VCOI quyết định thứ tự

| Bằng chứng cố định theo commit nguồn                                                                                                                                                                                                                                                                                                                                                           | Hệ quả khi điều phối                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10): `check` chỉ lint và build                                                                                                                                                                                                                          | Không dùng build xanh làm bằng chứng nghiệp vụ đúng.                  |
| [README:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7): test đã chuyển ra thư mục máy tác giả                                                                                                                                                                                                                                         | Khôi phục khả năng chạy test trước khi dựa vào CI.                    |
| [AccountSessionFilter:19](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java#L19) và [AccountService:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119) | V01 cần ca hồi quy khóa–mở không có request xen giữa.                 |
| [OrderChangeService:38](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java#L38): reassign chỉ ASSIGNED                                                                                                                                                                        | V02 cần thiết kế bàn giao theo giai đoạn trước khi nới điều kiện API. |
| [useAdminReports:9](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/useAdminReports.js#L9): ba truy vấn riêng                                                                                                                                                                                                        | V04 cần hợp đồng snapshot, không chỉ thêm nút refresh.                |

Chi tiết ở [báo cáo đã kiểm chứng](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md); baseline browser/Lighthouse bổ sung được ghi riêng tại [EVIDENCE.md](EVIDENCE.md).
Kết quả 142 phép đối chiếu HTTP và 17 frontend trong báo cáo gồm cả ca xác nhận lỗi đang tồn tại.
H2 ở chế độ MSSQLServer không chứng minh hành vi khóa, filtered index hoặc deadlock trên SQL Server thật.

## Bản đồ áp dụng đủ 25 cách tiếp cận

| Khi làm việc gì         | Skill cần dùng                                                                                                       | Đầu ra cụ thể cho VCOI                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chọn quy trình          | `using-agent-skills`                                                                                                 | Chọn nhánh theo nhiệm vụ và ghi trạng thái áp dụng.                    |
| Làm rõ mục tiêu         | `interview-me`, `idea-refine`                                                                                        | Phân biệt điều đã biết với quyết định V02/V06 còn mở.                  |
| Chốt hợp đồng trước sửa | `spec-driven-development`, `constraint-driven-development`                                                           | Capability map, điều kiện nghiệm thu, ngưỡng chất lượng đề xuất.       |
| Chuẩn bị thực hiện      | `planning-and-task-breakdown`, `context-engineering`, `source-driven-development`                                    | Task nhỏ, gói ngữ cảnh, nguồn chính thức có trạng thái xác minh.       |
| Xây từng lát            | `incremental-implementation`, `doubt-driven-development`                                                             | Một luồng chạy được và phản biện giả định quan trọng.                  |
| Chứng minh hành vi      | `test-driven-development`, `browser-testing-with-devtools`, `debugging-and-error-recovery`                           | Ca hồi quy trước/sau, bằng chứng runtime và nguyên nhân lỗi.           |
| Sửa UI/hợp đồng         | `frontend-ui-engineering`, `api-and-interface-design`                                                                | Form/xung đột/lỗi dễ hiểu, API nhất quán frontend/backend.             |
| Rà soát thay đổi        | `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `performance-optimization`               | Review theo bằng chứng; đơn giản hóa; kiểm tra quyền; đo trước tối ưu. |
| Lưu và vận hành         | `git-workflow-and-versioning`, `ci-cd-and-automation`, `documentation-and-adrs`, `observability-and-instrumentation` | Diff nhỏ, CI có test thật, quyết định có hồ sơ, audit không lộ PII.    |
| Chuyển đổi/phát hành    | `deprecation-and-migration`, `shipping-and-launch`                                                                   | Tương thích dữ liệu, rollback và điều kiện phát hành riêng.            |

Một bản sửa không buộc chạy đủ 25 quy trình; cả bộ hồ sơ bao phủ 25 cách tiếp cận.
Ví dụ V05 có thể đi theo spec → kế hoạch → test hồi quy → sửa nhỏ → review; không cần phát hành production trong cùng nhiệm vụ.

## Quy tắc làm việc cho lượt triển khai sau

1. Đọc [README của bộ hồ sơ](README.md), chọn một mã V01–V13 và xác định baseline thực tế bằng `git status`.
2. Đọc tệp skill liên quan; nêu giả định ảnh hưởng hành vi và phần chưa có quyết định.
3. Đọc đúng source, test và hợp đồng của luồng đang sửa; bỏ qua lịch sử README không liên quan.
4. Chuyển tiêu chí thành test quan sát được; ghi rõ môi trường H2 hay SQL Server.
5. Làm một lát nhỏ, giữ các bảo vệ ownership, CSRF, version và snapshot đang có.
6. Kiểm tra diff về phạm vi, test bị bỏ qua, suppression mới, secret và thay đổi ngưỡng chất lượng.
7. Bàn giao lệnh chạy, số test, kết quả và giới hạn; cập nhật trạng thái bằng chứng.

Nếu tài liệu nguồn mâu thuẫn với code, ghi rõ cả hai; không tự biến một khuyến nghị thành hợp đồng đã chốt.
Tiếp tục phần công việc độc lập với quyết định còn mở; không dùng sự chưa rõ của V02 để chặn soạn tài liệu V05.

## Trạng thái áp dụng

| Đã áp dụng cho hồ sơ này                                                             | Chưa thực hiện ở runtime                                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Đọc skill, định tuyến công việc, đối chiếu source và báo cáo, đưa acceptance/handoff | Sửa V01–V13, khôi phục bộ test, cài guard, thiết lập CI, migrate dữ liệu, triển khai |
| Phân biệt bằng chứng cũ có ngày với đề xuất mới                                      | Hoàn tất toàn bộ Definition of Done của một bản phát hành                            |

## Điều kiện nghiệm thu

- [ ] Từ index tìm được đủ 25 tài liệu, mỗi tệp có nguồn skill và bằng chứng VCOI.
- [ ] Mọi hạng mục phân biệt được `đã đọc/đã soạn`, `đề xuất`, `đã chạy` và `đã nghiệm thu`.
- [ ] Người tiếp nhận chọn được một task nhỏ với đầu vào, phụ thuộc và kiểm tra cụ thể.
- [ ] Khi triển khai, thay đổi có test bắt lỗi cũ và kiểm tra runtime phù hợp; hiện chưa đánh dấu đạt.

## Prompt bàn giao

```text
Đọc README và 01-using-agent-skills trong docs/agent-skills-vcoi.
Chọn task được giao từ tasks/todo.md, đối chiếu source hiện tại với baseline 2c804bc.
Nêu skill áp dụng, giả định, file sẽ sửa, acceptance và lệnh kiểm tra có thật.
Giữ mô hình một đại lý, session/CSRF, ownership, lịch sử và thanh toán mô phỏng.
Không tuyên bố cả 25 skill đã hoàn tất runtime từ việc tồn tại các tệp Markdown.
```

Phụ thuộc: [02](02-interview-me.md), [04](04-spec-driven-development.md), [05](05-constraint-driven-development.md), [kế hoạch](tasks/plan.md), [task](tasks/todo.md).
