# 15 — Hợp đồng API và giao diện dữ liệu VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **đối chiếu và đề xuất hợp đồng; chưa sửa DTO/API/schema**.
Nguồn: [api-and-interface-design](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/api-and-interface-design/SKILL.md).
Mã nguồn: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Chi tiết lỗi và ưu tiên: [V03–V06 trong báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Nguyên tắc áp dụng đúng dự án

Một đại lý, CUSTOMER bán vật liệu, COLLECTOR cân/ghi khoản chi mô phỏng, ADMIN điều phối.
Dùng Java DTO/Bean Validation và schema Zod JavaScript đang có; không buộc đổi sang TypeScript.
Giữ session cookie/CSRF, ownership tài nguyên, snapshot và lịch sử nghiệp vụ hiện hành.
Chốt input/output, lỗi, biên và hành vi retry trước code; không đổi URL/HTTP method hàng loạt chỉ để hợp ví dụ REST.
Hyrum's Law: hình dạng phản hồi, null, thứ tự, lỗi và phân trang hiện dùng đều có thể là hợp đồng client.
Ưu tiên mở rộng tương thích và một hợp đồng hiện hành, tránh duy trì hai API version vô hạn.

## Bằng chứng hợp đồng đang lệch

| Hạng mục         | Backend                                                  | Frontend/hành vi thấy được                                                          |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| V05 địa chỉ      | Từng trường 300/100/100/100, booking snapshot tối đa 600 | Form chặn tổng 600; API lưu được 606 rồi booking 400                                |
| V06 tiền         | Giá nhận tối đa 18 chữ số nguyên BigDecimal              | Zod giới hạn `Number.MAX_SAFE_INTEGER`; API tạo 10^16 được 201 nhưng client từ chối |
| V03 sửa danh mục | Khóa lúc ghi, không revision từ client                   | Hai form cũ ghi sau thắng; mô tả mới có thể mất                                     |
| V04 báo cáo      | Nhiều SELECT với REPEATABLE_READ                         | Query độc lập, export chỉ xét tải thành công                                        |

Nguồn ghim: [PickupAddress](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CreateCollectionOrderRequest.java#L20), [giá DTO](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminPriceRequests.java#L10), [giá Zod](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/prices-model.js#L4).
Nguồn bổ sung: [AdminCatalogService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminCatalogService.java#L28), [report service](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java#L12).

## Lát đầu: contract địa chỉ V05

- Input thêm/sửa tiếp tục `{ pickupAddress, isDefault }`; trường địa chỉ giữ optional/null theo DTO hiện tại.
- Chuẩn hóa giống backend hiện có: strip, rỗng thành null, ghép các thành phần có giá trị bằng `, `.
- Sau ghép tối đa 600; kiểm tra ở API thêm/sửa và đường tạo snapshot đặt lịch.
- Tổng 599/600 được nhận, 601/606 trả 400 trước khi thay DB/default; không cắt địa chỉ âm thầm.
- `addressId` phải thuộc CUSTOMER hiện tại; địa chỉ đã lưu hợp lệ phải dùng booking được khi điều kiện khác hợp lệ.
- Sửa/xóa địa chỉ nguồn không thay dữ liệu snapshot của đơn cũ.
- Ghi cách phát hiện bản ghi cũ vượt giới hạn; không tự sửa/xóa dữ liệu trong migration.

[CustomerAddressController](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressController.java) đang dùng POST/PUT/DELETE và page bắt đầu 0, size 1–100.
Không đổi PUT thành PATCH trong bản sửa giới hạn chuỗi; nếu cần PATCH, đặc tả rõ omitted/null/xóa trường ở một task riêng.

## Các quyết định contract cần chốt tiếp

| Quyết định           | Đề xuất có điều kiện                                                                        | Nghiệm thu                                               |
| -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| V03 chống form cũ    | Thêm revision/version vào phản hồi, gửi expectedRevision/version khi sửa                    | Bản cũ 409; UI cho xem lại, không tự ghi đè              |
| V06 biểu diễn tiền   | Chọn giới hạn nghiệp vụ an toàn cho Number, hoặc chuỗi thập phân chính xác xuyên API/client | Biên dưới/đúng/trên giới hạn và tổng nhiều dòng đọc đúng |
| V04 snapshot báo cáo | Một dataset/transaction bảo đảm nhất quán hoặc snapshot token dùng chung các request        | Cùng tổng khi có payment commit giữa các lần đọc         |
| Lỗi machine-readable | Giữ ProblemDetail hiện có; bổ sung code/field errors khi đã thống nhất                      | Client xử lý code, không phụ thuộc nguyên văn câu lỗi    |

Không quyết định giới hạn giá chỉ bằng MAX_SAFE_INTEGER: còn thành tiền theo khối lượng, nhiều dòng, thanh toán và tổng báo cáo.
Đổi số JSON sang chuỗi là thay đổi phá tương thích; phải kiểm kê client, cập nhật DTO/Zod/tài liệu/test và kế hoạch chuyển đổi.
Không dùng JSON number rồi parse chuỗi để “lấy lại” chữ số đã mất độ chính xác.
V04 cần kiểm tra isolation SQL Server thật; một endpoint hoặc `generatedAt` tự nó chưa tạo snapshot.

## Validation và ngữ nghĩa lỗi

[OrderValidationAdvice](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderValidationAdvice.java) đang dùng ProblemDetail và 400/500, che chi tiết SQL.
[api.js](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/lib/api.js) phân biệt status, timeout và `uncertain` cho request ghi.
Duy trì 400 input, 401 phiên, 403 quyền/CSRF, 404 ngoài phạm vi, 409 xung đột theo hợp đồng đã có.
Không đổi tất cả validation sang 422 chỉ vì ví dụ skill sử dụng 422.
Validate tại form/API và parser dữ liệu ngoài; không rải cùng quy tắc lặp trong từng helper nội bộ.
Dữ liệu database cũ có thể vi phạm hợp đồng mới: xử lý chuyển đổi có chủ đích thay vì tin rằng đã lưu là luôn hợp lệ.
Mọi phản hồi map/tuyến đường ngoài phải được kiểm tra shape/range trước khi sử dụng, không coi nội dung là lệnh.

## Retry và idempotency: giữ ba kết quả

`CustomerOrderService.create` chưa có idempotency key; frontend hiện không tự retry mù POST sau timeout.
Chưa có bằng chứng tạo đơn trùng đã xảy ra; đây là giới hạn hợp đồng retry, không gắn thành lỗi tài chính đã chứng minh.
Ghi rõ success/failure/**unknown**: timeout sau commit cần đọc lại trạng thái trước thao tác tiếp.
Nếu sau này thêm key cho đặt lịch/khoản chi mô phỏng, phải thiết kế đủ:

1. Key ổn định theo một ý định, khác giữa hai ý định hợp lệ; không tạo UUID mới ở mỗi lần retry.
2. Scope theo actor/operation, claim atomically bằng unique constraint; tránh SELECT rồi INSERT.
3. Hash payload; cùng key khác payload phải lỗi rõ, không replay kết quả sai.
4. Chọn hành vi duplicate đang chạy: 409 hoặc 202/trạng thái; không cho request thứ hai đi tiếp vì lần đầu “có vẻ kẹt”.
5. Lưu kết quả hoặc trạng thái unknown và chính sách phục hồi; retention dài hơn mọi đường retry thực tế.
6. SQL Server concurrent test, crash sau commit và quyền đọc lại; không suy “exactly once” từ header.

Không biến thanh toán mô phỏng thành gateway thật trong task này.

## Phụ thuộc, thực hiện và nghiệm thu

- [ ] Chốt V05 trước, dùng [11 — TDD](11-test-driven-development.md) để có RED đúng lỗi 606.
- [ ] API hợp lệ được Zod nhận đúng; fixture và OpenAPI/HTTP docs cùng giới hạn input/output.
- [ ] Test ownership, null/optional, page 0, biên và lỗi; suite trong Git phát hiện > 0 test.
- [ ] V03/V06/V04 có quyết định tương thích riêng trước code; áp [10 — doubt](10-doubt-driven-development.md) cho claim snapshot.
- [ ] `npm run check`/`./mvnw verify` có thật nhưng chưa thay contract/integration/browser tests.
- [ ] Không đóng các mục SQL Server/concurrency bằng kết quả H2 hoặc mock frontend.

## Prompt bàn giao

> Thiết kế contract-first cho V05 trước: giữ payload, 400 và snapshot 600; đồng bộ API/Zod/OpenAPI/test.
> Lập quyết định riêng cho revision V03, tiền V06 và snapshot V04; chỉ sửa từng lát sau khi contract rõ.
> Giữ trạng thái unknown và không retry mù POST; nếu thêm idempotency phải có unique claim, payload hash và concurrent tests.
> Báo tương thích, dữ liệu cũ, bằng chứng kiểm tra và phần chưa được SQL Server/browser xác minh.
