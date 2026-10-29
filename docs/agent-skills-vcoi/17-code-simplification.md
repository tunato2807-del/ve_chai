# 17 — Đơn giản hóa mã mà giữ nguyên hành vi VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: hướng dẫn áp dụng, chưa refactor ứng dụng.

Nguồn skill: [code-simplification/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/code-simplification/SKILL.md).
Mã đối chiếu: VCOI tại `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Báo cáo liên quan: [V05, V07 và các quyết định cần giữ](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Mục tiêu và nguyên tắc

Giảm số nơi phải hiểu cùng một quy tắc khi bảo trì luồng khách bán phế liệu.
Giữ nguyên đầu vào, đầu ra, thứ tự tác dụng phụ, thông báo lỗi và quyền truy cập.
Một thay đổi chấp nhận địa chỉ trước đây bị từ chối hoặc ngược lại là sửa nghiệp vụ, phải có phạm vi riêng.
Không dùng số dòng giảm được làm bằng chứng duy nhất rằng mã dễ hiểu hơn.

## Bằng chứng và cơ hội cụ thể

| Vị trí cố định theo commit                                                                                                                                                                                                                                                                                                                | Hiện trạng                                                                                | Cách áp dụng                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [account-api.js:8](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L8) và [booking/schema.js:31](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/booking/schema.js#L31)   | Lặp khai báo tên, điện thoại, bốn phần địa chỉ và vị trí trong hai schema JavaScript.     | Cân nhắc module địa chỉ thuần, tránh để booking phụ thuộc toàn bộ module API tài khoản. |
| [account-api.js:21](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L21) và [booking/schema.js:75](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/booking/schema.js#L75) | Cùng ghép các phần bằng `filter(Boolean).join(', ')`, rồi so tổng với 600.                | Tách hàm tính chuỗi/độ dài và hằng giới hạn; giữ thông báo riêng của từng form.         |
| [CustomerOrderService.java:43](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43)                                                                                                                                 | Backend ghép snapshot và kiểm tra 600 ký tự khi đặt lịch; lưu địa chỉ chưa kiểm tra tổng. | V05 cần sửa hành vi backend riêng; không gộp vào PR refactor frontend.                  |

Việc hai ngôn ngữ cùng thực thi hợp đồng là cần thiết tại hai ranh giới tin cậy.
Không đề xuất Java gọi trực tiếp validator JavaScript hay bỏ validation API để tránh lặp.
Sự khác nhau giữa lọc giá trị rỗng ở JavaScript và lọc `null` ở Java cần được đối chiếu bằng dữ liệu, không sửa ngầm khi trích hàm.
Mã Java viết ngắn hoặc nhiều lệnh trên một dòng chưa tự chứng minh lỗi nghiệp vụ.

## Các bước thực hiện khi bắt đầu một PR refactor

1. Đọc hai schema, hàm `requiredText`/`optionalText`, bên gọi và payload gửi API.
   Dùng `git blame` để biết vì sao có giới hạn, bước transform và thông báo hiện tại.
2. Khôi phục test thuộc V07 hoặc tạo characterization test nhỏ cho đúng phạm vi địa chỉ.
   Checkout hiện không có nguồn test, nên lint/build xanh chưa đủ bảo đảm giữ hành vi.
3. Ghi bảng trước/sau: trường bắt buộc, chuỗi rỗng, khoảng trắng, `null`, dấu phẩy và độ dài sau chuẩn hóa.
   Có ca 599/600/601 ký tự, ward/district bỏ trống, tiếng Việt và vị trí tùy chọn.
4. Tách một module thuần chứa các field chung và phép ghép địa chỉ nếu bảng hành vi chứng minh tương đương.
   Không import `apiRequest`, React Query hay cả `account-api.js` vào schema booking.
5. Thay một bên gọi, chạy test; thay bên còn lại, chạy lại.
   Giữ `isDefault`, lịch hẹn, items và transform payload ở đúng module nghiệp vụ của chúng.
6. Đọc lại diff: loại bỏ abstraction nếu chỉ đổi tên mà khiến luồng khó theo dõi hơn.
   Nếu cần sửa lỗi V05, kết thúc refactor rồi mở thay đổi riêng với ca hồi quy của backend.

## Kiểm chứng

Lệnh hiện có, chạy trong `Frontend VCoi` sau khi đã cài dependency theo chính sách lifecycle được rà soát:

```bash
npm run check
```

Lệnh này chỉ chạy ESLint và Vite build; **không chạy Vitest**.
Lệnh test chính thức phải được bổ sung cùng nguồn test trước khi coi refactor đã được bảo vệ.
Không ghi `npm test` như lệnh đang có: `package.json` hiện chưa khai báo script này.
So sánh payload và lỗi của cả hai form với baseline, không sửa kỳ vọng test để hợp thức hóa khác biệt.
Không đổi dependency hoặc toàn bộ định dạng dự án trong cùng PR.

## Tiêu chí nghiệm thu

- [ ] Mỗi quy tắc trích ra có ít nhất hai bên dùng đã được đối chiếu thực tế.
- [ ] Tập đầu vào, payload, thông báo và vị trí hiển thị lỗi giữ nguyên.
- [ ] Test phạm vi chạy thật, lint/build đạt và không phát sinh vòng import.
- [ ] Form lưu địa chỉ và form đặt lịch vẫn giữ phần việc riêng rõ ràng.
- [ ] Quyền sở hữu địa chỉ, snapshot đơn cũ và validation backend không bị yếu đi.
- [ ] Diff đủ nhỏ để reviewer giải thích được thay đổi mà không đọc lại cả ứng dụng.

## Phụ thuộc và bàn giao

Ưu tiên [khôi phục kiểm thử](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md) trước refactor nhạy cảm.
Đồng bộ hợp đồng địa chỉ với hướng dẫn API và V05; dùng [20](20-git-workflow-and-versioning.md) để tách commit.

Prompt bàn giao:

> Áp dụng code-simplification cho phần địa chỉ dùng chung giữa account-api.js và booking/schema.js ở VCOI.
> Đọc bên gọi và ghi bảng hành vi trước; chỉ trích logic JavaScript đã chứng minh trùng.
> Giữ lỗi, transform và payload hiện tại; chạy characterization test và npm run check.
> Báo rõ phần chưa kiểm thử; tách sửa V05 backend thành công việc riêng.
