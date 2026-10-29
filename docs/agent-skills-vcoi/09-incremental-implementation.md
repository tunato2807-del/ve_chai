# 09 — Triển khai từng lát nhỏ cho VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **kế hoạch áp dụng, chưa sửa ứng dụng**.
Nguồn: [incremental-implementation](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/incremental-implementation/SKILL.md).
Chuẩn kết thúc: [Definition of Done](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/definition-of-done.md).
Mã ứng dụng đối chiếu: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Bối cảnh và kết quả kiểm chứng: [báo cáo V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Mục tiêu và giới hạn

Áp dụng chu kỳ triển khai → test → xác minh → lưu mốc cho **V05: địa chỉ đã lưu phải dùng đặt lịch được**.
Một đại lý thu mua: CUSTOMER bán, COLLECTOR cân, ADMIN điều phối; thanh toán mô phỏng.
Giữ React/JavaScript, Spring Boot/Java 21, SQL Server và session cookie/CSRF hiện có.
Không gộp sửa phiên, tiền, báo cáo hay tái cấu trúc giao diện vào cùng thay đổi.
Mỗi lát phải có tiêu chí riêng, chạy được và có đường quay lui.

## Bằng chứng từ dự án

- [PickupAddress](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CreateCollectionOrderRequest.java#L20) giới hạn từng trường 300/100/100/100 ký tự.
- [CustomerAddressService.create/update](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34) lưu các trường mà chưa kiểm tra tổng sau ghép.
- [CustomerOrderService.create](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43) ghép `", "` và từ chối snapshot dài hơn 600.
- [addressFormSchema](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L17) đã chặn tổng dài hơn 600 ở frontend.
- Ca HTTP đã thấy: 300 + 100 + 100 + 100 + ba dấu phân cách = 606; lưu 201, đặt lịch 400.
- `npm run check` đã đạt lint/build; Maven verify đạt nhưng `No tests to run`.
- 142 đối chiếu HTTP bổ sung là bằng chứng audit, chưa thay thế suite được lưu trong Git.

## Phụ thuộc trước khi triển khai

1. Dùng [11 — TDD](11-test-driven-development.md) để khôi phục đủ test/fixture cho V05 theo V07.
2. Chốt quy tắc chuẩn hóa: `strip`, trường trống thành null, bỏ trường null khi ghép, dấu phân cách `, `.
3. Chốt giới hạn snapshot vẫn là 600, giữ nguyên giới hạn từng trường và ownership của địa chỉ.
4. Khảo sát bản ghi cũ vượt giới hạn bằng truy vấn chỉ đọc; không tự sửa dữ liệu người dùng.
5. Xác định SQL Server thử nghiệm nếu cần xác minh đường lưu/đọc đầy đủ.

## Các lát triển khai đề xuất

| Lát | Phạm vi nhỏ nhất                                                          | Bằng chứng nghiệm thu                                         | Quay lui                                         |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| 0   | Khôi phục harness/fixture và kiểm tra kết nối tối thiểu; chưa sửa hành vi | Harness phát hiện và chạy > 0 test nền                        | Revert riêng harness nếu chưa dùng chung         |
| 1   | RED cho V05, rồi quy tắc tổng dùng chung thêm/sửa/đặt lịch                | RED 400/201; GREEN 599/600 nhận, 601/606 bị chặn              | Revert cả test/hành vi của lát, không đổi schema |
| 2   | Bao phủ luồng lưu → chọn địa chỉ → đặt lịch và snapshot lịch sử           | Địa chỉ hợp lệ đặt được đơn; sửa/xóa nguồn không đổi đơn cũ   | Revert riêng thay đổi tích hợp nếu có            |
| 3   | Tài liệu API/lỗi và hướng dẫn xử lý bản ghi cũ                            | API và frontend mô tả cùng giới hạn; ca browser có bằng chứng | Revert tài liệu riêng; không xóa địa chỉ tự động |

Lát 1 là một thay đổi hành vi hoàn chỉnh xuyên đường ghi, dù đụng nhiều file Java.
RED là mốc quan sát cục bộ; chỉ lưu/merge lát sau GREEN, không để suite đỏ giữa các lát.
Không đưa một hàm chưa có người dùng vào main rồi coi đó là đã sửa V05.
Nếu lát vượt khoảng 100 dòng chưa xác minh, dừng và chia lại theo hành vi.
Không cần feature flag cho validator nhỏ đã hoàn chỉnh; tính năng chưa sẵn sàng phải giữ mặc định an toàn.

## Chu kỳ bắt buộc cho từng lát

1. Đọc diff hiện tại và đánh dấu file được phép sửa; ghi vấn đề ngoài phạm vi vào backlog.
2. Chạy test tập trung khi thay đổi có thể ảnh hưởng nó; ghi số ca thực thi.
3. Kiểm tra toàn suite liên quan, lint/build và đường runtime tương ứng.
4. Sau GREEN mới rút gọn phần lặp; tránh framework validation tổng quát cho một quy tắc địa chỉ.
5. Lưu mốc thay đổi nguyên tử với mô tả hành vi và kết quả xác minh khi bước sửa được giao thực hiện.
6. Chỉ chuyển sang lát tiếp theo khi lát hiện tại chạy được; không lặp lệnh trên mã không đổi để tăng số kiểm tra.

## Lệnh và trạng thái thực tế

Từ thư mục `Frontend VCoi`, lệnh hiện có:

```bash
npm run check
```

Từ `ecothugom-backend`, trên JDK 21 đầy đủ, lệnh hiện có:

```bash
./mvnw verify
```

Lệnh tập trung **đề xuất, chỉ dùng sau khi đã thêm test có tên này**:

```bash
./mvnw -Dtest=CustomerAddressContractTest test
```

Không dùng `npm test` hoặc `test:address` như lệnh đã tồn tại: package.json chưa khai báo chúng.
Môi trường audit thiếu `ct.sym`; workaround compiler đã ghi trong báo cáo, không sửa POM để né lỗi môi trường.

## Điều kiện hoàn tất

- [ ] Quan sát được RED trước sửa và GREEN sau sửa cho thêm/sửa địa chỉ vượt tổng giới hạn.
- [ ] Địa chỉ 599/600 sau chuẩn hóa được lưu và dùng đặt lịch với dữ liệu vật liệu/khung giờ hợp lệ.
- [ ] Bản ghi 601/606 bị từ chối mà không thay địa chỉ mặc định hoặc để lại dữ liệu dở dang.
- [ ] Ownership, giới hạn 100 địa chỉ và snapshot đơn cũ giữ đúng.
- [ ] Có số test thực thi, build/lint và bằng chứng runtime; áp dụng Definition of Done.
- [ ] Chưa đánh dấu V05 đã sửa nếu mới hoàn thành tài liệu hoặc harness.

## Prompt bàn giao

> Áp dụng incremental-implementation cho V05 tại commit nguồn đã ghim. Đọc báo cáo và guide 11 trước.
> Chỉ triển khai lát 0 rồi lát 1; giữ SQL Server, schema và giao diện hiện có.
> Quan sát test kỳ vọng 400 cho địa chỉ 606 thất bại với hành vi 201 trước khi sửa.
> Sau mỗi lát báo diff, số test, kết quả build, giới hạn môi trường và cách revert.
> Không gộp V01–V04/V06, không gọi lint/build là test nghiệp vụ; chưa deploy hay đổi dữ liệu thật.
