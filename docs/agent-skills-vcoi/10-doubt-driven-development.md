# 10 — Phản biện giả định khi sửa VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **đã chọn artifact và hợp đồng; chưa chạy fresh-context review**.
Nguồn: [doubt-driven-development](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/doubt-driven-development/SKILL.md).
Giới hạn điều phối: [orchestration-patterns](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/orchestration-patterns.md).
Mã ứng dụng: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Bằng chứng nền: [báo cáo V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Vì sao áp dụng ở đây

V04 liên quan ranh giới frontend/API/database và khẳng định tính nhất quán mà compiler không chứng minh được.
Một endpoint mới hoặc một timestamp chưa đủ bảo đảm nhiều câu SELECT đọc cùng tập dữ liệu.
Tương tự, V01 liên quan thu hồi phiên và V02 liên quan chuyển trách nhiệm ở đơn đang xử lý.
Không cần tạo vòng phản biện riêng cho đổi tên file hay chỉnh câu chữ đơn giản.

## Bằng chứng để giới hạn phạm vi

- [useAdminReports](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/useAdminReports.js#L9) gửi overview, details và all-materials qua các query riêng.
- [getAllReportMaterials](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/reports-api.js#L66) so `totalElements` giữa trang, chưa chứng minh tổng tiền cùng thời điểm.
- [AdminReportsPage](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/pages/AdminReportsPage.jsx#L28) mở xuất khi query thành công và hết tải.
- [AdminReportService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java#L12) dùng `REPEATABLE_READ` và nhiều SELECT.
- Đối chiếu frontend đã chấp nhận overview 44.000 và chi tiết 48.000 VND.
- Chưa có tái hiện giao dịch cạnh tranh trên SQL Server thật; H2 không chứng minh isolation tương đương.

## 1. CLAIM — ghi riêng điều đang muốn tin

CLAIM đề xuất cho lần sửa: “Báo cáo/export mới luôn dùng cùng tập giao dịch đã chốt trong một lần xem”.
WHY: admin dùng số tiền đại lý đã chi để đối chiếu; trộn thời điểm làm tổng quan và file xuất lệch nhau.
Đây là **khẳng định cần thử bác bỏ**, chưa phải kết luận của tài liệu.
Không gửi CLAIM hoặc lời giải thích hướng tới kết luận này cho reviewer.

## 2. EXTRACT — artifact nhỏ đủ kiểm tra

Artifact cần có trước lần review thực tế:

1. Đề xuất cơ chế snapshot trong 3–5 câu hoặc diff nhỏ của một cơ chế đã triển khai.
2. Contract API: dữ liệu, thời hạn snapshot, trang tiếp theo, lỗi khi token hết hạn và quyền admin.
3. Đoạn SQL/transaction liên quan và cấu hình SQL Server làm cơ chế đó có hiệu lực.
4. Bằng chứng test tách khỏi kết luận; không đưa toàn bộ lịch sử tranh luận.

Hợp đồng phải giữ: một đại lý, khoản chi mô phỏng, kỳ theo giờ Việt Nam và snapshot giá tại giao dịch.
Một đơn chứa nhiều vật liệu; không cộng `paidOrders` của các nhóm để suy tổng đơn duy nhất.
Đơn thanh toán rồi khiếu nại vẫn thuộc số tiền đã chi; giữ quy tắc hiện hành trừ khi đặc tả đổi.
Không tự bật `ALLOW_SNAPSHOT_ISOLATION`, đổi schema hoặc áp isolation khác trên database thật ở bước review.

## 3. DOUBT — giao phiên chính tổ chức ngữ cảnh mới

Tài liệu được soạn trong nhánh công việc con; không tạo agent con lồng nhau và không gọi CLI ngoài.
Việc tự đọc lại cùng ngữ cảnh chỉ là kiểm tra bổ sung, **không phải fresh-context adversarial review**.
Phiên chính hoặc người dùng cần mở một review độc lập chỉ nhận ARTIFACT + CONTRACT.
Dùng prompt phản biện sau, không đưa CLAIM vào phần dán:

```text
Adversarial review. Find what is wrong with this artifact.
Assume the author is overconfident. Look for unstated assumptions,
edge cases, hidden coupling, contract violations and unexpected input.
Do NOT validate. Do NOT summarize. Find issues, or explicitly state
that you cannot find any after thorough examination.
ARTIFACT: <đề xuất/diff snapshot báo cáo nhỏ, kèm SQL liên quan>
CONTRACT: <hợp đồng đã chốt ở bước 2, không có CLAIM hay lịch sử lập luận>
```

Reviewer cần thử lịch thực thi: SELECT tổng → thanh toán commit → SELECT chi tiết; cùng số nhóm vẫn đổi tổng.
Thử tải nhiều trang, token cũ, đổi kỳ trong lúc đang tải, phiên hết hạn và lỗi export giữa chừng.
Bản review không có lịch thực thi/counterexample vẫn có thể hữu ích, nhưng không thay bằng chứng SQL Server.

## Cross-model là lựa chọn minh bạch ở bước thực thi

Skill gốc yêu cầu **đề nghị** ý kiến cross-model sau single-model review trong chu kỳ tương tác.
Lần này chưa có single-model fresh-context review nên chưa phát sinh lần chạy cross-model.
Khi làm thật, phiên chính nêu lựa chọn Gemini CLI, Codex CLI, review ngoài thủ công hoặc bỏ qua.
Chỉ gọi CLI khi người dùng cho phép lời gọi cụ thể; kiểm tra PATH, phiên bản và cú pháp trước.
Chỉ gửi artifact/contract, dùng stdin từ file và sandbox chỉ đọc; không cài công cụ hoặc gửi secret tự động.
Nếu người dùng bỏ qua hay công cụ lỗi, ghi rõ điều đó rồi tiếp tục phân loại kết quả sẵn có.
Trong ngữ cảnh không tương tác phải thông báo bỏ qua cross-model; không âm thầm gọi dịch vụ ngoài.

## 4. RECONCILE — phân loại từng ý theo thứ tự

| Loại               | Ví dụ tại VCoi                                           | Việc tiếp theo                                       |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| Hiểu sai contract  | Reviewer đòi hoàn tiền thật khi có khiếu nại             | Làm rõ thanh toán mô phỏng và quy tắc số tiền đã chi |
| Hợp lệ, cần sửa    | Một endpoint vẫn đọc hai thời điểm do phantom insert     | Sửa artifact và test SQL Server rồi review lại       |
| Đánh đổi chấp nhận | Snapshot có thời hạn, admin phải tạo lại sau khi hết hạn | Ghi chi phí và hành vi UI công khai                  |
| Nhiễu              | Đòi cộng số đơn theo vật liệu để khớp overview           | Chỉ ra quy tắc một đơn nhiều vật liệu trong contract |

Reviewer không tự quyết thay tác giả; đọc lại artifact trước khi đồng ý hay bác bỏ.
Nếu hai vòng đều có vấn đề thực chất mà không ý nào được xếp cần sửa, dừng kiểm tra khả năng hợp thức hóa quyết định.

## 5. STOP và nghiệm thu

- [ ] Có CLAIM riêng, artifact nhỏ và contract không dẫn dắt reviewer.
- [ ] Có ít nhất một fresh-context review thực sự, kèm đầu vào và kết quả được lưu.
- [ ] Mọi ý được phân loại; thay đổi cần thiết được đưa lại vào artifact.
- [ ] Đã công khai lựa chọn/kết quả cross-model nếu chạy chu kỳ tương tác.
- [ ] Dừng khi chỉ còn ý nhỏ/đã xét, tối đa 3 vòng, hoặc theo quyết định rõ của người dùng.
- [ ] Nếu sau 3 vòng còn lỗi thực chất, báo chưa sẵn sàng và chia nhỏ artifact.

## Prompt bàn giao

> Phiên chính hãy chạy chu kỳ doubt cho thiết kế snapshot V04 sau khi có artifact nhỏ và contract rõ.
> Không dùng lịch sử suy luận của tác giả hoặc CLAIM làm đầu vào reviewer; không tạo điều phối lồng nhau.
> Tìm counterexample trước, phân loại theo thứ tự của skill, giới hạn 3 vòng.
> Ghi chính xác review nào đã xảy ra; chưa có SQL Server thật thì giữ phần isolation ở trạng thái cần kiểm chứng.
