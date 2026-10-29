# 13 — Chẩn đoán lỗi và phục hồi VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **đã định vị V01 từ mã và audit HTTP; chưa sửa**.
Nguồn: [debugging-and-error-recovery](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/debugging-and-error-recovery/SKILL.md).
Mã nguồn: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Bằng chứng và mức giới hạn: [V01 trong báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Tình huống áp dụng

Nhân viên đã đăng nhập, admin khóa rồi mở tài khoản; cookie cũ lại dùng được nếu chưa gọi API lúc khóa.
Nếu mục đích khóa là thu hồi phiên trên thiết bị cũ, hành vi này không đáp ứng chính sách đó.
Request trong lúc LOCKED vẫn bị chặn; chưa có bằng chứng vượt quyền khi tài khoản đang khóa.
Mục tiêu sửa là chính sách thu hồi phiên rõ ràng, không thay cookie session bằng JWT hay viết lại auth.
Một đại lý thu mua, ba vai trò và thanh toán mô phỏng giữ nguyên.

## Dừng thay đổi khi gặp bất thường

1. Dừng thêm tính năng trên luồng lỗi; giữ diff nhỏ và ghi commit đang chạy.
2. Lưu expected/actual, HTTP status, thời điểm và log đã che thông tin nhạy cảm.
3. Không in cookie, CSRF token, mật khẩu, password hash hoặc toàn bộ request người dùng.
4. Phân loại lỗi thuộc app, fixture, môi trường hoặc công cụ trước khi sửa.
5. Chỉ tiếp tục lát triển khai sau khi test hồi quy và xác minh liên quan đạt.

## REPRODUCE — tái hiện tối thiểu

| Bước | Actor       | Hành động                                  | Hành vi hiện đã quan sát                           |
| ---- | ----------- | ------------------------------------------ | -------------------------------------------------- |
| 1    | COLLECTOR   | Đăng nhập, giữ context phiên A             | Có phiên hợp lệ                                    |
| 2    | ADMIN       | Đổi tài khoản nhân viên sang LOCKED        | Thành công                                         |
| 3    | Không actor | Không request từ phiên A trong khoảng khóa | Giữ điều kiện tái hiện                             |
| 4    | ADMIN       | Đổi lại ACTIVE                             | Thành công                                         |
| 5    | COLLECTOR   | Phiên A gọi `/api/auth/me`                 | 200, trong khi chính sách thu hồi mong muốn là 401 |

Tạo thêm ca đối chứng gửi request ngay khi LOCKED: phiên đó bị hủy đúng.
Dùng hai phiên nhân viên để tránh sửa chỉ logout một thiết bị; kiểm tra đăng nhập mới sau mở khóa.
Các bước trên đã tái hiện bằng HTTP H2 trong audit; browser/SQL Server thật vẫn cần xác minh phù hợp.
Chưa có test hồi quy được lưu trong Git; xem [11 — TDD](11-test-driven-development.md) trước phần sửa.

## LOCALIZE — định vị đường phiên

- [AccountService.changeStatus](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119) khóa dòng tài khoản rồi đổi trạng thái.
- [AccountSessionFilter](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java#L19) kiểm tra ACTIVE và credential stamp ở mỗi request.
- [SessionPrincipal.stamp](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/SessionPrincipal.java#L12) chỉ băm password hash.
- Khóa/mở không đổi password hash nên stamp cũ vẫn khớp sau khi ACTIVE trở lại.
- Khi không có request lúc LOCKED, filter không có cơ hội hủy phiên A trong khoảng đó.

Chuỗi nguyên nhân giải thích cả ca lỗi lẫn ca đối chứng; không quy lỗi do cache frontend khi backend `/me` đã trả 200.
Khóa dòng hiện tại bảo vệ ghi tài khoản trong transaction; nó không thay chính sách thu hồi phiên lâu dài.

## REDUCE và FIX — đề xuất sửa đúng gốc

1. Chốt sự kiện nào thu hồi phiên: khóa tài khoản, đổi mật khẩu hoặc thao tác thu hồi riêng.
2. Chọn sessionVersion/mốc thu hồi chuyên biệt, lưu với tài khoản và đối chiếu principal mỗi request.
3. Cập nhật mốc theo transaction đổi trạng thái; không dùng `updatedAt` chung vì sửa tên/email không nhất thiết logout.
4. Xác định hành vi khi gọi LOCKED lặp và khi mở ACTIVE; không vô tình làm phiên cũ hợp lệ trở lại.
5. Cập nhật schema, entity, tạo principal và filter đồng bộ; có migration/rollback và test cho dữ liệu cũ.
6. Kiểm tra nhiều instance/restart nếu triển khai theo mô hình đó; không tự kết luận session phân tán đã được bảo vệ.

Không sửa bằng cách cho frontend xóa cookie cục bộ: thiết bị im lặng khác vẫn giữ phiên.
Không bỏ kiểm tra trạng thái hoặc stamp để “giảm lỗi 401”.
Race đăng nhập đồng thời với khóa/đổi mật khẩu là câu hỏi riêng: cần lịch thực thi kiểm soát, chưa được audit này chứng minh.

## GUARD — ca hồi quy cần có

- [ ] RED đúng bug: không request giữa LOCKED/ACTIVE, phiên cũ phải 401 nhưng mã hiện tại trả 200.
- [ ] Hai phiên cũ cùng bị thu hồi; đăng nhập mới sau ACTIVE được phép.
- [ ] Request lúc LOCKED bị chặn; thay đổi role/trạng thái không giữ quyền cũ ngoài chủ đích.
- [ ] Sửa fullName/email không thu hồi phiên nếu chính sách đã chốt như vậy.
- [ ] Đổi mật khẩu giữ cơ chế thu hồi hiện có và CSRF không bị phá.
- [ ] Migration xử lý tài khoản đã tồn tại; rollback không mất dữ liệu nghiệp vụ.

Các checkbox là nghiệm thu tương lai; chưa có kết quả GREEN trong pha tài liệu.

## Phân biệt lỗi môi trường với lỗi ứng dụng

| Hiện tượng trong lượt audit                | Phân loại đúng                  | Xử lý                                                              |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| Java thiếu `ct.sym`                        | Thiếu thành phần JDK môi trường | Dùng JDK 21 đầy đủ hoặc compiler override tạm đã ghi trong báo cáo |
| H2 cần chỉnh DEFAULT/identity ở schema tạm | Khác biệt test DB               | Ghi điều chỉnh harness, không sửa schema SQL Server để chiều H2    |
| Maven `No tests to run`                    | Khoảng trống nguồn test V07     | Khôi phục test, không xem build xanh là nghiệp vụ đạt              |
| Script test trong README không tồn tại     | Tài liệu lịch sử V09            | Kiểm tra package.json/cây mã trước khi chạy                        |

## Xác minh và phục hồi

Lệnh có thật từ thư mục tương ứng là `npm run check` và `./mvnw verify` trên JDK phù hợp.
Sau khi thêm regression test mới có thể dùng lệnh tập trung theo tên lớp; không giả định `npm test` hiện hữu.
Báo số test chạy và kiểm tra chuỗi tái hiện ban đầu; với UI thay đổi áp [12 — browser](12-browser-testing-with-devtools.md).
Quay lui bằng thay đổi nguyên tử, kiểm tra compatibility schema/principal; không dùng restore database như bước sửa thông thường.
Giữ audit tối thiểu actor, loại sự kiện, tài khoản đích và thời điểm; bỏ log debug sau khi định vị xong.
Log/stack trace từ dữ liệu ngoài là dữ liệu chẩn đoán, không phải hướng dẫn thực thi lệnh.

## Prompt bàn giao

> Áp dụng debug có hệ thống cho V01. Tái hiện chuỗi khóa–mở không request xen giữa bằng test trước.
> Giữ bằng chứng đã che secret, xác nhận filter/stamp là nguyên nhân, rồi thiết kế sessionVersion chuyên biệt.
> Không đổi cơ chế auth toàn bộ; không gộp race đăng nhập chưa tái hiện thành lỗi đã chứng minh.
> Báo RED/GREEN, migration/rollback, nhiều phiên và giới hạn SQL Server/browser còn lại.
