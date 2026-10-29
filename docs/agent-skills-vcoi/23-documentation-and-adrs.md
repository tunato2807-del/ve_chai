# 23 — Tài liệu hiện hành và ADR cho VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: hướng dẫn tổ chức tài liệu; chưa viết lại README hoặc ban hành quyết định kiến trúc mới.

Nguồn skill: [documentation-and-adrs/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/documentation-and-adrs/SKILL.md).
Mã đối chiếu: `2c804bc8090dee4dcdb2ca150404c534ce35f669`; nền tảng là [báo cáo V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Vì sao cần áp dụng ở dự án này

- [README.md:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7) nói test/fixture/script kiểm tra đã chuyển sang đường dẫn Desktop của tác giả.
- README nguồn dài **4.534 dòng**, trộn cách chạy hiện hành và ghi chú những lần kiểm thử cũ.
  Các lệnh `npm run test:dossier`, `npm run test:navigation`, `scripts/verify-live-dossier.ps1` còn được nhắc nhưng không có trong checkout.
- [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10) xác nhận `npm run check` chỉ lint/build.
  Không gọi 494 test trong ghi chú lịch sử là kết quả chạy lại ngày 29/10.
- Chưa thấy thư mục/quy ước ADR hoặc `.adr-dir` trong cây nguồn đã kiểm tra; cần tìm lại trước khi tạo ADR đầu tiên.
  Không sao chép `AGENTS.md` của kho skill: nó hướng dẫn phát triển chính kho đó.

## Ranh giới tài liệu đề xuất

Các đường dẫn trong bảng là cấu trúc đề xuất, trừ các tài liệu đã ghi rõ đang có.

| Nơi lưu                                | Trách nhiệm                                                                                     | Ranh giới để tránh lặp                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `README.md` hiện có                    | Một đại lý thu mua; khách bán và nhận tiền; kiến trúc, quick start, lệnh hiện có, liên kết.     | Không chứa toàn bộ nhật ký kiểm thử hoặc số liệu không có ngày.                   |
| `docs/setup/` đề xuất                  | Windows/local, SQL authentication nếu hỗ trợ, khởi tạo DB, bootstrap admin, troubleshooting.    | Tách setup clone mới khỏi nâng cấp DB đang có; chỉ placeholder secret.            |
| `docs/api/` đề xuất                    | Role/ownership, session/CSRF, DTO, version/revision, lỗi, pagination, tiền, thời gian và retry. | Không đổi hợp đồng trong tài liệu trước khi code/ADR chốt.                        |
| `docs/operations/` đề xuất             | HTTPS/proxy/cookie, backup/restore DB–ảnh, retention, incident và rollback.                     | Điều kiện vận hành phải ghi rõ, không dùng hướng dẫn demo làm production runbook. |
| `docs/decisions/` đề xuất              | ADR có trạng thái, lý do, phương án và hệ quả.                                                  | Chỉ dùng khi không có quy ước ADR sẵn; không xóa quyết định cũ.                   |
| `docs/history/` đề xuất                | Ghi chú cũ, ngày, commit, môi trường, số liệu và tài liệu thay thế.                             | Đánh nhãn lịch sử, không quảng bá lệnh đã mất là lệnh hiện hành.                  |
| `docs/agent-skills-vcoi/` đang bổ sung | Cách áp dụng từng skill, việc cần làm và nghiệm thu.                                            | Là gói kế hoạch, không phải bằng chứng các sửa đổi đã hoàn tất.                   |

Giữ [PowerPoint](../presentation/VCoi_Thu_gom_ve_chai.pptx), báo cáo nền và các mốc nguồn.
Tách lịch sử bằng di chuyển có truy vết và liên kết chuyển tiếp; không xóa luận cứ của quyết định quan trọng.

## Viết lại quick start bằng bằng chứng

1. Liệt kê điều kiện thật: Node theo engines `^22.13.0 || >=24.0.0`, npm ≥10; Java 21; SQL Server.
   Ghi bộ phiên bản đã thử riêng; engines không có nghĩa mọi tổ hợp trong khoảng đều đã được kiểm chứng.
2. Dẫn script [initialize-demo-db.ps1](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/scripts/initialize-demo-db.ps1), bootstrap và start-local đúng nền tảng/tham số.
   Đọc guard và help trước khi viết lệnh; không biến bước khởi tạo demo thành lệnh chạy mặc định trên DB đang dùng.
3. Ghi [start-local.ps1](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/scripts/start-local.ps1) yêu cầu Windows 64-bit, chuẩn bị DLL xác thực JDBC có kiểm tra SHA-256.
   Linux/cloud dùng hướng dẫn SQL authentication riêng khi đã thử, không gọi script PowerShell này là đa nền tảng.
4. Giải thích profile Windows mặc định, cổng từ cấu hình và session trong RAM mất khi restart.
   Tách rõ website 127.0.0.1:5173, API 127.0.0.1:8080 và proxy `/api` trong phát triển.
5. Cài npm từ lockfile theo [18](18-security-and-hardening.md): bootstrap scripts-disabled và chính sách lifecycle đã rà soát.
   Không thay bằng `npm install` hay bật toàn bộ scripts chỉ để đoạn quick start ngắn hơn.
6. Bảng lệnh hiện hành ghi `dev`, `lint`, `build`, `preview`, `format:check`, `check` đúng package.json.
   Lệnh test sẽ khôi phục theo V07 phải gắn nhãn “chưa có”; Maven verify hiện có thể báo không có test.
7. Cho một người khác chạy từ clone mới trên môi trường được ghi rõ và lưu kết quả mới có ngày/commit.
   Máy audit thiếu `ct.sym` là hạn chế riêng môi trường; không đưa workaround vào yêu cầu chuẩn cho mọi người dùng.

## ADR cần soạn trước các thay đổi khó đảo ngược

| Quyết định đề xuất, chưa Accepted | Câu hỏi phải trả lời                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Thu hồi phiên V01                 | Khóa, mở và đổi mật khẩu tăng dấu thu hồi khi nào; nhiều phiên/mixed rollout/rollback xử lý ra sao? |
| Bàn giao ngoại lệ V02             | Trạng thái nào cho phép, ai nhận trách nhiệm, giữ cân/quote/khoản chi và audit như thế nào?         |
| Chống ghi đè V03                  | Module nào cần revision, client cũ làm gì, lỗi 409 và UX so sánh ra sao?                            |
| Snapshot báo cáo V04              | Đảm bảo DB nào, các trang/export cùng dataset thế nào, chi phí và quyền token ra sao?               |
| Hợp đồng tiền V06                 | Giới hạn nghiệp vụ hay decimal string; tổng nhiều dòng, HALF_UP và client cũ chuyển thế nào?        |
| Vận hành/dữ liệu V10–V12          | Một/nhiều instance, nơi giữ ảnh, backup, retention và quyền đọc audit theo nhu cầu thực?            |

Mỗi ADR ghi số thứ tự theo quy ước tìm được, ngày, trạng thái Proposed/Accepted/Superseded/Deprecated,
bối cảnh VCOI, quyết định, phương án cân nhắc, đánh đổi, hệ quả và cách kiểm chứng.
Phương án “giữ hiện tại” phải được xét khi hợp lý; không bịa lý do lịch sử cho quyết định chưa có tài liệu.
Chỉ chủ sở hữu quyết định chốt Accepted; một hướng dẫn skill không tự đại diện cho quyết định nhóm.
Khi thay đổi, tạo ADR mới dẫn và supersede bản cũ; không sửa quá khứ để làm như luôn đồng thuận.

## Đồng bộ API, hướng dẫn và văn bản

Ghi hợp đồng tiền/thời gian/ownership cùng DTO/schema thực; nêu 400/401/403/404/409 theo handler hiện có.
Không áp mã 422 từ ví dụ skill như sự thật của backend VCOI.
Phân biệt mất kết nối sau POST với lỗi xác nhận chưa ghi: không hướng dẫn retry mù đặt lịch/khoản chi.
Giữ nhãn “thanh toán mô phỏng” và điểm xuất phát bản đồ demo; chưa gọi tích hợp ngân hàng/GPS thật đã hoàn tất.
Nếu cập nhật OpenAPI bằng script đang có, đọc phạm vi generator và đối chiếu controller; không mặc định bao phủ mọi endpoint.
Rà văn bản giữ nguyên số, đơn vị, path, điều kiện và các giới hạn kiểm chứng; làm câu rõ hơn không được nâng mức bảo đảm.

## Tiêu chí nghiệm thu và bàn giao

- [ ] Clone mới làm theo phần hiện hành không cần file trên Desktop tác giả; script/đường dẫn được dẫn thực sự tồn tại.
- [ ] README dẫn đúng setup/API/operations/history; phần lịch sử giữ ngày/phạm vi và nhãn thay thế.
- [ ] ADR theo một quy ước, nêu lý do/đánh đổi; Proposed không bị trình bày như Accepted.
- [ ] Lệnh test/CI đang có và dự kiến được phân biệt; số liệu ngày 29/10 không bị trộn với số liệu cũ.
- [ ] Không lộ secret/PII; liên kết nội bộ hợp lệ; nguồn quan trọng cố định theo commit.
- [ ] Người bảo trì cập nhật code, API, test và tài liệu liên quan trong cùng thay đổi có thể review.

Phụ thuộc: V07 để viết cách chạy test thật, [20](20-git-workflow-and-versioning.md) để bảo toàn lịch sử,
[22](22-deprecation-and-migration.md) cho hướng dẫn nâng cấp và rollback.

> Tái tổ chức tài liệu VCOI quanh README hiện hành, setup, API, operations, history và ADR theo quy ước tìm được.
> Đối chiếu từng lệnh với checkout; giữ nhật ký/PowerPoint và nhãn mô phỏng, không nâng số liệu cũ thành kết quả mới.
> Soạn các ADR V01–V06 ở trạng thái Proposed, nêu đánh đổi và bằng chứng còn thiếu trước khi chốt.
