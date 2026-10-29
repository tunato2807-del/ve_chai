# 22 — Migration và ngừng hợp đồng cũ an toàn trong VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: kế hoạch migration, chưa chạy DDL/backfill hoặc ngừng API nào.

Nguồn skill: [deprecation-and-migration/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/deprecation-and-migration/SKILL.md).
Mã nguồn: `2c804bc8090dee4dcdb2ca150404c534ce35f669`; tham chiếu [V01, V03–V06, V09](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Những thay đổi thực sự cần kế hoạch chuyển tiếp

| Bằng chứng ở phiên bản nguồn                                                                                                                                                                                                                                                                                                                                                                                                                           | Hợp đồng cần chuyển                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [SessionPrincipal.java:12](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/SessionPrincipal.java#L12) stamp dựa vào password hash.                                                                                                                                                                                                                           | Thêm dấu thu hồi phiên riêng cho V01 mà không coi sửa profile là thu hồi phiên.                     |
| [AdminCatalogService.java:28](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminCatalogService.java#L28) và [CustomerAddressService.java:49](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L49) chưa nhận revision của form. | Read trả revision; write gửi revision và xử lý 409; client cũ cần thời gian/chính sách chuyển tiếp. |
| [AdminPriceRequests.java:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminPriceRequests.java#L10) cho 18 chữ số; [prices-model.js:4](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/prices-model.js#L4) dùng safe integer JavaScript.                                  | V06 cần giới hạn tiền nhất quán hoặc kiểu decimal string có version, kể cả tổng nhiều dòng/báo cáo. |
| [AdminReportService.java:12](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java#L12) và request báo cáo độc lập.                                                                                                                                                                                                                     | Chuyển sang dataset/snapshot chung, không chỉ thêm timestamp vào response.                          |

Schema đang có script SQL Server thủ công; [02-pickup-location.sql](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/scripts/sql/02-pickup-location.sql) đã làm migration cộng thêm với kiểm tra marker DB.
Không sửa lại `01-schema.sql` rồi coi database đã tồn tại tự nâng cấp; không tự thêm framework migration nếu chưa cần.
Không đề xuất đổi SQL Server, session cookie hoặc thanh toán mô phỏng chỉ vì ví dụ trong skill dùng công nghệ khác.

## Quy trình chung: mở rộng → chuyển dữ liệu/client → thu gọn

1. Kiểm kê consumer bằng tìm kiếm mã, tài liệu và khi có vận hành thì log/metrics đã tối thiểu hóa PII.
   Chưa có số liệu lưu lượng hiện tại; không tuyên bố “không ai dùng API cũ” từ việc chỉ thấy một frontend.
2. Ghi ADR: lý do, owner, thay thế, tính tương thích, điều kiện dừng, đường quay lui và tiêu chí bỏ hợp đồng cũ.
   Mặc định cảnh báo chuyển tiếp; nếu cần bắt buộc vì bảo mật, ghi lý do và cung cấp cách chuyển cụ thể.
3. Backup có khả năng restore; thử kế hoạch trên bản DB tổng hợp hoặc bản sao được phép dùng.
   Kiểm tra đúng tên DB/marker/schema trước DDL; ghi số hàng và thời gian khóa, không chạy script khởi tạo lên DB thật.
4. Thêm trường/bảng/endpoint tương thích trước; backfill theo lô có checkpoint, có thể chạy lại an toàn.
   Kiểm chứng SQL Server thật, quy mô lớn và lock/deadlock; cú pháp online index phụ thuộc edition.
5. Chuyển write/read và client từng phần khi có thể; quan sát lỗi 400/409, sai số và consumer cũ.
6. Chỉ thu gọn sau khi có bằng chứng mọi consumer đã chuyển và qua khoảng rollback đã chốt.
   DROP/rename là thay đổi riêng về sau; tài liệu này không cấp lệnh xóa schema hoặc ép thời hạn giả.

## Lát chuyển phiên: sessionVersion

Tên `sessionVersion` là phương án đề xuất, chưa có cột này trong checkout.
Thêm giá trị epoch/version với default và backfill được kiểm tra; dùng để tăng khi thu hồi phiên theo chính sách.
Principal ghi version lúc đăng nhập, filter đối chiếu mỗi request; cập nhật version trong transaction khóa tài khoản.
Không dùng `updatedAt` chung và không làm version giảm khi mở khóa.
Migration cộng thêm giữ được khả năng đọc schema của binary cũ, nhưng **binary cũ không thực thi chính sách thu hồi mới**.
Vì vậy không coi mixed rollout với node auth cũ là an toàn: cần chuyển hết node liên quan hoặc dừng/drain theo kế hoạch.
Với một instance và session ở RAM, có thể chọn cutover có restart/đăng nhập lại sau khi thông báo; vẫn phải test chính sách.
Rollback code phải giữ enforcement thu hồi hoặc vô hiệu mọi phiên và dùng bản rollback đã sửa; không giảm version/khôi phục cookie cũ.
Thử nhiều phiên, khóa–mở không request xen giữa, đăng nhập cạnh tranh với khóa/đổi mật khẩu; sửa tên/email giữ chính sách đã chốt.

## Lát chuyển chống ghi đè: row revision

Chọn một module trước, ví dụ danh mục; phân biệt revision dữ liệu form với sessionVersion và version đơn hàng đã có.
Có thể chọn số revision tăng đơn điệu hoặc SQL Server `rowversion`, nhưng phải ghi rõ encoding và mọi write làm nó thay đổi.
Read trả revision; backend write so điều kiện revision atomically, tăng revision và trả bản mới; stale trả 409.
Frontend cũ không gửi revision phải có chế độ/chính sách chuyển tiếp công khai; không âm thầm bỏ điều kiện CAS khi thiếu trường.
Nếu cần giai đoạn tương thích có write cũ, thừa nhận chưa bảo đảm chống ghi đè hoàn toàn đến khi khóa hợp đồng bắt buộc.
Khi bắt buộc revision, xử lý tab cũ và cache cũ bằng tải lại; giữ nội dung nhập để người dùng so sánh, không tự ghi đè lại.
Thử sửa–sửa, sửa–ẩn và sửa–xóa địa chỉ; không thay revision riêng của báo giá/bảng giá bằng một trường chung tùy tiện.

## Lát chuyển hợp đồng tiền và báo cáo

1. Kiểm kê `decimal(18,0)`, computed columns, DTO, schema Zod, phép tổng, format và export; thống kê dữ liệu ngoài giới hạn mới.
2. Chọn một phương án V06: giới hạn nghiệp vụ đủ an toàn cho mọi tổng hoặc decimal string cùng thư viện/phép tính chính xác đã rà soát.
   Không đổi số lớn sang `Number` để giả tương thích; không cắt/làm tròn hay sửa giá đã chấp thuận trong lịch sử.
3. Nếu đổi kiểu, cung cấp hợp đồng có version/adapter và cập nhật client trước khi bỏ dạng cũ.
   Adapter dạng number chỉ dùng cho giá trị chứng minh biểu diễn chính xác; lỗi vượt giới hạn phải rõ ràng.
4. Kiểm tra dưới/đúng/trên ngưỡng, tổng nhiều dòng, HALF_UP, quote đã chấp thuận, khoản chi và báo cáo lớn.
5. Với V04, thêm endpoint/dataset hoặc token snapshot có phạm vi quyền, bộ lọc và thời hạn rõ.
   Bảo đảm các SELECT thật sự cùng snapshot trên SQL Server; `REPEATABLE_READ` không tự loại phantom insert.
   Không tự bật `ALLOW_SNAPSHOT_ISOLATION` hay thay cấu hình DB vận hành trong một bản sửa frontend.
6. Chuyển overview, mọi trang và export sang cùng dataset rồi kiểm tra giao dịch ghi đồng thời.
   Chỉ ngừng API báo cáo cũ sau khi mọi bên dùng đã chuyển; giữ định nghĩa kỳ và cohort đã công bố.

Địa chỉ cũ quá 600 ký tự cần được phát hiện và hướng dẫn sửa, không tự cắt snapshot đơn cũ.
Tài liệu cũ có thể chuyển sang `docs/history/` cùng ghi chú thay thế; giữ ADR và bằng chứng lịch sử quan trọng.

## Rollback và tiêu chí nghiệm thu

- [ ] Mỗi bước có ma trận binary/schema/client tương thích và diễn tập rollback trên DB thử.
- [ ] Down path ưu tiên quay lui code nhưng giữ dữ liệu/cột cộng thêm; không xóa dữ liệu mới để giả một rollback sạch.
- [ ] Nếu có bước không thể đảo ngược, nêu rõ điểm không quay lui, backup/restore và cách giữ/phát lại giao dịch mới.
- [ ] Thu hồi phiên vẫn được bảo vệ khi rollback; revision cũ bị từ chối đúng và tiền không mất độ chính xác.
- [ ] Snapshot báo cáo khớp dưới ghi đồng thời trên SQL Server; H2 chỉ là lớp kiểm tra bổ sung.
- [ ] Có số liệu consumer cũ trước thu gọn; chưa có số liệu thì trạng thái vẫn là đề xuất/chưa đủ điều kiện bỏ.
- [ ] Không DROP/rename tại chỗ, viết lại lịch sử giao dịch, force-push hoặc xóa test cũ trước khi có thay thế tương đương.

## Phụ thuộc và bàn giao

Cần V07, [18](18-security-and-hardening.md), [21](21-ci-cd-and-automation.md) và ADR ở [23](23-documentation-and-adrs.md).

> Viết kế hoạch expand/contract riêng cho V01, V03, V06 và V04 với ma trận client/schema/binary.
> Dùng SQL Server thật để thử backfill, race và rollback; bảo toàn phiên đã thu hồi, tiền và snapshot chứng từ.
> Nộp script ở trạng thái review cùng bằng chứng DB thử; không chạy lên DB vận hành hoặc bỏ hợp đồng cũ khi chưa đủ dữ liệu.
