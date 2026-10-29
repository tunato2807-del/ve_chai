# 18 — Bảo mật và gia cố theo ranh giới tin cậy của VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: kế hoạch bảo mật; chưa thay logic xác thực hay cấu hình triển khai.

Nguồn: [security-and-hardening/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/security-and-hardening/SKILL.md),
[hardening-patterns.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/security-and-hardening/references/hardening-patterns.md),
[security-checklist.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/security-checklist.md).
Mã nguồn: `2c804bc8090dee4dcdb2ca150404c534ce35f669`; chi tiết tái hiện ở [V01, V10–V12](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Bằng chứng hiện có và giới hạn

- [SecurityConfiguration.java:25](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/SecurityConfiguration.java#L25) dùng bcrypt cost 12, session cookie, CSRF và kiểm tra vai trò; giữ các lớp bảo vệ này.
- [AccountSessionFilter.java:19](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java#L19) cùng [AccountService.java:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119) tạo khoảng trống thu hồi phiên V01: khóa rồi mở, không request xen giữa, cookie cũ vẫn dùng được.
- [EvidenceStorage.java:21](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/EvidenceStorage.java#L21) kiểm tra JPEG/PNG, tối đa 5 MiB, kích thước/pixel và chuẩn hóa lại ảnh; ảnh được đọc qua API theo quyền đơn.
- [application.properties:2](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application.properties#L2) mặc định profile Windows; cookie Secure=false ở profile phát triển là điều kiện cần đổi khi triển khai HTTPS.
- Audit npm ngày 29/10 báo 0 advisory; chưa có SCA Maven, quét toàn bộ lịch sử secret hoặc kiểm tra máy chủ triển khai.

142 phép đối chiếu HTTP dùng H2 MSSQLServer gồm cả ca xác nhận lỗi; không phải chứng nhận an toàn.
Chưa kiểm tra SQL Server thật, browser HTTPS, restore backup hoặc tải lớn.
Thanh toán hiện chỉ ghi nhận khoản chi mô phỏng; không giả định có gateway hay dữ liệu thẻ.

## Threat model tối thiểu trước khi sửa

Tài sản: mật khẩu/hash, cookie/CSRF, số điện thoại/email, địa chỉ/tọa độ, ảnh riêng tư, quyền admin và lịch sử cân/báo giá/khoản chi.
Chạy STRIDE cho từng ranh giới, rồi chuyển mỗi nguy cơ thành ca thử lạm dụng:

| Ranh giới              | Ca lạm dụng cần thử                                          | Bảo vệ/việc cần xác minh                                                       |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Browser → API          | Khách đọc đơn/ảnh người khác; nhân viên cũ đọc sau bàn giao. | Ownership ở backend, vai trò, session và CSRF; không dựa vào ẩn nút.           |
| Admin → tài khoản      | Cookie cũ sống lại sau khóa/mở; không biết ai khóa ai.       | V01 bằng dấu thu hồi phiên riêng; V11 có actor/target/kết quả.                 |
| API → SQL Server       | Payload lạ, sửa bằng revision cũ, thanh toán đồng thời.      | Query tham số hóa, allowlist DTO, transaction/CAS và ràng buộc DB.             |
| Upload → filesystem    | File giả ảnh, quá pixel, I/O lỗi, crash sau tạo file.        | Giữ kiểm tra nội dung, quyền đọc; backup DB và ảnh đồng bộ.                    |
| Routing → nhà cung cấp | Gửi tọa độ thật không rõ mục đích, timeout/429.              | Provider do cấu hình tin cậy chọn; tối thiểu hóa dữ liệu và thông báo chia sẻ. |

Không suy diễn chuỗi SQL được ghép từ tên cột nội bộ thành SQL injection đã chứng minh.
Nếu sau này nhận URL do người dùng nhập, cần mô hình SSRF riêng; chức năng hiện không có hợp đồng import URL tùy ý.

## Thứ tự thực hiện đề xuất

1. Khôi phục test V07; giữ hồi quy phân quyền, CSRF, đổi mật khẩu và truy cập ảnh.
2. Chốt chính sách thu hồi phiên V01; bổ sung `sessionVersion` hoặc mốc thu hồi riêng.
   Kiểm tra nhiều phiên, khóa–mở không có request xen giữa, và race đăng nhập/khóa/đổi mật khẩu.
3. Thiết kế bàn giao V02 trước khi mở rộng quyền reassign; nhân viên cũ mất quyền đúng thời điểm.
4. Bổ sung audit tài khoản với actor, target ID, hành động, trước/sau, thời gian và kết quả transaction.
   Không log password, hash, cookie, CSRF, toàn bộ body hay địa chỉ/tọa độ không cần thiết.
5. Trước khi phục vụ ngoài localhost, kiểm tra HTTPS cùng origin, Secure cookie, CSRF và proxy tin cậy.
   Kiểm tra CSP tại cả HTML frontend và API; CSP của API không tự bảo vệ tài liệu HTML.
6. Nếu nhiều instance, thiết kế session/rate limit chia sẻ; một instance phải ghi rõ mất phiên khi restart.
   Không bắt buộc thêm Redis khi chưa cần; không tăng/bỏ rate limit chỉ để bài test xanh.
7. Xác định lưu giữ/xuất/ẩn danh dữ liệu theo nơi vận hành; thử khôi phục DB cùng `.local/evidence`.
   Giữ snapshot chứng từ theo chính sách; không xóa cứng lịch sử giao dịch để đáp ứng một checklist chung.
8. Nếu làm công cụ dọn ảnh, xác minh root sau resolve symlink, độ sâu và quyền sở hữu trước thao tác.
   Có dry-run, khoảng chờ và đối chiếu DB; không xóa root, không dọn file đang thuộc transaction khác.

## Dependency và chuỗi cung ứng

Frontend là dự án npm độc lập tại `Frontend VCoi`, với `package-lock.json` là lockfile có thẩm quyền.
Môi trường audit dùng npm 11.9.0; không giả định có cơ chế allow-script của một phiên bản mới hơn.
Bootstrap bằng `npm ci --ignore-scripts`, đọc mã lifecycle chính xác theo package/version trước khi cho phép chạy.
Ghi chính sách chặn/cho phép phù hợp client đã chốt và thử clean install; không blanket-approve dependency scripts.
`npm audit --package-lock-only --json` kiểm tra advisory đã biết; rà lockfile, nguồn package và provenance riêng.
Chọn SCA Maven và cấu hình phù hợp Java 21; ghi lý do, reachability và ngày xem lại khi hoãn một advisory.
Không tự chạy `npm audit fix --force`; không đưa secret, dữ liệu thật hay báo cáo chứa credential vào Git.

## Tiêu chí nghiệm thu

- [ ] V01 có test thất bại trước sửa, đạt sau sửa; nhiều cookie cũ đều bị thu hồi theo chính sách.
- [ ] Quyền tài nguyên và CSRF còn hiệu lực cho ba vai trò, kể cả sau bàn giao và logout.
- [ ] HTTPS/cookie/header/proxy được thử trên môi trường triển khai thực khi có triển khai.
- [ ] Upload sai loại, quá byte/pixel và lỗi lưu được xử lý; ảnh không bị công khai.
- [ ] Audit truy được người thực hiện; log/artifact không chứa credential hoặc PII dư thừa.
- [ ] Backup/restore giữ DB–ảnh khớp nhau; có chủ sở hữu và thời hạn lưu dữ liệu.
- [ ] Advisory high/critical có khả năng tới được đã xử lý hoặc có quyết định hoãn được ghi rõ.
- [ ] Báo cáo nêu phần chưa kiểm chứng; không kết luận “an toàn hoàn toàn” từ lint/build/audit 0.

## Phụ thuộc và bàn giao

Dùng [21](21-ci-cd-and-automation.md) cho kiểm tra lặp lại, [22](22-deprecation-and-migration.md) cho đổi schema phiên,
[23](23-documentation-and-adrs.md) cho quyết định lưu dữ liệu và triển khai.
Viết tài liệu này nằm trong phạm vi đã được giao; thay đổi xác thực, tích hợp hoặc loại PII mới cần được chốt trong phạm vi triển khai tương ứng.

Prompt bàn giao:

> Lập threat model VCOI theo bảng trên và xử lý V01 thành một lát sửa có test hồi quy.
> Giữ session cookie, CSRF và ownership; đề xuất migration sessionVersion cùng rollback không phục hồi phiên đã thu hồi.
> Ghi bằng chứng và giới hạn SQL Server/browser; không triển khai, đổi secret hay thêm dịch vụ ngoài phạm vi.
