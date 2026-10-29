# 16 — Rà soát chất lượng thay đổi VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **đã có review nền; checklist cho bản sửa tương lai**.
Nguồn: [code-review-and-quality](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/code-review-and-quality/SKILL.md).
Tham khảo: [security-checklist](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/security-checklist.md), [performance-checklist](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/performance-checklist.md).
Mã nguồn: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Review hiện có: [báo cáo V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Chuẩn phê duyệt

Chấp nhận thay đổi khi nó cải thiện rõ tính đúng đắn và sức khỏe mã theo quy ước dự án, không đòi hoàn hảo.
Review bản sửa cùng test trước khi merge; checklist tài liệu này không phải phê duyệt một PR chưa tồn tại.
Giữ một đại lý thu mua, CUSTOMER bán, COLLECTOR cân, ADMIN điều phối, khoản chi mô phỏng.
Không yêu cầu đổi database, framework, JWT, TypeScript hoặc thêm DELETE cho nghiệp vụ cần giữ lịch sử.
Mức P1/P2/P3 trong báo cáo là thứ tự xử lý, không phải CVSS hoặc nhãn Critical tự động.

## Hiểu thay đổi và đọc test trước

Ví dụ PR nhỏ phù hợp: “Từ chối địa chỉ vượt tổng 600 khi thêm/sửa” xử lý V05.
Đọc hợp đồng 599/600/601/606, diff và test trước code; xem [11 — TDD](11-test-driven-development.md).
Test kỳ vọng 400 cho 606 phải thất bại với hành vi 201 trước sửa và xanh sau sửa.
Test chỉ assert mock validator được gọi chưa chứng minh dữ liệu xấu bị chặn hoặc DB giữ nguyên.
Không có source test trong commit nền; đây là khoảng trống V07 cần giải quyết, không thể bỏ qua bằng log build.

## Năm trục review gắn với nguồn

| Trục            | Câu hỏi cụ thể tại VCoi                                                    | Bằng chứng cần xem                                        |
| --------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| Đúng đắn        | Create/update/booking dùng cùng tổng địa chỉ? snapshot đơn cũ còn nguyên?  | Input biên, DB sau lỗi, test hồi quy                      |
| Dễ đọc/đơn giản | Có một helper quy tắc địa chỉ dễ hiểu thay vì ba bản ghép gần giống?       | Diff nhỏ, tên rõ, không framework tổng quát               |
| Kiến trúc       | Logic địa chỉ ở module orders, UI/parser giữ ranh giới riêng?              | Dependency/file ownership, giữ service/controller pattern |
| Bảo mật         | Ownership, session/CSRF, che contact/log và query bind parameter còn đúng? | Test ngoài quyền, request/response đã che secret          |
| Hiệu năng       | Có thêm query/lặp không cần thiết, giới hạn danh sách bị mất?              | SQL/diff và số đo nếu có claim chậm                       |

Nguồn cụ thể: [CustomerAddressService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34), [CustomerOrderService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43), [addressFormSchema](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L17).
Không suy “SQL injection” chỉ từ việc thấy chuỗi SQL; phải xem nguồn biến và bind parameters thực.
Không kết luận N+1, p95 chậm hoặc cần cache/index khi chưa đọc query plan/đo workload phù hợp.

## Những phát hiện nền cần giữ nguyên mức bằng chứng

- V01: chuỗi LOCKED → ACTIVE không request xen giữa cho cookie cũ `/me` 200; request khi đang khóa vẫn bị chặn.
- V02: ARRIVED không reassign được sau khi khóa nhân viên; đây là đường ngoại lệ nghiệp vụ thiếu, không phải đơn mất vĩnh viễn.
- V03: hai form danh mục cũ ghi đè; khóa dòng backend không thay revision từ client.
- V04: frontend chấp nhận tổng khác nhau; cạnh tranh/isolation SQL Server thật chưa được tái hiện.
- V05/V06: biên địa chỉ/tiền đã tái hiện; không gắn thành lỗi xảy ra với mọi người dùng bình thường.
- V07/V08: checkout thiếu test/CI; chưa kiểm tra hệ thống CI/branch protection ngoài repository.
- Frontend audit 0 advisory đã biết; chưa có SCA Maven, audit toàn lịch sử secret hay bảo đảm không lỗ hổng.

## Kiểm chứng chất lượng test bằng thử đảo điều kiện

Sau khi có bản sửa và test, có thể thử bỏ/đảo kiểm tra `> 600` trong bản làm việc tách biệt.
Suite phải đỏ đúng ca 601/606; nếu vẫn xanh, ghi finding test thiếu thay vì khen coverage.
Đây là **thử nghiệm đề xuất, chưa thực hiện trong pha review tài liệu**.
Giữ bản sao trước thử, khôi phục chính xác sau thử, kiểm tra diff cuối; không thử trên app đang phục vụ người dùng.
Không nhân tiện triển khai mutation framework hoặc thay đổi toàn suite cho một bug nhỏ.

## Phân loại comment và xử lý tranh luận

| Nhãn              | Khi dùng                                                     | Ví dụ                                         |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Required          | Bản sửa không đáp ứng hợp đồng hoặc làm xấu cấu trúc thực tế | Chỉ chặn create, update vẫn lưu 606           |
| Critical          | Có bằng chứng lỗi nghiêm trọng chặn merge trong phạm vi diff | Bỏ ownership làm sửa được địa chỉ người khác  |
| Optional/Consider | Đề xuất có ích nhưng không cần để sửa đúng bug               | Bổ sung hướng dẫn nhập địa chỉ ngắn hơn       |
| Nit               | Sở thích hình thức nhỏ, không cản thay đổi tốt               | Tên biến hợp lệ nhưng chưa ưa thích           |
| FYI               | Thông tin, không yêu cầu sửa                                 | H2 không xác minh filtered indexes SQL Server |

Comment phải nêu vị trí, trigger, expected/actual, tác động và cách sửa nhỏ nhất.
Đặt lỗi đúng đắn/bảo mật trước, rồi cấu trúc; không chôn vấn đề thật dưới nhiều góp ý style.
Khi bất đồng, ưu tiên dữ kiện/test, quy ước dự án và thiết kế; không chặn vì “tôi sẽ viết khác”.
Vấn đề ngoài phạm vi được ghi backlog rõ; không âm thầm refactor hoặc xóa dead code chưa rõ người dùng.
Nếu cấu trúc xấu đi, đề xuất move cụ thể: tái dùng helper chuẩn, tách orchestration hoặc bỏ wrapper thừa.

## Kích thước và dependency

Ưu tiên khoảng 100 dòng, khoảng 300 khi cùng một thay đổi hợp lý; diff lớn cần chia lát theo [09](09-incremental-implementation.md).
Nhìn cả độ lớn file sau sửa; không bắt tách mọi file theo ngưỡng máy móc hoặc gộp refactor lớn vào bug fix.
Trước dependency mới xem stack hiện có giải quyết được chưa, bundle/license/maintenance và known advisories.
Nếu upgrade, đọc changelog/migration notes, đổi từng dependency/nhóm liên quan nhỏ và review lockfile.
Không sửa lockfile bằng tay; suite trước/sau phải thực thi thật, không xem cài dependency thành công là xác minh hành vi.

## Kiểm tra câu chuyện xác minh

Ngày 29/10: `npm run check` đạt lint/build; Maven verify đạt nhưng **không có test để chạy**.
142 đối chiếu HTTP H2 và 17 frontend bổ sung có ca cố ý xác nhận lỗi; không gọi chúng là tất cả nghiệp vụ pass.
[Smoke Chromium mới](EVIDENCE.md): 16 trường hợp 4 trang công khai ở 320/1440px, sáng/tối có 0 pageerror/overflow/vi phạm axe scan; 5 tương tác đạt.
Chưa E2E đăng nhập đủ ba vai trò, SQL Server/load/backup mới; PR claim các phần đó phải kèm bằng chứng tương ứng.
Lighthouse local một lần 69/100 không thay field data/Core Web Vitals; 0 axe scan không chứng nhận toàn ứng dụng.
Trên JDK thiếu `ct.sym`, compiler override là xử lý môi trường đã ghi trong báo cáo, không phải sửa POM của PR.
Lệnh test mới phải có script/class thực tế; không chép lệnh `test:*` lịch sử từ README mà bỏ qua file bị lưu trữ.

## Nghiệm thu review và prompt bàn giao

- [ ] Review hiểu mục tiêu, đọc test và code theo đủ năm trục.
- [ ] Required/Critical được sửa hoặc có quyết định trì hoãn minh bạch phù hợp phạm vi.
- [ ] Test thực thi > 0, lint/build đạt, runtime phù hợp và tài liệu API nhất quán.
- [ ] UI đổi có ảnh/keyboard/browser; SQL Server claim có kiểm chứng SQL Server.
- [ ] Verdict nêu Approve hoặc Request changes theo bằng chứng, không rubber-stamp “LGTM”.

> Review PR sửa V05, đọc test trước rồi đối chiếu create/update/booking và dữ liệu snapshot lịch sử.
> Áp năm trục, comment có bằng chứng và mức độ; chỉ chặn vấn đề ảnh hưởng hợp đồng/chất lượng thực tế.
> Kiểm tra test bằng thay đổi điều kiện có kiểm soát nếu khả thi, khôi phục file và báo kết quả thật.
> Nêu verdict và phần chưa kiểm chứng; không đề nghị viết lại dự án hay nâng severity quá bằng chứng.
