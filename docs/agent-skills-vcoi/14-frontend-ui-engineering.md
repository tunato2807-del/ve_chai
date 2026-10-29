# 14 — Kỹ thuật giao diện VCoi theo hợp đồng

Ngày đối chiếu: 29/10/2026. Trạng thái: **chưa sửa UI; có smoke trang công khai, chưa verify màn hình reports**.
Nguồn: [frontend-ui-engineering](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/frontend-ui-engineering/SKILL.md).
Tham khảo: [accessibility-checklist](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/accessibility-checklist.md).
Mã nguồn: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Vấn đề ưu tiên: [V04 báo cáo trong báo cáo chung](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Màn hình và công việc người dùng

ADMIN tại `/quan-tri/thong-ke` cần biết khối lượng và tiền đại lý đã chi theo kỳ, rồi xuất số liệu đáng tin.
Đây là khoản chi thu mua mô phỏng; không thiết kế màn hình ví ngân hàng hoặc marketplace nhiều người mua.
Ưu tiên cải thiện trạng thái nhất quán của báo cáo hiện tại, không thay toàn bộ visual language.
CUSTOMER và COLLECTOR vẫn dùng màn hình theo vai trò, không nhận quyền xem báo cáo admin.

## Bằng chứng và mẫu đang có để tiếp tục sử dụng

- [tokens.css](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/styles/tokens.css) có Be Vietnam Pro, xanh VCoi, biến sáng/tối, focus-visible và nút 44/52px.
- [AdminReportsPage](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/pages/AdminReportsPage.jsx#L28) tách period form, metrics, charts và breakdown.
- [useAdminReports](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/useAdminReports.js#L9) quản lý query riêng, scope theo user/role/kỳ và `retry: false`.
- [ReportBreakdown](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/ReportBreakdown.jsx) có tab keyboard Arrow/Home/End, bảng có scope và vùng cuộn có nhãn.
- [App.jsx](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/App.jsx) lazy-load route, có skip-link/title; focus sau điều hướng vẫn cần kiểm tra browser.
- Hiện exportReady mới xét query success/fetching; audit schema chấp nhận overview 44.000 và chi tiết 48.000.
- Đây là bằng chứng tĩnh/fixture; chưa khẳng định responsive, contrast hoặc screen reader hiện đều đạt.

## Design contract trước khi sửa

| Thành phần      | Hợp đồng đề xuất                                                                         |
| --------------- | ---------------------------------------------------------------------------------------- |
| Thứ bậc         | Tiêu đề/kỳ áp dụng → tổng tiền/khối lượng → nhóm chi tiết → hành động xuất               |
| Hành động chính | Xuất báo cáo chỉ khi bộ dữ liệu đáp ứng hợp đồng nhất quán                               |
| Nội dung        | Nhãn tiếng Việt rõ tiền đã chi, KG/VND, kỳ theo giờ Việt Nam                             |
| Dữ liệu lệch    | Thông báo “Số liệu vừa thay đổi. Hãy tải lại báo cáo.” và hành động tải lại              |
| Responsive      | 320px một cột; mở rộng theo CSS hiện có; bảng cuộn ngang có tên truy cập được            |
| Nhận diện       | Token xanh/sáng/tối, typography và buttons hiện tại; không thêm hero/card grid trang trí |

Dùng màn hình báo cáo, bảng giá và hồ sơ đơn hiện có làm 2–3 tham chiếu nội bộ trước khi chọn layout.
Chưa có yêu cầu đổi phong cách nên không cần lấy thiết kế ngoài hoặc sao chép thương hiệu sản phẩm khác.
Nếu tham chiếu chưa đủ, ghi giả định về mật độ/khoảng cách rồi xác minh cùng màn hình thực.

## Ma trận trạng thái phải thiết kế

| Trạng thái                   | Hiển thị và thao tác                                                            |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Kỳ chưa hợp lệ               | Lỗi có thể đọc bằng screen reader; đưa người dùng về form ngày                  |
| Đang tải                     | Skeleton/AsyncState có tên, `aria-busy`; khóa xuất và tránh nháy số từ kỳ trước |
| Không giao dịch              | Tổng 0 và empty state có nghĩa; không suy đây là lỗi kết nối                    |
| Sẵn sàng, dữ liệu thống nhất | Hiển thị đầy đủ, nút xuất hoạt động                                             |
| Lệch tổng/snapshot hết hạn   | Giữ ngữ cảnh kỳ, chặn xuất, tải lại toàn bộ dữ liệu liên quan                   |
| Lỗi một phần                 | Giải thích phần chưa tải; không xuất file từ dữ liệu tổng hợp nửa cũ nửa mới    |
| 401/403                      | Dùng chính sách auth/permission hiện có; không để cache tài khoản cũ xuất tiếp  |
| Tải lại thất bại             | Thông báo rõ trạng thái dữ liệu cũ nếu còn hiển thị; không giả báo thành công   |

Không dùng optimistic update cho số tiền đã chi, quote đã chốt hay trạng thái hoàn tất.
Nếu chỉ kiểm tra tổng tiền/khối lượng ở client, ghi đây là chặn lỗi tạm thời; chưa bảo đảm cùng snapshot SQL Server.
Không cộng số đơn theo vật liệu để kiểm tra tổng đơn duy nhất, vì một đơn có thể thuộc nhiều nhóm.

## Các lát thay đổi đề xuất

1. TDD cho trường hợp dữ liệu tổng và chi tiết lệch; assert nút xuất bị khóa và có thông báo đúng.
2. Đặt logic điều kiện nhất quán tại feature reports, giữ hook dữ liệu tách component trình bày.
3. Tái sử dụng AsyncState/feedback/tokens có sẵn; không thêm state manager, UI kit hoặc wrapper tổng quát.
4. Giữ URL state cho period/group/page; dùng React Query đang có cho server state, local state cho tương tác nhỏ.
5. Tích hợp hợp đồng snapshot backend khi [15 — API](15-api-and-interface-design.md) được chốt.
6. So diff UI, test component rồi chạy browser theo [12](12-browser-testing-with-devtools.md).

Tên test/script mới cần được tạo trước; package hiện chưa có lệnh `test:reports` hay `npm test`.
Lệnh sẵn có từ `Frontend VCoi`: `npm run check` kiểm tra lint/build, không bao gồm test UI.
Không tự refactor tất cả component trên 200 dòng; chỉ tách phần cần thiết khi thay đổi làm cấu trúc khó đọc hơn.

## Accessibility và hoàn thiện giao diện

- [ ] Dùng Tab/Shift+Tab hoàn tất chọn kỳ, đổi tab, phân trang, tải lại và xuất; focus luôn nhìn thấy.
- [ ] Tablist hỗ trợ Arrow/Home/End và liên kết đúng tabpanel; không làm focus mất khi dữ liệu thay đổi.
- [ ] Lỗi và thông báo kết quả được công bố phù hợp; nút disabled có giải thích bằng văn bản khi cần.
- [ ] Heading đúng cấp; nhãn form và scope bảng giữ đầy đủ; không truyền trạng thái chỉ bằng màu.
- [ ] Đo contrast 4.5:1 chữ thường/3:1 chữ lớn và controls theo checklist, cả sáng/tối.
- [ ] Kiểm tra 320/768/1024/1440px, zoom 200%, chữ tiếng Việt dài và bảng nhiều cột.
- [ ] Kiểm tra reduced-motion, loading/empty/error/success/permission bằng screenshot và browser.
- [ ] Chạy axe và kiểm tra screen reader; không gọi WCAG đạt từ một kết quả tự động đơn lẻ.

## Nghiệm thu và giới hạn

Lint/build ngày 29/10 đã đạt. [Smoke Chromium mới](EVIDENCE.md) kiểm tra 4 trang công khai ở 320/1440px, sáng/tối.
16 trường hợp có 0 pageerror/overflow, scan axe 0 vi phạm trong phạm vi WCAG2A/AA/21AA và 5 tương tác cơ bản đạt.
Baseline không bao gồm `/quan-tri/thong-ke`, đủ ba vai trò, 768/1024px hoặc kết quả screen reader/contrast thủ công.
Chưa có ảnh trước/sau bản sửa reports, trace tương tác hoặc nghiệm thu accessibility toàn ứng dụng.
Nghiệm thu sửa UI cần test hành vi thực, screenshot trước/sau cùng viewport và console/network liên quan.
Không thêm thư viện/caching vì cảm giác “chậm”; đo baseline nếu hiệu năng là vấn đề của lần sửa.
Hoàn thành frontend chặn export chưa tự đóng V04 cho đến khi tính nhất quán database được chứng minh.

## Prompt bàn giao

> Áp dụng frontend-ui-engineering cho trạng thái báo cáo V04 tại `/quan-tri/thong-ke`.
> Giữ tokens xanh, sáng/tối và component/query hiện có; đọc design contract và ma trận trạng thái trên.
> Viết test trước cho dữ liệu lệch tổng, chặn xuất và đưa hành động tải lại dễ dùng bằng bàn phím.
> Bàn giao ảnh 4 viewport, kết quả bàn phím/axe và giới hạn snapshot backend; không viết lại giao diện toàn dự án.
