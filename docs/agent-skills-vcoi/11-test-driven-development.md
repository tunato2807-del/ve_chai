# 11 — TDD cho lỗi địa chỉ VCoi

Ngày đối chiếu: 29/10/2026. Trạng thái: **đã có ca lỗi audit; chu kỳ RED–GREEN–REFACTOR chưa thực hiện**.
Nguồn: [test-driven-development](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/test-driven-development/SKILL.md).
Tham khảo: [testing-patterns](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/references/testing-patterns.md); ví dụ JS phải đổi theo stack dự án.
Mã nguồn: commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.
Bối cảnh: [V05, V07 trong báo cáo](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Khám phá stack trước khi viết test

- [package.json](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10): React 19.3.1, Vite 8.3.5, JavaScript ESM; `check` chỉ lint/build.
- Vitest, Testing Library, jsdom đã khai báo; **chưa có script test hay nguồn test frontend** trong commit.
- [pom.xml](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml): Spring Boot 4.1.1, Java 21, Maven Wrapper, các starter test và H2 test-scope.
- Chưa có `src/test`; Maven verify thực tế báo `No tests to run`.
- README nói nguồn test/fixture nằm ngoài Git ở một đường dẫn Windows; clone mới không có các tệp đó.
- 142 đối chiếu HTTP và 17 đối chiếu frontend bổ sung gồm ca xác nhận lỗi, không phải bằng chứng hoàn thành TDD.

Đây là tài liệu, không thay đổi hành vi; không cần viết test chỉ để xác minh Markdown.
Khi bắt đầu sửa bug, phải tạo và **quan sát test thất bại trước phần code sửa**.

## Hành vi cần bảo vệ

V05: địa chỉ có thể lưu thành công nhưng không dùng đặt lịch được do giới hạn tổng 600 ký tự.
[PickupAddress](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CreateCollectionOrderRequest.java#L20) cho 300/100/100/100 từng trường.
[CustomerAddressService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34) chưa kiểm tra tổng ở create/update.
[CustomerOrderService](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43) kiểm tra sau ghép `, `.
Frontend [addressFormSchema](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L17) đã kiểm tra tổng; thêm test backend mới bắt đúng khoảng trống.

## RED — test đầu tiên phải bắt lỗi thật

1. Khôi phục harness tối thiểu từ nguồn đáng tin hoặc tạo fixture tổng hợp; không mang credential/dữ liệu thật vào Git.
2. Tạo CUSTOMER ACTIVE và phiên hợp lệ; thực hiện đúng cơ chế CSRF nếu dùng đường HTTP.
3. POST `/api/customer/addresses` với tên/điện thoại hợp lệ, `addressLine="A"×300`, ward/district/province mỗi trường 100.
4. Assert **400**, số địa chỉ không tăng và địa chỉ mặc định không đổi.
5. Chạy trên mã chưa sửa: phải quan sát thất bại do **expected 400, actual 201**.
6. Lưu tên test, lệnh, assertion và kết quả RED; lỗi compile, DB chưa kết nối hoặc CSRF 403 chưa phải RED đúng bug.

Tên đề xuất: `CustomerAddressContractTest.rejectsComposedAddressOver600OnCreate`.
Đường dẫn đề xuất: `ecothugom-backend/src/test/java/com/ecothugom/orders/CustomerAddressContractTest.java`.
Đây là file **chưa tồn tại**, không phải báo cáo rằng test đã được chạy.

```bash
# Đề xuất sau khi thêm lớp test và cấu hình fixture hợp lệ:
./mvnw -Dtest=CustomerAddressContractTest test
```

Dùng MVC/integration chạy validation thật và logic lưu thật; mock service trả 400 sẽ không chứng minh bug.
H2 có thể hỗ trợ feedback nhanh cho giới hạn chuỗi; SQL Server vẫn cần cho đường DB thực và các invariant cạnh tranh.

## GREEN — sửa ít nhất để đạt hợp đồng

1. Đưa ghép/chuẩn hóa/kiểm tra tổng vào một điểm dùng chung phù hợp với module orders.
2. Áp dụng cho cả thêm/sửa địa chỉ và snapshot đặt lịch, giữ giới hạn 600.
3. Không chỉ thêm chặn ở frontend vì API trực tiếp là đường tái hiện lỗi.
4. Không cắt địa chỉ âm thầm hoặc tăng cột snapshot để làm test xanh.
5. Chạy lại test tập trung, xác nhận 400 và không có ghi dở; rồi mở rộng ma trận bên dưới.

## Ma trận hồi quy đề xuất

| Ca                                             | Kỳ vọng                                         | Cỡ test            |
| ---------------------------------------------- | ----------------------------------------------- | ------------------ |
| Tổng sau chuẩn hóa 599/600                     | Lưu và đặt lịch bằng addressId thành công       | Unit + integration |
| Tổng 601/606                                   | Thêm/sửa trả 400, DB và mặc định giữ nguyên     | Integration        |
| ward/district rỗng, null hoặc chỉ khoảng trắng | Quy tắc ghép nhất quán frontend/backend         | Unit               |
| Địa chỉ thuộc CUSTOMER khác                    | Không đọc/sửa/dùng đặt lịch được                | Integration        |
| Đã có đơn, rồi sửa/xóa địa chỉ nguồn           | Snapshot liên hệ/địa chỉ của đơn cũ giữ nguyên  | Integration        |
| Gõ địa chỉ hợp lệ trong trình duyệt            | Lưu → chọn → đặt lịch đúng thông báo và dữ liệu | E2E chọn lọc       |

Kiểm tra riêng giới hạn từng trường để lỗi 601 không bị che bởi một trường quá dài.
Dùng clock điều khiển được và pickup window tương lai hợp lệ để không fail vì thời gian.
Assert trạng thái/dữ liệu trả về; không chỉ assert số lần gọi `jdbc.update` hay mock được gọi.
Mỗi test tự tạo dữ liệu và dọn theo fixture; không phụ thuộc thứ tự hoặc `sleep` tùy ý.

## REFACTOR và kiểm tra toàn bộ

Sau GREEN, loại bỏ lặp đúng phạm vi quy tắc địa chỉ; chạy lại test sau mỗi bước refactor.
Giữ test dễ đọc theo Arrange–Act–Assert; tên mô tả điều kiện và kết quả.
Không trích abstraction chỉ để giảm vài dòng setup; ưu tiên hàm thật hơn mock nội bộ.
Frontend test dùng Vitest hiện có, không sao chép nguyên API Jest trong reference.
`npm test`, `test:address` và cấu hình Vitest cần được khôi phục/thêm và ghi nhãn trước khi hướng dẫn chạy.

```bash
# Lệnh đã có, chạy từ từng thư mục tương ứng khi code liên quan thay đổi:
npm run check
./mvnw verify
```

`verify` chỉ đạt nghiệm thu test khi log phát hiện và chạy số test > 0, không có skip che lỗi.
Trên môi trường audit thiếu `ct.sym`, dùng workaround ghi ở báo cáo hoặc JDK 21 đầy đủ; không sửa POM vì lỗi môi trường.
Không lặp lại lệnh đã đạt trên code không đổi để tăng độ tin cậy giả.

## Nghiệm thu và bàn giao

- [ ] Có log RED đúng assertion 400/201 trước sửa và GREEN sau sửa cho cùng test.
- [ ] Các ca biên, lỗi và snapshot lịch sử được suite trong Git bảo vệ.
- [ ] Full suite thực thi > 0; lint/build đạt; giới hạn H2/SQL Server và browser được ghi rõ.
- [ ] Không gọi kiểm tra audit đã có là chu kỳ TDD hay khẳng định đã sửa V05.

> Hãy sửa V05 bằng TDD trên commit nguồn đã ghim. Đầu tiên tạo test integration thực cho POST địa chỉ 606.
> Cho tôi thấy RED expected 400/actual 201, rồi mới sửa quy tắc dùng chung cho create/update/booking.
> Giữ giới hạn 600, ownership và snapshot cũ; không đổi schema/dependency ngoài nhu cầu harness.
> Báo tên test, số ca, lệnh thực tế và những phần chưa chạy trên SQL Server/trình duyệt.
