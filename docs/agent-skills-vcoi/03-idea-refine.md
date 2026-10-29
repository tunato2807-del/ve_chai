# 03 — Tinh chỉnh hướng phát triển VCOI

> **DRAFT · 29/10/2026** — Khuyến nghị của người soạn, chưa phải hướng sản phẩm được chủ dự án phê duyệt.
> Skill gốc: [idea-refine, commit eb07f19](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/idea-refine/SKILL.md).
> Đã đọc thêm: [frameworks](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/idea-refine/frameworks.md), [rubric](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/idea-refine/refinement-criteria.md), [examples](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/idea-refine/examples.md).

## Vấn đề và người hưởng lợi

**Làm thế nào giúp một đại lý tiếp tục đơn thu mua có thể đối chiếu được, kể cả khi có lỗi hoặc thay người, với chi phí phát triển phù hợp code hiện tại?**
ADMIN cần biết đơn nào cần xử lý; COLLECTOR cần tiếp tục đúng việc được giao; CUSTOMER cần cân, báo giá và khoản tiền mô phỏng nhất quán.
Người phát triển cần chứng minh sửa đúng mà không phụ thuộc test cất trên máy riêng.
Mục tiêu thành công đề xuất là clone mới chạy được test và một đơn đi hết luồng ba vai trò, có ca ngoại lệ kiểm chứng được.
Chưa có dữ liệu khảo sát người dùng, mức tải thực tế hoặc thời hạn phát hành để coi đây là nhu cầu thị trường đã xác nhận.

## Bằng chứng để mở rộng ý tưởng đúng chỗ

| Hiện trạng                    | Nguồn cố định                                                                                                                                                                                            | Cơ hội                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Test chuyển ra kho riêng      | [README:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7)                                                                                          | Làm bản demo có thể tái lập và bắt lỗi thật.                   |
| Reassign chỉ ASSIGNED         | [OrderChangeService:38](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java#L38)         | Tập trung vào gián đoạn công việc thay vì thêm nhiều màn hình. |
| Báo cáo lấy nhiều nguồn riêng | [useAdminReports:9](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/useAdminReports.js#L9)                                     | Tăng khả năng đối chiếu một kỳ và file xuất.                   |
| Đơn giữ snapshot địa chỉ      | [CustomerAddressService:68](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L68) | Xây lòng tin từ lịch sử hiện có, không viết lại toàn bộ.       |

## Pha mở rộng — bảy biến thể có lý do

1. **Đơn giản hóa: bản demo tái lập.** Một lệnh kiểm tra mỗi dự án, fixture ba vai trò và một đơn xuyên suốt; giải quyết việc người khác không chạy lại được test.
2. **Đảo chiều: xử lý việc đang mắc trước khi tạo thêm việc.** ADMIN xem đơn còn người phụ trách bị khóa trước thao tác khóa; tránh chỉ thêm nút reassign không hiểu giai đoạn.
3. **Góc nhìn chuyên gia đối soát: hồ sơ một đơn.** Ghép snapshot địa chỉ, phiên bản cân, quote đã nhận và khoản chi mô phỏng để giải thích số cuối; tận dụng lịch sử sẵn có.
4. **Chuyển trọng tâm người dùng: COLLECTOR khi mất mạng.** Hiển thị trạng thái kết quả ghi chưa rõ và hướng dẫn đọc lại trước gửi lại; không vội xây đồng bộ offline đầy đủ.
5. **Bỏ giới hạn tài nguyên: điều phối nhiều nhân viên cùng lúc.** Thử tải/cạnh tranh SQL Server, session nhiều instance và giám sát; vẫn chỉ một đại lý, nhưng chi phí vận hành lớn hơn MVP.
6. **Kết hợp: bàn giao có bằng chứng.** Một luồng ADMIN bàn giao theo trạng thái, người mới xem hồ sơ kế thừa, người cũ mất quyền; kết hợp ngoại lệ vận hành với lịch sử hiện tại.
7. **Giảm phạm vi: báo cáo có thể đối chiếu.** Một snapshot dùng cho tổng quan, dòng chi tiết và XLSX; ưu tiên sự đúng của con số trước thêm biểu đồ.

Không biến biến thể 4 thành tự retry POST; hợp đồng hiện tránh retry mù các lần ghi chưa rõ kết quả.
Không biến biến thể 5 thành nhiều đại lý hoặc thanh toán ngân hàng: hai thay đổi đó cần bài toán và hợp đồng mới.

## Pha hội tụ — ba hướng khác nhau

Đánh giá dưới đây là nhận định kỹ thuật dựa trên code và [V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md), chưa có phản ứng của người dùng cuối.

| Hướng                                             | Giá trị người dùng                                                                          | Khả thi và phần khó nhất                                                                           | Khác biệt hữu ích                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A. Một đơn có thể kiểm chứng (1 + phần cốt lõi 3) | Người tiếp nhận chạy được luồng và phát hiện sai lệch; giá trị trực tiếp cho bàn giao dự án | Cao hơn hai hướng còn lại; rủi ro là không lấy lại được test archive và phải viết ca trọng yếu mới | Từ demo chỉ chạy máy tác giả sang quy trình có thể tái lập; không phải khác biệt thị trường đã chứng minh. |
| B. Điều phối khi gián đoạn (2 + 4 + 6)            | ADMIN/COLLECTOR tiếp tục công việc khi nhân viên không làm tiếp được                        | Trung bình; khó nhất là giữ trách nhiệm cân, quote, khoản chi và khóa lịch đúng                    | Ngoại lệ có dấu vết thay vì mở khóa tài khoản như cách xử lý thủ công.                                     |
| C. Đối soát báo cáo (7 + phần tổng hợp 3)         | ADMIN giải thích được cùng số tiền trên màn hình và file xuất                               | Trung bình; cần chốt cohort, snapshot, phân trang và isolation SQL Server                          | Cùng một bộ dữ liệu cho quyết định quản trị; không chỉ tăng số biểu đồ.                                    |

**Khuyến nghị: bắt đầu A**, sau đó chọn B hoặc C theo nhu cầu thử nghiệm thực tế.
A tạo nền kiểm chứng để làm B/C an toàn; hiện báo cáo đã chỉ ra test và CI còn thiếu.
Khuyến nghị này không phải kết quả biểu quyết hoặc xác nhận của chủ dự án.

## Kiểm tra giả định ẩn

| Hướng | Điều bắt buộc phải đúng và cách kiểm tra                                                                                 | Điều có thể làm hướng thất bại                                                     | Tạm để ngoài và lý do                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A     | Mục tiêu gần là bàn giao code chạy lại được; kiểm tra bằng người mới chạy clone/fixture theo hướng dẫn                   | Không có môi trường/fixture tái lập và không cấp được SQL Server cho ca cạnh tranh | Load test và chạy nhiều instance, vì chưa có số tải cần đạt.           |
| B     | ADMIN thực sự cần đổi người sau khởi hành; xác minh bằng walkthrough EN_ROUTE/ARRIVED/AWAITING_PAYMENT với chủ nghiệp vụ | Không xác định được ai chịu trách nhiệm cân/quote/khoản chi sau bàn giao           | Thu thập GPS nền và offline sync, vì tăng dữ liệu nhạy cảm và phạm vi. |
| C     | Người quản trị dùng file xuất để đối chiếu cùng kỳ; đối chiếu một tình huống có thanh toán xen giữa các request          | Chưa thống nhất cohort theo ngày tạo đơn hay ngày chi tiền, hoặc snapshot quá nặng | Data warehouse và BI ngoài, vì chưa đo nhu cầu/khối lượng.             |

## One-pager đề xuất cho hướng A

**Vấn đề:** build hiện chạy được nhưng nguồn test chính thức không ở Git; người nhận không chứng minh được luồng đúng từ clone mới.
**Hướng đề xuất:** tái lập một hành trình CUSTOMER đặt lịch → ADMIN gán → COLLECTOR cân → CUSTOMER nhận quote → COLLECTOR ghi chi mô phỏng.
**Phạm vi MVP:** fixture giả ba vai trò; một ca thành công; ca ownership, version cũ, quote chưa được nhận và ghi chi lặp; báo cáo kết quả thực chạy.
**Giới hạn:** không tuyên bố test H2 chứng minh cạnh tranh SQL Server; ca phụ thuộc database thật có job/môi trường riêng.
**Thời lượng:** chưa cam kết ngày hoàn tất khi chưa biết khả năng khôi phục archive; chia mỗi task thành một phiên kiểm chứng được.

### Những việc chưa làm trong MVP

- Thanh toán thực: cần gateway, callback và đối soát riêng, hiện chỉ mô phỏng.
- Viết lại stack/state manager: chưa có đo đạc cho thấy cần thay React, SQL Server hay session.
- Đa đại lý và ứng dụng mobile: ngoài mô hình đã có và không kiểm tra giả định cốt lõi.
- Tự động bàn giao mọi trạng thái: cần quyết định V02; không nới endpoint bằng một điều kiện chung.
- Thêm cache/index theo phỏng đoán: đo query plan và tải trước khi quyết định.

### Thành công có thể đo

- [ ] Clone mới có test frontend/backend được phát hiện lớn hơn 0, không cần đường dẫn ổ D: của tác giả.
- [ ] Hành trình ba vai trò có bằng chứng bước và số tiền từ quote đã chấp thuận.
- [ ] Mỗi ca âm trên có lỗi/HTTP mong đợi và chứng minh không tạo thay đổi trái phép.
- [ ] Có ít nhất một lần cố ý làm hỏng điều kiện nghiệp vụ và thấy suite đỏ; không chỉ kiểm tra gọi mock.
- [ ] Phần chưa chạy trên SQL Server, trình duyệt thật hoặc tải thực tế được ghi riêng.

## Trạng thái và prompt bàn giao

Đã áp dụng: HMW/JTBD, bảy biến thể, đánh giá ba hướng, kiểm tra giả định, phạm vi MVP và danh sách bỏ ngoài.
Chưa thực hiện: khảo sát người dùng, phản hồi chọn hướng, phê duyệt cuối, code/test/CI mới.

```text
Đọc 03-idea-refine, báo cáo V01–V13 và 04-spec-driven-development.
Dùng hướng A làm khuyến nghị kỹ thuật DRAFT; không gọi là lựa chọn đã duyệt.
Chuyển một capability được giao thành spec có acceptance, ưu tiên khả năng tái lập.
Ghi giả định cần xác nhận; giữ B/C làm lựa chọn có điều kiện, không cộng cả ba vào MVP.
```

Phụ thuộc: [02](02-interview-me.md), [04](04-spec-driven-development.md), [06](06-planning-and-task-breakdown.md), [kế hoạch](tasks/plan.md).
