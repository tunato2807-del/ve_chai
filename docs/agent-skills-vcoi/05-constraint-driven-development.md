# 05 — Ràng buộc chất lượng cho VCOI

> **DRAFT · 29/10/2026** — Hợp đồng chất lượng đề xuất; chưa tạo `CONSTRAINTS.md` ở gốc, cài guard hay bật required checks.
> Skill gốc: [constraint-driven-development, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/constraint-driven-development/SKILL.md).
> Tham chiếu đã đọc: [floor-guard](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/constraint-driven-development/references/floor-guard.md).

## Phát hiện trước khi đặt ngưỡng

Frontend là JavaScript có ESLint/Vitest/Testing Library, nhưng `check` chỉ lint/build và không có script test.
Backend có dependency test và H2 nhưng nguồn test không nằm trong Git; chưa có workflow CI trong commit nguồn.

| Dữ kiện                                                                                  | Bằng chứng cố định theo commit 2c804bc                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lint không cho warning; check không chạy test                                            | [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10).                                                                        |
| Vitest/Lighthouse/axe integration được khai báo, chưa thấy cấu hình suite trong checkout | [package.json:33](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L33). Dependency có mặt không đồng nghĩa check chạy.                         |
| Maven có Surefire nhưng chưa fail khi không tìm thấy test                                | [pom.xml:84](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml#L84) và log `No tests to run` trong [báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md). |
| Test/fixture chuyển ra ngoài repository                                                  | [README:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7). Không có coverage baseline đáng dùng.                                                             |

Không đặt coverage hiện tại bằng 0% chỉ vì thiếu test; kết luận đúng là **chưa có số đo coverage tái lập**.
Baseline browser/Lighthouse mới của lượt tổng hợp được ghi riêng tại [EVIDENCE.md](EVIDENCE.md); không tự cập nhật kết quả audit dependency cũ.

## Bốn lựa chọn cần ghi khi đưa ràng buộc vào thực thi

Đây là khung quyết định cho lần thiết lập sau, không phải bốn câu hỏi đang chặn việc tạo tài liệu.

| Quyết định          | Mặc định đề xuất và lý do                                                                          | Trạng thái                                  |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Chiều chất lượng    | Lint/build, test trọng yếu và dependency/secrets trước; VCOI có auth, ảnh riêng tư và dữ liệu tiền | Chưa phê duyệt phạm vi công cụ bổ sung.     |
| Chặn hay cảnh báo   | Chặn floor/lint/build; chặn test được chọn khi đã khôi phục; chỉ cảnh báo metric chưa có baseline  | Chưa cấu hình CI/branch protection.         |
| Đặt ngưỡng          | Đo trước rồi giữ không xấu đi; coverage dòng thay đổi ≥80% là ứng viên từ skill                    | Chưa có báo cáo coverage để áp dụng.        |
| Ngân sách thời gian | Mục tiêu kiểm tra task khoảng 90 giây; check chậm chuyển CI/job riêng                              | Là mục tiêu đề xuất, chưa đo thời gian đạt. |

## Floor đề xuất, áp dụng cho diff

- Không thêm suppression để che lỗi: `eslint-disable`, `@SuppressWarnings` hoặc cấu hình exclude cần lý do có phạm vi.
- Không thêm test bị skip/`@Disabled`, xóa assertion hay xóa test để đổi đỏ thành xanh.
- Không để stub, nhánh chưa làm hoặc catch rỗng nuốt lỗi trong phần thay đổi.
- Không đưa credential, cookie phiên, CSRF token hay dữ liệu thật vào code, fixture, log hoặc tài liệu.
- Không hạ ngưỡng, bỏ check hoặc thêm ngoại lệ để che bản sửa chưa đạt.

Guard nên thích nghi từ reference đã dẫn, bổ sung mẫu Java và nhận diện `*Test.java`/`*IT.java`.
Guard phải xét staged, unstaged, file mới và file bị xóa; thiếu merge base là **không chạy được**, không được xem là pass.
Giữ exit code 0 sạch, 1 vi phạm, 2 không thực thi được; regex chỉ là hàng rào sơ bộ, vẫn cần review diff.
Hiện chưa có tệp guard trong VCOI; không cung cấp tên script chưa tồn tại như lệnh CURRENT.

## Ma trận số đo và cơ chế

Các ngưỡng ngoài lint/build dưới đây là **PROPOSED**, cần công cụ và lần chạy baseline trước khi gọi là enforced.

| Chiều             | Ngưỡng và lý do                                                    | Lệnh/cơ chế                                                                        | Nơi chạy và trạng thái                                                      |
| ----------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Lint              | 0 lỗi, 0 warning theo cấu hình hiện có                             | `npm --prefix 'Frontend VCoi' run lint`                                            | CURRENT; sau sửa frontend/task.                                             |
| Build             | 0 lỗi build frontend                                               | `npm --prefix 'Frontend VCoi' run build`                                           | CURRENT; cuối task; chưa phải test nghiệp vụ.                               |
| Backend           | Maven verify thành công                                            | `(cd ecothugom-backend && sh ./mvnw -B verify)`                                    | CURRENT; baseline không có test chạy.                                       |
| Test trọng yếu    | >0 test mỗi suite bắt buộc, không skip ca bảo vệ V01–V06/ownership | Vitest và Surefire sau V07; cần thêm cấu hình fail suite rỗng                      | PROPOSED, task/CI; không được thỏa bằng một test không liên quan.           |
| Coverage thay đổi | Ứng viên ≥80% để tránh thêm nhánh không kiểm tra                   | Vitest coverage/JaCoCo + giao diff; chưa có reporter/config đầy đủ                 | PROPOSED; đo trước, chưa có số thực tế.                                     |
| Secret            | 0 phát hiện chưa xử lý; log không in giá trị secret                | `gitleaks dir . --redact --no-banner` sau khi có tool                              | PROPOSED; CI hoặc máy có tool, không cài toàn cục trong lượt này.           |
| Dependency        | Không có high/critical chưa được đánh giá hoặc có ngoại lệ hợp lệ  | `npm --prefix 'Frontend VCoi' audit --package-lock-only --json`; bổ sung SCA Maven | Npm command CURRENT; lịch chạy/gate và Maven scanner PROPOSED.              |
| Accessibility     | Ứng viên 0 critical/serious từ axe trên luồng ba vai trò           | Runner `@axe-core/playwright` và URL; đọc baseline công khai tại EVIDENCE          | PROPOSED cho suite trong Git/CI; baseline công khai chưa phủ ba vai trò.    |
| Performance       | Ứng viên LCP ≤2500ms, CLS ≤0.1 từ mặc định skill                   | Lighthouse trên URL/thiết bị/network được ghi rõ                                   | PROPOSED; baseline LCP 6,46s đang vượt ứng viên, chưa dùng như gate đã đạt. |

Không thêm `tsc --noEmit` vì dự án chưa dùng TypeScript.
Không coi công cụ external đã được áp dụng chỉ vì có một dòng đề xuất trong bảng.
LCP/CLS không thay thế đo p95 API hoặc query plan SQL Server; mỗi mục phải ghi đúng môi trường.

## Đo trước, giữ không xấu đi

| Metric                | Hiện biết từ báo cáo 29/10/2026                                           | Hành động cần làm                                                                 |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Frontend lint/build   | Pass trong lượt rà soát trước                                             | Đo thời gian và lưu log khi chạy lại trên commit sửa.                             |
| Coverage              | Chưa đo được từ suite trong Git                                           | Khôi phục suite; lưu artifact; không dùng số coverage minh họa trong skill.       |
| Npm advisories        | 0 advisory tại thời điểm báo cáo, phạm vi lockfile frontend               | Chạy lại theo lịch; không suy ra Maven hoặc hệ thống triển khai an toàn.          |
| Browser/accessibility | 16 ca công khai/login/register: 0 pageerror/overflow/axe; 5 tương tác đạt | Xem EVIDENCE về scope; bổ sung ba vai trò, không suy ra toàn bộ ứng dụng đạt.     |
| Lighthouse mobile     | Một lượt 69/100, LCP 6,46s                                                | Đo lặp cùng điều kiện trước chốt budget; không hạ ứng viên xuống để gắn nhãn đạt. |
| Bundle, p95 API       | Chưa có baseline kiểm chứng cho hai metric này                            | Ghi thiết bị/dataset/điều kiện đo rồi mới chốt ratchet.                           |

Ngưỡng đã chốt lưu tại một nguồn `CONSTRAINTS.md`; script wrapper phải phản ánh file đó.
Baseline cải thiện thì cập nhật ratchet có bằng chứng; giảm chất lượng phải nêu lý do, không sửa số âm thầm.
Ngoại lệ cần ID, rule, đường dẫn, lý do, người chịu trách nhiệm và ngày hết hạn; không tự gán người phê duyệt.
Hiện **không có ngoại lệ được cấp bởi tài liệu này**.

## Việc cần làm và điều kiện nghiệm thu

1. Dùng [06](06-planning-and-task-breakdown.md) khôi phục test nhỏ có ý nghĩa, đo baseline và chọn công cụ cần thiết.
2. Khi được giao thiết lập thật, tạo `CONSTRAINTS.md`, tham chiếu từ quy tắc agent của dự án và thêm wrapper project-local.
3. Kiểm tra nhanh theo diff; test liên quan cuối task; scanner/browser/database chậm chạy đúng job.
4. Review diff gồm cả thay đổi ngưỡng, test, suppression và ngoại lệ.

- [ ] Mỗi ngưỡng enforced có một lệnh chạy được hôm nay, lý do và nơi chạy.
- [ ] Có ít nhất một kiểm tra bên ngoài suite do dự án tự viết, với artifact và kết quả thật.
- [ ] Suite rỗng, test skip trái phép và hạ ngưỡng không thể được báo xanh như đã đủ kiểm chứng.
- [ ] Chạy thử trên branch hiện tại, phân biệt vi phạm thật với lỗi môi trường/công cụ chưa cài.

## Trạng thái và prompt bàn giao

Đã áp dụng cho hồ sơ: phát hiện stack/check, floor, số đo chưa biết, ngưỡng và vị trí chạy đề xuất.
Chưa thực hiện: phỏng vấn thiết lập, tạo root constraints, guard, coverage, hook hoặc required checks; browser bổ sung không đồng nghĩa gate CI.

```text
Đọc 05-constraint-driven-development. Chỉ chuyển hàng PROPOSED thành enforced sau khi
có tool, lệnh, baseline và phạm vi quyết định phù hợp. Giữ lint/build hiện tại.
Không xóa test, thêm suppression hoặc hạ ngưỡng để pass; ghi ngoại lệ có owner/expiry nếu được chấp nhận.
Không trình bày coverage/performance chưa đo thành dữ kiện của VCOI.
```

Phụ thuộc: [04](04-spec-driven-development.md), [06](06-planning-and-task-breakdown.md), [08](08-source-driven-development.md), [README](README.md).
