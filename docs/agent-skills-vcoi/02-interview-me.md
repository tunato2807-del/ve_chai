# 02 — Làm rõ ý định và quyết định nghiệp vụ của VCOI

> **DRAFT · 29/10/2026** — Bản chuẩn bị phỏng vấn và ghi nhận điều chưa rõ; không phải Statement of Intent đã được xác nhận.
> Skill gốc: [interview-me, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/interview-me/SKILL.md).
> Baseline: [VCOI 2c804bc](https://github.com/1250080247-cloud/VCOI/tree/2c804bc8090dee4dcdb2ca150404c534ce35f669).

## Giả thuyết ý định

**Giả thuyết:** chủ dự án cần bộ Markdown áp dụng 25 kỹ năng vào VCOI để biết cần sửa gì, vì sao và cách kiểm chứng.
**Độ tin cậy của người soạn: khoảng 95% cho đầu ra tài liệu**, dựa trên yêu cầu tạo các tệp áp dụng vào dự án.
Đây không phải điểm đo từ phỏng vấn và không xác nhận các chính sách nghiệp vụ bên dưới.
**Độ tin cậy về mục tiêu triển khai: dưới 70%** vì chưa chốt dùng để demo, thử nội bộ hay tiếp nhận dữ liệu thật.
Vẫn hoàn thành bộ tài liệu theo phạm vi đã giao; không mở một vòng xác nhận lặp lại để được phép viết.

## Điều có thể đọc được, không hỏi lại

| Điều đã có bằng chứng                                   | Nguồn VCOI                                                                                                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Một đại lý thu mua, không phải sàn nhiều người mua      | [pom.xml:16](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml#L16) và mô hình nghiệp vụ trong [báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md). |
| Backend đang xác thực trạng thái tài khoản trên request | [AccountSessionFilter:19](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java#L19).            |
| Phân công lại hiện chỉ nhận ASSIGNED                    | [OrderChangeService:38](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java#L38).              |
| Sửa danh mục khóa dòng nhưng chưa có revision client    | [AdminCatalogService:28](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminCatalogService.java#L28).           |
| Frontend giới hạn số nguyên an toàn khi đọc tiền        | [prices-model:4](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/prices-model.js#L4).                                                |

Không hỏi người dùng lại phiên bản framework, nơi chứa code hoặc các lệnh có thể đọc từ dependency file.
Không giả định mức tải, số nhân viên, số tiền tối đa hay thời hạn lưu dữ liệu khi chúng chưa được nêu.

## Bản diễn đạt ý định để rà soát

- **Kết quả:** có hướng dẫn áp dụng từng skill vào những vấn đề thực của VCOI.
- **Người dùng:** chủ dự án và người phát triển tiếp nhận việc sửa; ba vai trò nghiệp vụ vẫn giữ nguyên.
- **Lý do hiện tại:** đã có báo cáo V01–V13, cần chuyển thành đầu vào thực hiện và nghiệm thu.
- **Thành công:** tài liệu truy được đến source, chia được task, không nhầm build xanh với test nghiệp vụ.
- **Ràng buộc:** tiếp tục stack và mô hình hiện tại; tránh thay đổi rộng chưa có nhu cầu.
- **Ngoài phạm vi lượt này:** triển khai app, deploy, giao dịch ngân hàng, cài plugin toàn cục, tự phê duyệt nghiệp vụ.

Trạng thái sáu dòng trên: **DRAFT để người tiếp nhận hiểu phạm vi**, không gắn nhãn “ý định đã được xác nhận”.

## Danh sách quyết định còn mở

Đây là hàng đợi cho **các phiên trao đổi sau khi thực sự cần triển khai**; không gửi đồng loạt như một bảng khảo sát.
Mỗi lượt chỉ chọn một câu hỏi có ảnh hưởng trực tiếp task đang làm, kèm giả thuyết và hệ quả.

| ID  | Câu hỏi chuẩn bị                                                                | Giả thuyết để phản hồi                                                 | Điều thay đổi theo câu trả lời                             |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| I01 | Mốc kế tiếp là demo, thử nội bộ hay dùng dữ liệu thật?                          | Trước mắt ưu tiên tái lập và sửa luồng hiện có.                        | V10–V12 có trở thành điều kiện chặn phát hành hay chưa.    |
| I02 | Khóa rồi mở tài khoản có phải buộc mọi thiết bị cũ đăng nhập lại?               | Có; khóa được dùng như thu hồi phiên, còn sửa hồ sơ không nên làm vậy. | Chính sách sessionVersion/revokedAt và test V01.           |
| I03 | Khi nhân viên ngừng làm ở ARRIVED, ai có quyền bàn giao và giữ lại dữ liệu nào? | ADMIN có thể bàn giao có lý do; giữ dữ liệu đã được chấp thuận.        | Ma trận trạng thái V02, trách nhiệm cân/báo giá/khoản chi. |
| I04 | Những biểu mẫu nào phải báo xung đột thay vì lưu sau thắng?                     | Danh mục/vật liệu trước; địa chỉ và hồ sơ theo mức cần thiết.          | Phạm vi revision V03 và chi phí UI.                        |
| I05 | Giới hạn tiền VND thực tế và chính sách số lẻ là gì?                            | Cần giới hạn nghiệp vụ thấp hơn vùng mất chính xác của Number.         | Kiểu API, validation, tổng nhiều dòng và V06.              |
| I06 | Người quản trị cần file xuất đại diện thời điểm nào?                            | Một snapshot có thể đối chiếu với màn hình đã xem.                     | V04 chọn snapshot token, một lần tải hay cơ chế khác.      |

Các giả thuyết trong bảng là đề xuất của người soạn, không phải lời người dùng đã nói.
Nếu câu trả lời chỉ là “chuẩn”, “ổn định”, “hiện đại”, cần chuyển về tình huống cụ thể thay vì ghi chúng thành acceptance.
Ví dụ thay “ổn định hơn” bằng “hai request ghi khoản chi cho một quote chỉ tạo tối đa một khoản chi hoàn tất”.

## Ví dụ một lượt trao đổi khi triển khai V02

```text
Câu hỏi: Tại ARRIVED, nhân viên bị khóa thì ADMIN có được giao cho nhân viên khác không?
Giả thuyết: Có, sau khi ghi lý do; số cân/minh chứng đã có vẫn giữ lịch sử.
Căn cứ: reassign hiện chỉ ASSIGNED, nên đường tiếp tục bằng nhân viên khác còn thiếu.
Hệ quả: cần chốt trách nhiệm xác nhận lại cân và quyền ghi khoản chi trước khi sửa endpoint.
```

Không diễn giải sự im lặng là đồng ý, không tự điền câu trả lời vào ADR.
Nếu chưa có phản hồi, giữ V02 ở trạng thái thiết kế DRAFT và làm task độc lập đã rõ như khôi phục test V07.

## Hành động và điều kiện nghiệm thu

1. Với task được giao, chọn đúng quyết định liên quan từ hàng đợi; ghi ngày, người quyết định và nội dung thực nhận.
2. Cập nhật một bản diễn đạt ngắn theo Outcome/User/Why now/Success/Constraint/Out of scope.
3. Chỉ khi đã trao đổi thật mới ghi độ tin cậy sau phỏng vấn và trạng thái xác nhận.
4. Chuyển nội dung được chốt sang spec/ADR; phần chưa chốt giữ riêng với giả thuyết.

- [ ] Tài liệu hiện tại phân biệt được sự thật từ code, giả thuyết và quyết định chưa có chủ sở hữu.
- [ ] Khi phỏng vấn thật, từng lượt có một câu hỏi và một giả thuyết, không hỏi lại thông tin đã đọc được.
- [ ] Intent được gọi là “đã xác nhận” chỉ sau xác nhận thực tế, lưu được nội dung và phạm vi cụ thể.
- [ ] Không thay đổi hành vi runtime dựa vào các câu trả lời giả định của tài liệu này.

## Trạng thái và prompt bàn giao

Đã áp dụng: đọc bối cảnh, dựng giả thuyết, chuẩn bị restatement và hàng đợi quyết định.
Chưa thực hiện: phỏng vấn trực tiếp, đạt cổng xác nhận ý định của skill, phê duyệt V01/V02/V03/V04/V06.

```text
Đọc 02-interview-me và task được giao. Không hỏi lại quyền tạo bộ tài liệu đã được yêu cầu.
Phân loại thông tin thành code/báo cáo, giả thuyết, quyết định đã ghi nhận.
Nếu task cần quyết định mới, chọn duy nhất câu hỏi liên quan, đính kèm giả thuyết và hệ quả.
Hoàn thành phần độc lập còn lại; không dựng câu trả lời hoặc trạng thái approved.
```

Phụ thuộc: [01](01-using-agent-skills.md), [03](03-idea-refine.md), [04](04-spec-driven-development.md), [task](tasks/todo.md).
