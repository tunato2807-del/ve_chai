# VCoi / EcoThuGom

Đồ án hệ thống thương mại điện tử thu mua phế liệu của một đại lý: React JavaScript, Java Spring Boot và SQL Server. Thanh toán được mô phỏng trong phạm vi đồ án.

Cập nhật tài liệu: 26/10/2026. Đây là README chung của backend và frontend; nội dung tài liệu trước đây được gom theo nhóm để tra cứu.

**Lưu trữ kiểm thử:** toàn bộ test, fixture và script `verify-*` được chuyển khỏi mã dự án sang `D:\Vcoi1\EcoThuGom-Test-Archive-20261026`, giữ nguyên cây thư mục. Các lệnh và số liệu kiểm thử ở những ghi chú lịch sử dưới đây mô tả lần chạy trước khi lưu trữ; muốn chạy lại cần khôi phục các tệp về đúng đường dẫn trong dự án. `npm run check` hiện chỉ chạy lint và build.

**Chạy trên máy khác:** xem [bộ cài database và hướng dẫn demo](#demo-may-khac). Hướng dẫn này dùng đường dẫn sau khi giải nén và cổng SQL của máy mới.

**Rà soát mới nhất sau mục 7:** R1 [đã sửa và kiểm tra trên SQL Server](#sua-loi-dong-thoi-tai-khoan); R2 [đã sửa cảnh báo trước khi bỏ kết luận khiếu nại](#sua-r2-ket-luan-khieu-nai); R3 [đã sửa fixture và chạy lại kiểm thử bảng giá](#sua-r3-fixture-bang-gia).

## Chạy dự án

SQL Server chứa EcoThuGomDB cần đang chạy. Profile Windows hiện kết nối localhost:1435; các mô tả cổng khác trong báo cáo cũ là thông tin tại thời điểm kiểm thử.

Backend — mở PowerShell:

```powershell
cd D:\VCOI\ecothugom-backend
.\scripts\start-local.ps1
```

Frontend — mở terminal khác:

```powershell
cd "D:\VCOI\Frontend VCoi"
npm ci # khi cần cài dependency từ package-lock.json
npm run dev
```

- Website: http://127.0.0.1:5173
- API: http://127.0.0.1:8080
- Backend dùng session cookie và CSRF; khởi động lại backend cần đăng nhập lại.
- Test không nằm trong cây mã và không được đưa vào bản build website.

Luồng chính: khách đặt lịch → admin xác nhận/phân công → nhân viên khởi hành/đến nơi → cân → gửi báo giá → khách duyệt → thanh toán mô phỏng → hoàn tất.

Các báo cáo và kế hoạch bên dưới ghi nhận theo thời điểm. Thông tin cập nhật mới hơn và cấu hình trong dự án là căn cứ vận hành hiện tại. Bản sửa cạnh tranh giá nháp ngày 25/10 đã có ở backend/frontend: thao tác sửa/duyệt/từ chối gửi expectedRevision; bản cũ nhận 409 và yêu cầu tải lại.

<a id="cap-nhat-ho-so-admin"></a>
## Cập nhật hồ sơ đơn admin và hai lỗi điều hướng

Ngày 25/10/2026: đã hoàn thiện phần hồ sơ thu mua tại `/quan-tri/don/:id`, dùng API admin hiện có.

- Cân thực tế: kết quả mới nhất, tổng/bì/thực nhận, lịch sử cân điều chỉnh và lý do.
- Ảnh minh chứng: ảnh vật liệu của khách và ảnh phiếu cân, mở ảnh riêng tư theo quyền với đơn.
- Báo giá: các phiên bản, bản hiện hành, phản hồi của khách và đơn giá đã chốt; giữ snapshot từ backend.
- Thanh toán: các khoản ghi nhận được đối chiếu với báo giá đã chấp thuận.
- Timeline: sự kiện, người xử lý, trạng thái/phân công cũ và mới; phân trang 20 sự kiện.
- Biên nhận: `/quan-tri/don/:id/bien-nhan`, xem/in/lưu PDF. Đơn đã thanh toán đang khiếu nại vẫn có biên nhận; đơn chưa thanh toán không có biên nhận giả định.

Các thao tác trong hồ sơ là chỉ đọc. Truy vấn tách theo tài khoản, vai trò, đơn và version; kết quả cân hoặc chứng từ không đồng bộ sẽ bị chặn hiển thị và yêu cầu tải lại. Giao diện giữ tokens quản trị VCoi, hỗ trợ sáng/tối, màn hình nhỏ và phím mũi tên/Home/End trong thanh tab. Nội dung biên nhận dùng chung với khu khách hàng. Backend và cấu trúc SQL giữ nguyên.

Hai lỗi đã sửa theo báo cáo rà soát:

- Đặt lịch: giữ bản nháp nhập dở trong bộ nhớ phiên, tách theo tài khoản; khôi phục khi quay lại bằng điều hướng trong website. Cảnh báo trước khi đóng/tải lại trang có nội dung chưa gửi. Xóa bản nháp sau gửi thành công, khi kết quả gửi chưa xác định và khi phiên đăng nhập được xóa. Không lưu thông tin liên hệ vào localStorage hoặc sessionStorage; bản nháp không tồn tại qua lần tải lại trang đã được người dùng chấp thuận.
- Danh sách khách/nhân viên: dùng tham số URL `page` bắt đầu từ 0, giữ trang khi tải lại/Back/quay về từ chi tiết; giữ tham số khác và kiểm tra đường quay về đúng khu vực.

Lệnh kiểm tra:

```powershell
cd "D:\VCOI\Frontend VCoi"
npm run check
npm run test:dossier
npm run test:navigation
.\scripts\verify-live-dossier.ps1
```

Kịch bản live dùng Spring Boot/SQL Server thật trên cổng thử 18080/5174, dữ liệu tổng hợp riêng và ảnh riêng, có guard dọn theo marker. Kết quả hồ sơ admin: 12 kiểm tra Chrome dùng fixture và 12 kiểm tra với API/SQL thật đạt; dữ liệu thử được dọn. Hai lỗi điều hướng: 9 kiểm tra Chrome dùng fixture đạt. Đầu ra tại `.cache/admin-order-dossier/`, `.cache/live-admin-dossier/` và `.cache/workspace-navigation/`.

Kiểm tra cuối ngày 25/10: toàn bộ 494 test trong 43 tệp đạt; lint, build production và kiểm tra định dạng đều thành công. Luồng khách hàng sau khi dùng chung biên nhận đạt thêm 27/27 kiểm tra Chrome, kết quả tại `Frontend VCoi/.cache/customer-workspace/results.json`. Website cổng 5173 và API cổng 8080 trả HTTP 200; hai cổng kiểm thử 18080/5174 đã dừng. Ba tệp bảng giá cũ được chuẩn hóa định dạng, đối chiếu cây cú pháp trước/sau xác nhận không đổi logic.

<a id="cap-nhat-phan-cong-lai"></a>
## Phân công lại nhân viên trước khi khởi hành

Ngày 25/10/2026: mục 3 của báo cáo rà soát đã được bổ sung trên frontend. Trong Quản trị, mở đơn đang ASSIGNED, chọn nhân viên thay thế và nhập lý do, bấm **Xem lại phân công**, kiểm tra người cũ/người mới/lịch hẹn rồi **Xác nhận phân công lại**.

- Dùng POST `/api/admin/orders/{id}/reassign` hiện có, gửi đúng `version`, `collectorId` và `reason`; cookie phiên và CSRF dùng chung lớp API. Không thay đổi backend, database, dependency hoặc cấu trúc URL.
- Chỉ cho đổi ở ASSIGNED trước khi khởi hành; nhân viên mới phải khác người hiện tại và đang hoạt động. Lý do bắt buộc, tối đa 500 ký tự. Backend kiểm tra lại quyền, trạng thái, version và lịch trùng trong giao dịch.
- Thành công giữ nguyên lịch hẹn và trạng thái ASSIGNED, tăng version, cập nhật nhân viên từ phản hồi đã kiểm tra; làm mới danh sách và số đếm. Timeline lưu lý do và nhân viên cũ/mới. Nhân viên cũ mất quyền với đơn.
- Kết quả HTTP 404/409 hoặc chưa xác định sau lỗi kết nối/5xx chặn gửi lại đến khi tải lại đủ đơn và nhân viên. Sau tải lại phải chọn lại, nhập lại lý do và xem lại; không tự phát lại yêu cầu. Phiên đăng nhập thay đổi chặn thao tác và cập nhật cache cũ.
- Giữ nhận diện xanh của VCoi, hỗ trợ sáng/tối, màn hình nhỏ, nhãn biểu mẫu, lỗi từng trường và chuyển focus đến phần xem lại. Taste Skill được áp dụng cho việc giữ nhận diện; màn hình nghiệp vụ dùng các component và mẫu biểu mẫu sẵn có.

Lệnh kiểm tra bổ sung tại `D:\VCOI\Frontend VCoi`:

```powershell
npm run test:reassignment
.\scripts\verify-live-reassignment.ps1
```

Kịch bản live dùng bản build với backend thử 18080 và frontend thử 5174, tài khoản/đơn tổng hợp có marker riêng; dọn dữ liệu theo marker và không khởi động lại dịch vụ chính. Đây là kiểm tra Chrome/API/SQL Server, không phải kết quả chạy collection qua Postman CLI.

Kết quả xác minh: `npm run check` đạt 516/516 test trong 44 tệp, lint không có lỗi/cảnh báo và build production thành công; `npm run format:check` đạt. Bộ tập trung xác nhận/phân công/phân công lại đạt 42/42. `npm run test:reassignment` đạt 10/10 kiểm tra Chrome dùng fixture, gồm sáng/tối, bàn phím, axe, 320/768/1024/1440 px và lỗi 401/403/404/409/500. Kịch bản live đạt 15/15 trên Chrome + Spring Boot + SQL Server, gồm trùng lịch, hai phiên admin riêng, nhân viên khởi hành khi admin đang xem, quyền của người cũ/mới và timeline; dọn dữ liệu tổng hợp đạt. Đầu ra tại `Frontend VCoi/.cache/admin-reassignment/result.json` và `Frontend VCoi/.cache/live-admin-reassignment/result.json`. Lượt live đầu bị dừng do đầu số điện thoại tổng hợp 06 không hợp lệ; đã sửa dữ liệu thử thành 03 theo quy tắc backend rồi chạy lại thành công.

Các tệp chính: `src/features/orders/AdminDispatch.jsx`, `ReassignmentForm.jsx`, `useAdminDispatch.js`, `dispatch-api.js` và `src/styles/dispatch.css` trong frontend. Chức năng phân công lại dùng chung luồng xác nhận/phân công và cơ chế cache hiện có; không tạo luồng API trùng lặp.

Các mục 3–7 của danh sách cũ đã được bổ sung trong các cập nhật bên dưới.

<a id="cap-nhat-anh-phieu-can"></a>
## Nhân viên tải ảnh phiếu cân

Ngày 25/10/2026: mục 4 đã được bổ sung tại `/nhan-vien/don/:id`. Sau khi lưu cân thực tế, trong **Kết quả cân đã lưu**, chọn ảnh dưới phiếu cân mới nhất rồi bấm **Tải ảnh phiếu #...**. Khi thành công, ảnh được hiển thị ngay; bấm ảnh để mở kích thước đầy đủ.

- Chỉ nhân viên đang phụ trách đơn ARRIVED có giao diện tải ảnh. Mỗi vật liệu chỉ bổ sung ảnh cho lần cân mới nhất; phiếu đã có ảnh hoặc đã được dùng trong bất kỳ báo giá nào, kể cả báo giá bị từ chối, được giữ nguyên. Có thể tạo lần cân điều chỉnh mới rồi bổ sung ảnh cho lần cân đó.
- Chấp nhận JPEG/PNG lớn hơn 0 và tối đa 5 MiB, hiển thị là 5 MB trên giao diện; mỗi chiều tối đa 8192 px và tổng tối đa 16 triệu điểm ảnh. Frontend kiểm tra loại/dung lượng; backend kiểm tra nội dung thật, kích thước và chuẩn hóa ảnh.
- Dùng POST multipart `/api/collector/orders/{id}/weighings/{weighingId}/photo` hiện có với đúng `version` và `file`, cookie phiên và CSRF. Không tự đặt Content-Type của multipart. Backend lưu tệp riêng tư và URL ảnh vào lần cân, tăng version đơn, ghi timeline.
- Upload và nhập cân dùng chung khóa thao tác để tránh gửi trùng trong cùng màn hình. Phản hồi phải khớp đơn/version/đường dẫn ảnh; cache không được lùi về version cũ nếu thao tác khác đã cập nhật đơn. Khi phiên đổi, không ghi dữ liệu riêng tư trở lại cache.
- Sau lỗi 404/409 hoặc kết quả chưa xác định vì mất kết nối/5xx, phải tải lại đủ đơn, lịch sử cân và báo giá trước khi tiếp tục. Không tự gửi lại ảnh. Nếu lần trước đã lưu, tải lại sẽ hiện ảnh đã có.
- Khách sở hữu đơn và admin xem ảnh qua các giao diện cân/hồ sơ hiện có; nhân viên khác và người chưa đăng nhập không đọc được ảnh. Các URL ảnh bên ngoài không được tải trong component minh chứng.
- Giữ màu xanh, Be Vietnam Pro và bố cục VCoi, dùng Taste Skill cho phần giữ nhận diện và các mẫu biểu mẫu hiện có cho màn hình nghiệp vụ; hỗ trợ sáng/tối, nhãn bàn phím và màn hình nhỏ. Backend Java, schema SQL và dependency giữ nguyên.

Lệnh kiểm tra trong `D:\VCOI\Frontend VCoi`:

```powershell
npm run check
npm run format:check
npm run test:weighing-photo
.\scripts\verify-live-weighing-photo.ps1
```

Kịch bản live dùng dữ liệu/ảnh tổng hợp riêng, backend 18080 và frontend 5174; dọn đúng dữ liệu theo marker và thư mục ảnh thử sau khi chạy. Các dịch vụ chính 8080/5173 được giữ nguyên. Tệp chính nằm trong `src/features/orders/`: `WeighingPhoto.jsx`, `weighing-photo-api.js`, `useWeighing.js`, `CollectorWeighing.jsx`, `WeighingHistory.jsx`; style trong `src/styles/weighing.css`.

Kết quả xác minh ngày 25/10: `npm run check` đạt 542/542 test trong 46 tệp, lint không lỗi/cảnh báo và build production thành công; `npm run format:check` đạt. Bộ tập trung tải ảnh/nhập cân đạt 38/38. Kiểm tra Chrome với fixture API đạt 11/11, gồm multipart, loại/dung lượng tệp, 401/403/404/409/500, đọc lại sau lỗi đã lưu, phiếu đã dùng trong báo giá, bàn phím, axe, sáng/tối và 320/768/1024/1440 px. Kiểm tra live Chrome + Spring Boot + SQL Server + thư mục ảnh riêng đạt 15/15: ảnh sai nội dung không đổi version, không ghi vào phiếu cũ/đã có ảnh/đã dùng trong báo giá, quyền đọc/tải ảnh, xem qua giao diện admin/khách và cân điều chỉnh mới giữ nguyên báo giá cũ. Dọn dữ liệu và ảnh thử đạt. Kết quả tại `Frontend VCoi/.cache/weighing-photo/result.json` và `Frontend VCoi/.cache/live-weighing-photo/result.json`. Không chạy collection qua Postman CLI; kiểm tra dùng hợp đồng OpenAPI/DTO hiện có và trình duyệt thực.

<a id="cap-nhat-ho-so-nhan-su"></a>
## Hồ sơ và đổi mật khẩu cho nhân viên/admin

Ngày 25/10/2026: mục 5 đã được bổ sung, kết nối API xác thực hiện có.

- Nhân viên: `/nhan-vien/tai-khoan`, mở qua **Tài khoản của tôi** trong thanh điều hướng.
- Admin: `/quan-tri/ho-so`, mở qua **Hồ sơ của tôi** trong menu quản trị. Trang `/quan-tri/tai-khoan` vẫn quản lý danh sách người dùng.
- Khách hàng giữ đường dẫn `/khach-hang/tai-khoan` và dùng chung biểu mẫu. Mỗi đường dẫn được bảo vệ theo vai trò; dữ liệu hồ sơ lấy từ người đang đăng nhập.
- Sửa họ tên/email qua PUT `/api/auth/profile`. Chỉ gửi hai trường này; số điện thoại đăng nhập chỉ xem, không gửi id/vai trò/trạng thái. Chuẩn hóa tên và email; phản hồi phải khớp id, vai trò, số điện thoại và nội dung đã gửi. Cập nhật tên trên phiên và bố cục ngay khi thành công.
- Đổi mật khẩu qua POST `/api/auth/password`, chỉ gửi mật khẩu hiện tại và mới. Nhập lại mật khẩu chỉ xác nhận ở frontend. Dùng quy tắc 12–64 ký tự và tối đa 72 byte UTF-8 cho mật khẩu mới, khác mật khẩu cũ, khớp xác nhận; không lưu vào localStorage/sessionStorage, URL, cache hoặc log. Các ô mật khẩu được xóa sau mỗi lần gửi.
- Khi đổi thành công (204), backend thu hồi phiên; frontend xóa dữ liệu riêng và chuyển về đăng nhập. Trường hợp kết quả chưa xác định thì khóa gửi lại, cho phép đăng nhập lại để kiểm tra; không tự phát lại thao tác. Hồ sơ 409/5xx chưa rõ kết quả phải đọc lại trước khi tiếp tục.
- Dùng chung mã tại `src/features/auth/account-api.js`, `useAuthenticatedAction.js` và `src/features/account/`. Khách hàng vẫn có adapter yêu cầu đúng vai trò CUSTOMER cho các thao tác đơn/địa chỉ; không nới quyền cho các API khách hàng.
- Giữ nhận diện VCoi theo Taste Skill, biểu mẫu theo các component hiện có; có sáng/tối, giao diện một cột trên điện thoại, nhãn trường và nút hiện/ẩn mật khẩu điều khiển được bằng bàn phím. Backend Java, database và dependency giữ nguyên.

Lệnh kiểm tra tại `D:\VCOI\Frontend VCoi`:

```powershell
npm run check
npm run format:check
npm run test:staff-account
npm run test:customer
.\scripts\verify-live-staff-account.ps1
```

Lượt live dùng tài khoản tổng hợp có marker riêng và hai phiên độc lập cho mỗi vai trò; không đổi mật khẩu tài khoản người dùng sẵn có. Server thử dùng 18080/5174, dọn tài khoản thử sau khi chạy. Tệp chính: `src/pages/AccountPage.jsx`, `src/features/account/ProfileForm.jsx`, `PasswordForm.jsx`, `src/features/auth/account-api.js`, `useAuthenticatedAction.js`, `src/styles/account.css`, `src/components/ServiceLayout.jsx`, `src/features/admin/AdminLayout.jsx` và `src/App.jsx`.

Xác minh ngày 25/10: `npm run check` đạt 566/566 test trong 48 tệp, lint không lỗi/cảnh báo và build production thành công; kiểm tra định dạng đạt. Bộ tập trung hồ sơ/mật khẩu/hồi quy địa chỉ đạt 32/32. Chrome dùng fixture hợp đồng OpenAPI/DTO đạt 17/17: lưu hồ sơ, đổi mật khẩu, chặn trường đặc quyền, lỗi 400/401/403/409/500, phân quyền trang, hiện/ẩn mật khẩu bằng bàn phím, axe, sáng/tối và 320/768/1024/1440 px. Kiểm tra live Chrome + Spring Boot + SQL Server đạt 25/25, gồm email trùng, hồ sơ lưu bền, từ chối mật khẩu cũ sai, giữ phiên sau lần đổi thất bại, thu hồi cả hai phiên sau lần đổi thành công và đăng nhập mới đúng vai trò cho cả ADMIN/COLLECTOR. Chrome hồi quy khách hàng đạt 27/27. Tài khoản thử được dọn thành công.

Đầu ra: `Frontend VCoi/.cache/staff-account/result.json`, `.cache/live-staff-account/result.json` và `.cache/customer-workspace/results.json`. Lượt live đầu dừng do email tổng hợp của nhân viên quá dài ở phần trước dấu @; đã sửa dữ liệu thử thành email ngắn theo hợp đồng rồi chạy lại thành công. Đây là các kiểm tra Chrome/API thật và fixture cục bộ, không phải chạy collection bằng Postman CLI.

<a id="demo-may-khac"></a>
## Bộ cài database và chạy demo trên máy khác

Mục 6, ngày 25/10/2026. Bản bàn giao: `dist/VCoi-demo.zip`, mã kiểm tra ở `dist/VCoi-demo.zip.sha256`. Giải nén sẽ có một thư mục `VCoi-demo` chứa README này, mã nguồn BE/FE, JAR backend, bản build frontend, script SQL và manifest SHA-256 cho từng tệp.

### Chuẩn bị máy Windows 64-bit

| Thành phần | Yêu cầu |
|---|---|
| SQL Server | SQL Server 2022, đã kiểm thử với compatibility level 160; bật TCP/IP và biết cổng thực tế của instance |
| Công cụ SQL | SSMS để xem dữ liệu; `sqlcmd` bản ODBC có trong PATH để chạy bộ cài PowerShell |
| Java | JDK 21 trở lên, 64-bit; `java -version` chạy được. Dự án biên dịch đích Java 21 |
| Node.js/npm | Theo package.json: Node `^22.13.0` hoặc `>=24.0.0`, npm >=10; dùng `npm.cmd` trong PowerShell Windows |
| PowerShell | Windows PowerShell 5.1 64-bit hoặc PowerShell 7 cho cài/chạy demo; bộ kiểm tra tự động ZIP cần PowerShell 7 |
| Internet lần đầu | `npm ci` cài dependency theo package-lock; script Windows tải thư viện xác thực JDBC và đối chiếu SHA-256. Không cần cài Maven riêng nếu chạy JAR |

Không lấy cổng 1435 trên máy phát triển làm mặc định cho máy mới. Ví dụ bên dưới dùng `localhost,1433`; thay đồng thời thông số SQL và `DB_PORT` nếu instance dùng cổng khác. Có thể kiểm tra TCP/IP/cổng tại SQL Server Configuration Manager; các instance trên cùng máy cần cổng riêng. Giữ URL website là `http://127.0.0.1:5173` khi demo.

### 1. Tạo database mới và nạp dữ liệu mẫu

Mở PowerShell tại thư mục `VCoi-demo` vừa giải nén. Tài khoản Windows chạy bước này cần quyền tạo database; backend Windows sau đó chạy bằng cùng tài khoản.

```powershell
.\ecothugom-backend\scripts\initialize-demo-db.ps1 -ServerInstance "localhost,1433" -DatabaseName "EcoThuGomDemo" -TrustServerCertificate
```

Lệnh tạo database riêng rồi chạy lần lượt:

| Tệp trong ecothugom-backend/scripts/sql | Nội dung                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `00-create-database.sql`                | Tạo database với tên được cung cấp, collation SQL_Latin1_General_CP1_CI_AS và compatibility 160; dừng nếu đã tồn tại                       |
| `01-schema.sql`                         | Đủ 14 bảng, 159 cột, identity/default, 3 cột tính toán PERSISTED, 42 CHECK, 32 FK và 48 index gồm PK/UNIQUE, index lọc và index có INCLUDE |
| `02-pickup-location.sql`                | Migration bổ sung tọa độ chụp tại thời điểm đặt lịch cho database đã có schema nền                                                         |
| `seed-sample-data.sql`                  | Dữ liệu tổng hợp: 5 tài khoản lịch sử, vật liệu/bảng giá và 8 đơn DEMO với báo giá, cân, thanh toán, yêu cầu và khiếu nại                  |

Tên database chỉ chứa chữ, số, dấu gạch dưới, bắt đầu bằng chữ, tối đa 64 ký tự. Bộ cài dừng khi gặp lỗi, không xóa/ghi đè database có sẵn. Nếu tạo dở bị lỗi, giữ database để xem lỗi và dùng tên mới cho lần thử; script không tự DROP. Seed có thể chạy lại mà không thêm trùng bộ dữ liệu nguyên bản; đây không phải thao tác reset sau khi đã sửa các đơn DEMO.

Sau khi tạo schema và seed, bộ cài đối chiếu fingerprint schema cùng các dấu phiên bản, rồi kiểm tra bảng chính, 5 tài khoản và 8 đơn DEMO trước khi báo `VCoi demo database ready`. Mở SSMS, kết nối đúng instance rồi Refresh Databases để thấy EcoThuGomDemo.

Nếu chạy từng tệp bằng sqlcmd, luôn dùng `-b -f 65001` để dừng khi lỗi và giữ tiếng Việt. Với các tệp có `$(DatabaseName)`, cung cấp `-v DatabaseName=EcoThuGomDemo`. Trong SSMS, bật **Query → SQLCMD Mode**, khai báo `:setvar DatabaseName "EcoThuGomDemo"` trước khi chạy. Xem [tài liệu biến SQLCMD của Microsoft](https://github.com/microsoftdocs/sql-docs/blob/live/docs/tools/sqlcmd/sqlcmd-use-scripting-variables.md).

Nếu dùng SQL Server Authentication, bộ cài nhận `-Credential (Get-Credential)` thay cho Windows Authentication; login đó phải có quyền tạo database. Mật khẩu được truyền cho sqlcmd qua môi trường tiến trình, không có trong dòng lệnh/script. Backend khi đó dùng profile `sqlserver` và các biến `DB_USERNAME`/`DB_PASSWORD` từ môi trường. Hướng dẫn chính ở đây dùng Windows Authentication.

### 2. Chạy backend và tạo admin riêng

Mở một PowerShell 64-bit trong `VCoi-demo/ecothugom-backend`:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "1433"
$env:DB_NAME = "EcoThuGomDemo"
$env:SPRING_PROFILES_ACTIVE = "windows"
$env:SERVER_PORT = "8080"
$env:SERVER_ADDRESS = "127.0.0.1"
.\scripts\create-initial-admin.ps1 -UsePackagedJar
```

Nhập họ tên, số điện thoại Việt Nam hợp lệ (đầu 03/05/07/08/09), email tùy chọn và mật khẩu riêng theo lời nhắc. Mật khẩu nhập ẩn, không ghi vào README hoặc file cấu hình. Để cửa sổ này chạy trong suốt buổi demo. Backend dùng JAR sẵn trong `runtime/ecothugom-backend.jar`; không cần Maven để chạy bước này. Lần đầu script chuẩn bị DLL Windows Authentication có checksum cố định.

Các tài khoản mang tên **DEMO** trong seed dùng hash của một giá trị ngẫu nhiên đã bỏ, số điện thoại 000..., **không có mật khẩu đăng nhập được công bố**. Chúng phục vụ dữ liệu lịch sử. Admin mới tạo ở bước trên là tài khoản đăng nhập thật của buổi demo; tạo nhân viên qua **Quản trị → Tài khoản → Tạo nhân viên** và khách qua **Đăng ký** trên website.

Những lần sau, mở PowerShell với cùng cấu hình DB ở trên rồi chạy `.\scripts\start-local.ps1 -UsePackagedJar`. Nếu chạy từ mã nguồn thay vì gói ZIP, bỏ `-UsePackagedJar` để Maven Wrapper build/chạy. Lần đầu dùng mã nguồn cần Internet tải Maven/dependency.

Kiểm tra `http://127.0.0.1:8080/api/prices/current` trả JSON. Backend luôn `ddl-auto=validate`; không tự tạo hoặc sửa schema.

### 3. Chạy frontend

Mở terminal khác tại `VCoi-demo/Frontend VCoi`:

```powershell
npm.cmd ci --include=dev
npm.cmd run preview -- --port 5173
```

Mở `http://127.0.0.1:5173`. Gói có sẵn `dist`; Vite preview dùng proxy API tới 8080. Nếu backend chạy cổng khác, đặt `$env:BACKEND_PROXY_TARGET="http://127.0.0.1:cong_backend"` trước khi chạy. Người cần sửa giao diện dùng `npm.cmd run dev`; build lại bằng `npm.cmd run build`. Không chép node_modules từ máy phát triển, không dùng npm install để thay lockfile khi dựng bản demo.

### 4. Kịch bản thuyết trình

1. Đăng nhập admin, xem 8 đơn DEMO, danh mục/vật liệu, phiên bản bảng giá, thống kê và hồ sơ thu mua.
2. Admin tạo một nhân viên có số điện thoại/mật khẩu hợp lệ. Khách đăng ký tài khoản riêng, xem bảng giá và đặt một lịch mới trong tương lai.
3. Admin xác nhận lịch mới và giao cho nhân viên vừa tạo; có thể minh họa phân công lại khi còn ASSIGNED.
4. Nhân viên khởi hành → đến nơi → lưu cân thực tế → bổ sung ảnh phiếu cân **trước khi gửi báo giá**.
5. Nhân viên xem/gửi báo giá; khách chấp thuận hoặc từ chối. Nếu cân lại, tạo bản điều chỉnh để giữ lịch sử.
6. Sau khi khách chấp thuận, nhân viên ghi nhận thanh toán mô phỏng → COMPLETED; khách/admin xem biên nhận, timeline và thống kê.
7. Minh họa hồ sơ, đổi mật khẩu; đổi thành công yêu cầu đăng nhập lại. Yêu cầu hủy của khách cần admin xử lý.

Mỗi vai trò dùng một hồ sơ trình duyệt hoặc một trình duyệt riêng; nhiều tab trong cùng hồ sơ dùng chung phiên đăng nhập. Dữ liệu DEMO được neo tại thời điểm seed, nên khi demo vào ngày khác hãy tạo đơn mới để thao tác thay vì sửa trạng thái bằng SQL. Kiểm tra 21 điều kiện mẫu chỉ dành cho bộ DEMO chưa bị thao tác sửa.

Ảnh người dùng tải lên lưu trong `ecothugom-backend/.local/evidence`, truy cập qua API có kiểm tra quyền. Gói ZIP không chứa ảnh/dữ liệu/tài khoản riêng của máy phát triển. Khi chuyển dữ liệu đang sử dụng, sao lưu database cùng thư mục evidence riêng; bộ cài này cung cấp schema và dữ liệu tổng hợp.

### 5. Đóng gói lại và tự kiểm tra

Sau khi sửa mã nguồn, build backend bằng `.\mvnw.cmd -B -ntp package` và frontend bằng `npm.cmd ci --include=dev` rồi `npm.cmd run build`. Tại backend:

```powershell
.\scripts\package-demo.ps1 -Force
Get-FileHash ..\dist\VCoi-demo.zip -Algorithm SHA256
```

Đối chiếu hash với file `.zip.sha256`. Manifest bên trong liệt kê SHA-256 từng tệp. Bộ đóng gói chọn rõ các thư mục mã nguồn/build, không thu gom .local, .cache, .env thật, node_modules, database backup, log hoặc DLL chứa trên máy.

Các script kiểm tra gói demo đã được đưa vào kho lưu trữ kiểm thử bên ngoài dự án. Để chạy lại chúng, khôi phục trước các tệp tương ứng từ `D:\Vcoi1\EcoThuGom-Test-Archive-20261026`.

### Kết quả kiểm tra bộ bàn giao ngày 25/10/2026

- Bản gói mục 6 trước cập nhật mục 7: giải nén riêng, đối chiếu manifest 552 tệp; cài dependency bằng npm ci và build frontend thành công tại bản giải nén. Sau mục 7, gói được đóng lại với frontend và README mới; manifest trong ZIP là danh sách tệp hiện tại.
- Tạo database SQL Server mới từ bộ script, đối chiếu đúng fingerprint schema và qua đủ 21 kiểm tra dữ liệu mẫu. Nạp seed lần hai vẫn đạt; cài trùng tên database bị chặn. Bản kiểm tra với fingerprint cố ý sai cũng bị từ chối.
- JAR đóng gói khởi động, tự tạo admin riêng và chạy qua 9 kiểm tra ứng dụng: đăng nhập, đọc dữ liệu mẫu/bảng giá, tạo khách/nhân viên, đặt lịch, xác nhận/phân công, khởi hành/đến nơi, cân thực tế, duyệt báo giá, thanh toán mô phỏng và biên nhận. Frontend mở được các trang hồ sơ admin/nhân viên và biên nhận khách, không phát sinh lỗi JavaScript chưa xử lý.
- Chạy tại thư mục giải nén và database tách biệt **trên máy phát triển**, chưa thử trên một máy vật lý thứ hai. Các database thử do lượt kiểm tra tạo đã được dọn; database EcoThuGomDB hiện có được giữ nguyên.

### Xử lý các lỗi thường gặp

- Không kết nối SQL/Instance failure: kiểm tra dịch vụ đúng instance, bật TCP/IP và điền đúng cổng thực tế trong cả bộ cài và biến DB_PORT. Không tự đổi cổng các instance khác đang chạy.
- Login failed/quyền: Windows Authentication dùng tài khoản đang chạy terminal/Java; tài khoản đó cần quyền trên database đã tạo. SQL Authentication dùng profile/biến tương ứng, không ghi mật khẩu vào source.
- Lỗi chứng chỉ ở SQL local: bộ cài dùng `-TrustServerCertificate`; profile windows dùng TLS với trustServerCertificate cho demo cục bộ.
- Port 8080/5173 bận: dùng cổng còn trống và cập nhật proxy; không tắt ứng dụng khác chỉ để giải phóng cổng.
- Trình duyệt 401 sau restart/đổi mật khẩu: đăng nhập lại; dùng nhất quán 127.0.0.1 cho frontend.
- Schema verify thất bại: dừng, kiểm tra đang chọn đúng database và bộ script cùng phiên bản. Không đổi ddl-auto thành update/create để bỏ qua lỗi.
- PowerShell chặn script vừa giải nén: nếu máy cho phép, dùng `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` cho cửa sổ hiện tại và Unblock-File cho các script của bộ bàn giao đã kiểm tra. Chính sách của cơ quan/trường vẫn có thể yêu cầu quản trị máy hỗ trợ.

<a id="cap-nhat-trai-nghiem-dieu-huong"></a>
## Cảnh báo biểu mẫu và giữ vị trí danh sách

Mục 7, ngày 25/10/2026. Giao diện giữ bảng màu, font và các thành phần VCoi hiện có, theo Taste Skill ở phần bảo toàn thiết kế và các quy tắc frontend của dự án.

- Khi đã thay đổi dữ liệu, điều hướng bằng liên kết hoặc nút Back/Forward sẽ mở hộp **Bạn có thay đổi chưa lưu**. **Tiếp tục chỉnh sửa** hoặc Escape giữ nguyên nội dung và vị trí; **Rời đi** tiếp tục đúng thao tác đã chọn. Hộp thoại có focus mặc định ở nút tiếp tục, giữ bàn phím trong hộp và hỗ trợ sáng/tối, màn hình nhỏ.
- Cảnh báo áp dụng cho đặt lịch, đăng ký/đăng nhập, hồ sơ/mật khẩu, địa chỉ, hủy/đổi lịch, ghi chú phản hồi báo giá, khiếu nại, nhập cân, ảnh chưa tải lên, ghi chú di chuyển/phân công, phương thức thanh toán đã đổi, danh mục/vật liệu, giá nháp, tạo nhân viên, kết luận xử lý của admin và kỳ thống kê chưa áp dụng. Các nút đóng hoặc tải lại làm mất dữ liệu cũng được bảo vệ; xác nhận đăng xuất thực hiện trước khi kết thúc phiên.
- Biểu mẫu chưa sửa không hỏi lại. Lưu/gửi thành công, áp dụng kỳ thống kê hoặc hoàn nguyên về dữ liệu gốc sẽ không bị chặn nhầm. Khi lưu thất bại mà dữ liệu còn trong biểu mẫu, cảnh báo vẫn hoạt động. Trường mật khẩu được xóa theo quy tắc bảo mật sẵn có khi gửi thất bại.
- Tải lại/đóng tab hoặc rời website dùng cảnh báo mặc định của trình duyệt; trình duyệt quyết định cách hiển thị. Cảnh báo không đồng nghĩa tự lưu. Chỉ trang đặt lịch tiếp tục giữ bản nháp trong bộ nhớ phiên như chức năng trước đó; không lưu mật khẩu, ảnh hay nội dung biểu mẫu vào localStorage/sessionStorage.
- Danh sách đơn khách/nhân viên/admin, danh mục, vật liệu, giá, tài khoản, yêu cầu hủy/đổi lịch, khiếu nại, thống kê và bảng giá công khai giữ bộ lọc/số trang trong URL. Quay lại qua menu/liên kết danh sách sẽ khôi phục vị trí gần nhất trong phiên; Back/Forward và tải lại tôn trọng URL. Danh sách đơn admin truyền đường quay về cho trang chi tiết, gồm cả trạng thái và trang.
- Đổi bộ lọc có chủ ý vẫn về trang đầu; xóa lọc hoặc chọn **Tất cả đơn** không tự khôi phục bộ lọc cũ. Mỗi danh sách và tài khoản/vai trò có bộ nhớ riêng. Sửa hồ sơ cùng tài khoản giữ vị trí danh sách, còn đăng xuất, hết phiên hoặc đổi tài khoản xóa bộ nhớ riêng tư.

Mã chính ở `Frontend VCoi/src/features/navigation/`, `src/styles/navigation.css` và `src/main.jsx`. Router dùng createBrowserRouter/RouterProvider để chặn được cả lịch sử trình duyệt bằng useBlocker; các đường dẫn và phân quyền hiện có được giữ nguyên. Biểu mẫu mới dùng `useUnsavedChanges(isDirty, label)`; gọi `clear()` khi chắc chắn gửi thành công trước điều hướng và `confirmDiscard(action)` cho thao tác bỏ dữ liệu. Danh sách mới dùng `useListSearchParams()` thay useSearchParams để có cơ chế khôi phục và xóa lọc nhất quán. Backend, API và schema SQL không thay đổi trong mục này.

Kiểm tra tại thư mục frontend:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run format:check
npm.cmd run test:navigation
```

Chrome chạy với fixture cục bộ: **23/23 kiểm tra đạt**, gồm cảnh báo thực tế trước reload, Back/Forward, hủy đăng xuất, đóng/tải lại biểu mẫu, gửi lỗi/thành công, ảnh còn chờ tải, giữ bộ lọc/trang cho ba vai trò và bảng giá công khai. Hộp thoại qua axe ở sáng/tối, desktop 1440 px và mobile 390 px, không có lỗi JavaScript chưa xử lý. Kết quả tại `Frontend VCoi/.cache/workspace-navigation/result.json`; ảnh đối chiếu `unsaved-light.png` và `unsaved-dark.png` cùng thư mục. Đây là kiểm tra trình duyệt với API giả lập theo hợp đồng; không phải lượt ghi dữ liệu mới lên SQL Server thật. Kiểm tra hồi quy còn xác nhận việc vô hiệu hóa cơ chế chặn trong một bản sao riêng làm các ca chống mất dữ liệu thất bại như mong đợi.

Kiểm tra toàn bộ frontend sau thay đổi cuối: **578/578 test trong 51 tệp đạt**; lint không lỗi/cảnh báo, build production và kiểm tra định dạng đều đạt. Các ca mới kiểm tra cả tình huống gửi thành công/thất bại, Back, đóng hộp bằng Escape, hoàn nguyên, giữ vị trí sau cập nhật hồ sơ và ngăn lấy bộ lọc của tài khoản cũ. Gói `dist/VCoi-demo.zip` và SHA-256 được tạo lại từ mã/build đã kiểm tra. Không thêm dependency.

<a id="ra-soat-sau-muc-7"></a>
## Rà soát tổng thể sau mục 7

Ngày 25/10/2026. Phạm vi: frontend React, các controller/service và phân quyền Spring Boot, giao dịch SQL, hợp đồng API, bộ kiểm thử và các luồng của ba vai trò. Bằng chứng bên dưới ghi nhận thời điểm rà soát ban đầu. Cập nhật đến 26/10/2026: R1, R2 và R3 đã sửa; kết quả mới ghi ở từng mục riêng. Giữ hướng dẫn và kết quả trong README chung.

### Lỗi đã tái hiện

| Mã | Ưu tiên | Phát hiện | Hướng sửa |
|---|---|---|---|
| R1 | P1, đã sửa | Khóa tài khoản đồng thời với đổi mật khẩu/sửa hồ sơ từng ghi đè dữ liệu vừa lưu. | changeStatus đã dùng khóa hàng như sửa hồ sơ/đổi mật khẩu. Bốn ca hồi quy đạt trên SQL Server; xem [kết quả sửa R1](#sua-loi-dong-thoi-tai-khoan). |
| R2 | P2, đã sửa | Nút Quay lại khiếu nại từng bỏ qua cảnh báo chưa lưu và làm mất kết luận nhập dở. | Nhánh quay lại đã qua confirmDiscard; Sửa kết luận giữ nguyên nội dung. Xem [kết quả sửa R2](#sua-r2-ket-luan-khieu-nai). |
| R3 | P2, đã sửa | Fixture bảng giá từng thiếu draftRevision và assertion ghi chưa kiểm tra expectedRevision. | Fixture đã trả token theo snapshot, từ chối token cũ và trả revision mới sau thay đổi. test:prices đạt 24 kiểm tra Chrome; xem [kết quả sửa R3](#sua-r3-fixture-bang-gia). |

**R1, bằng chứng trước khi sửa và nguyên nhân.** Trước bản sửa, `ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java:119` đọc tài khoản bằng findById qua require, trong khi updateProfile/changePassword dùng findForUpdate. `UserAccount` không có optimistic version hoặc cập nhật riêng trường trạng thái. Hibernate phát UPDATE gồm cả password_hash, full_name, email và các trường khác. Trình tự tái hiện: transaction A đọc tài khoản để khóa, tạm dừng sau đọc; transaction B đổi mật khẩu hoặc hồ sơ và commit; A tiếp tục commit snapshot cũ. Với SQL Server, phép kiểm tra BCrypt cho thấy hash cũ được khôi phục, hash mới không còn khớp; phép thử hồ sơ cho thấy tên mới quay về tên trước đó. Đây là hai phép thử mới thất bại đúng ở điều kiện bảo toàn dữ liệu, không phải lỗi khởi động hay dữ liệu mẫu. Phép thử gọi service Spring thật và điều khiển thời điểm đọc qua EntityManager.find tương đương findById; không phải thử hai cửa sổ trình duyệt. Nhật ký và mã tái hiện ở `ecothugom-backend/.local/audit-final/`, gồm `AuditConcurrencyProbeTests.java`, `sql-concurrency-probe.log` và `sql-concurrency-result.json`.

**R2, bằng chứng trước khi sửa và nguyên nhân.** `Frontend VCoi/src/features/admin/DisputeDecisionForm.jsx:105` từng gọi trực tiếp onBack ở nhánh chưa xác nhận. Trong Chrome: mở khiếu nại, chọn Giải quyết khiếu nại, nhập kết luận, bấm Quay lại khiếu nại rồi mở Giải quyết lại. Không có alertdialog, nội dung thành rỗng và số request ghi vẫn bằng 0. Phần cảnh báo mục 7 còn sót nhánh này. Kết quả ở `Frontend VCoi/.cache/audit-final/ui-probes.json`; ảnh `dispute-draft-lost.png` cùng thư mục.

**R3, bằng chứng trước khi sửa và nguyên nhân.** `Frontend VCoi/scripts/fixtures/admin-prices.mjs:6` từng tạo hàng giá không có draftRevision, trong khi `src/features/admin/prices-model.js:22` bắt buộc chuỗi SHA-256 này. `npm.cmd run test:prices` timeout ở bảng phiên bản; kiểm tra Chrome riêng cho thấy trang nhận fixture báo Dữ liệu hệ thống chưa hợp lệ. Các assertion ghi trong script cũng cần đồng bộ expectedRevision. Phát hiện này áp dụng cho bộ test giả lập; không chứng minh API bảng giá thật bị hỏng. Tại thời điểm đó, bộ điều hướng gán revision riêng cho dữ liệu bảng giá nên vẫn xanh. Nhật ký tại `Frontend VCoi/.cache/audit-final/browser-prices.log`.

### Chức năng và quy tắc nên bổ sung

| Thứ tự | Phần việc | Tình trạng hiện tại và phạm vi đề xuất |
|---|---|---|
| 4 | Admin chủ động từ chối/hủy đơn không thể phục vụ | Admin hiện xác nhận, phân công và xử lý yêu cầu hủy/đổi lịch do khách gửi. Chưa có thao tác từ chối tiếp nhận đơn PENDING độc lập khi ngoài phạm vi hoặc không bố trí được lịch. Nên bổ sung quyền admin, lý do bắt buộc và timeline cho khách; giữ nguyên quy tắc khách hủy phải qua admin. |
| 5 | Loại riêng vật liệu không thu mua trong một đơn | QuotationService yêu cầu mọi mặt hàng đều có cân thực nhận dương và giá hiện hành. Chưa có trạng thái/lý do từ chối cho từng mặt hàng hoặc cách loại một mặt hàng khỏi báo giá mà vẫn giữ lịch sử. Cần chốt cách xử lý khi giấy ướt, sai loại hoặc chỉ một phần đơn được nhận trước khi thêm API/UI. |
| 6 | Thông tin vận hành đại lý trên website | Chưa có thông tin liên hệ/phạm vi/giờ phục vụ rõ ràng và cấu hình tương ứng. PickupWindow hiện kiểm tra tương lai, thứ tự thời gian và phạm vi năm; không áp dụng giờ làm việc hoặc địa bàn. Nên chốt nội dung và điều kiện demo, rồi hiển thị ở trang giới thiệu/đặt lịch. |

Các nhóm chức năng chính đã có ở cả BE/FE: đăng ký/đăng nhập/phân quyền; danh mục/vật liệu; phiên bản giá; hồ sơ/mật khẩu/địa chỉ; đặt lịch; xác nhận/phân công/phân công lại trước khởi hành; khởi hành/đến nơi; cân/ảnh; báo giá/khách duyệt; thanh toán mô phỏng; lịch sử/biên nhận; hủy/đổi lịch; khiếu nại và thống kê. Không cần thêm một hệ thống thương mại điện tử khác để hoàn thành các luồng này.

Tại thời điểm rà soát 25/10, quên mật khẩu/khôi phục tài khoản, thông báo trạng thái và xuất thống kê CSV được xem là mở rộng. Ngày 26/10 đã bổ sung xuất CSV và XLSX; khôi phục mật khẩu và thông báo vẫn tùy thời gian hoặc tiêu chí chấm, không xếp cùng lỗi R1–R3.

### Kiểm tra thực tế của lượt rà soát

| Kiểm tra | Kết quả |
|---|---|
| Backend: mvnw.cmd -B -ntp -o test | 212 test hiện có đạt, 0 lỗi/thất bại |
| Frontend: npm.cmd run check | 578 test / 51 tệp đạt; lint và build production đạt |
| Frontend: npm.cmd run test:navigation | 23 kiểm tra Chrome dùng fixture đạt |
| Frontend: npm.cmd run test:prices | Thất bại do R3; không gộp vào kết quả xanh phía trên |
| Hai phép thử đồng thời mới | Tái hiện R1 trên H2 và SQL Server; 2 assertion bảo toàn dữ liệu thất bại |
| Probe Chrome khiếu nại | Tái hiện R2, chưa gửi request ghi nào |
| npm.cmd audit --omit=dev --json | npm báo 0 cảnh báo cho dependency production frontend tại thời điểm rà soát; không phải kết quả quét dependency backend |

Bộ test hiện có xanh không bao phủ các trường hợp xen kẽ và nhánh quay lại vừa phát hiện. Bằng chứng được giữ ở thư mục .local/.cache, không đưa vào mã nguồn/build. Database SQL Server thử có tên và marker riêng đã được dọn; source/class probe tạm không còn trong src/test hoặc target/test-classes. Website và backend chính tiếp tục chạy; tài khoản, mật khẩu và dữ liệu người dùng thật không bị thao tác thử. Postman CLI chưa có trên máy; các kiểm tra dùng bộ test API hiện hữu, hợp đồng cục bộ và các phép tái hiện nêu rõ ở trên.

R1–R3 đã được xử lý. Các phần đề xuất tiếp theo là chốt hai tình huống nghiệp vụ 4–5 và thông tin vận hành 6. Khi sửa các phần tiếp theo, chạy lại bộ trình duyệt liên quan và bộ test đầy đủ rồi đóng gói bản demo mới.

<a id="sua-loi-dong-thoi-tai-khoan"></a>
## Sửa R1: khóa tài khoản không ghi đè hồ sơ hoặc mật khẩu

Ngày 25/10/2026. `AccountService.changeStatus` đọc tài khoản bằng `findForUpdate` trong cùng giao dịch cập nhật trạng thái. Khóa hàng được giữ đến khi commit, giống `updateProfile` và `changePassword`. Các thao tác ghi cùng tài khoản được tuần tự hóa, tránh lưu lại bản dữ liệu cũ sau khi thao tác khác đã lưu mật khẩu hoặc hồ sơ mới. Quyền quản trị, quy tắc không khóa admin và hợp đồng HTTP giữ nguyên; không cần chạy migration SQL hoặc thay đổi frontend.

Thêm `ecothugom-backend/src/test/java/com/ecothugom/auth/AccountStatusConcurrencyTests.java` với bốn ca: khóa đồng thời với đổi mật khẩu, và khóa đồng thời với sửa hồ sơ, cho cả CUSTOMER và COLLECTOR. Kiểm thử gọi service và repository thật trong hai luồng; chỉ chèn điểm chờ sau đọc để điều khiển thứ tự giao dịch. Assertion xác nhận trạng thái vẫn LOCKED, hồ sơ mới còn nguyên, hash mới còn khớp; mở khóa xong đăng nhập bằng mật khẩu mới thành công và mật khẩu cũ bị từ chối.

| Kiểm tra bản sửa | Kết quả thực tế |
|---|---|
| Bốn ca hồi quy trên mã trước sửa | 4 thất bại đúng ở dữ liệu bị ghi đè, 0 lỗi khởi chạy |
| Hồi quy đồng thời + đăng nhập/phân quyền/hồ sơ/đổi mật khẩu/khởi tạo tài khoản | 23 test đạt |
| Bốn ca trên SQL Server 2022, phiên bản 16.0.1000.6, localhost:1435 | 4 test đạt; kiểm tra SQL sau giao dịch xác nhận hồ sơ, vai trò và trạng thái cuối đúng |
| Toàn bộ backend: mvnw.cmd -B -ntp -o package | 216 test đạt, 0 thất bại/lỗi/bỏ qua; JAR build thành công |

SQL được thử trong database riêng `VCoi_StatusRace_8c226d01663d4690840a4556f1bae84a`; database này đã được dọn sau kiểm thử. Không đổi mật khẩu/hồ sơ/trạng thái của tài khoản trong EcoThuGomDB để thử lỗi. Bằng chứng tại `ecothugom-backend/.local/account-status-fix/` và `ecothugom-backend/.local/account-status-sql/8c226d01663d4690840a4556f1bae84a/`; các thư mục nhật ký không được đưa vào ZIP demo.

Backend chính ở cổng 8080 đã khởi động lại bằng JAR vừa build, tiếp tục kết nối EcoThuGomDB trên localhost:1435 và dùng thư mục ảnh minh chứng hiện có. Phiên đăng nhập cũ kết thúc sau lần khởi động lại này; đăng nhập lại để tiếp tục dùng website. Bản sửa R1 này không bao gồm R2/R3; tiến độ R2 ghi ở mục riêng bên dưới.

Chạy lại từ thư mục backend; thay host/cổng theo máy mới. Lệnh SQL cần PowerShell 7, sqlcmd, JDK/Maven và quyền Windows tạo/xóa database thử. Script chỉ xóa database thử có tên ngẫu nhiên và marker schema của VCoi:

```powershell
.\mvnw.cmd -B -ntp -o -Dtest=AccountStatusConcurrencyTests test
pwsh -File .\scripts\verify-account-status-concurrency.ps1 -DbHost localhost -DbPort 1435
.\mvnw.cmd -B -ntp -o package
```

Nếu cache Maven trên máy mới chưa đầy đủ, bỏ `-o` ở lệnh Maven; script SQL hiện dùng chế độ offline nên cần tải dependency bằng lệnh Maven trước. Mỗi lượt kiểm tra SQL tạo `result.json`, `maven.log`, `test-results.txt` và `database-check.log` dưới `.local/account-status-sql/<mã lượt chạy>/`; kết quả thành công có `Result=PASS` và `DatabaseRemoved=true`.

<a id="sua-r2-ket-luan-khieu-nai"></a>
## Sửa R2: cảnh báo trước khi bỏ kết luận khiếu nại chưa lưu

Ngày 26/10/2026. Ở cả hai nhánh **Giải quyết khiếu nại** và **Từ chối khiếu nại**, nút **Quay lại khiếu nại** đã dùng `protection.confirmDiscard(onBack)` thay vì đóng biểu mẫu trực tiếp. Hộp **Bạn có thay đổi chưa lưu** dùng component, màu xanh, font, nút và chế độ sáng/tối hiện có của VCoi theo hướng giữ giao diện của Taste Skill; không thêm dependency hoặc CSS mới.

- **Tiếp tục chỉnh sửa** hoặc Escape giữ biểu mẫu cùng toàn bộ nội dung vừa nhập. Chỉ **Rời đi** mới đóng và bỏ bản nháp; mở lại sau khi chủ động bỏ thì kết luận rỗng.
- **Sửa kết luận** từ bước xem lại quay về nhập, giữ nguyên nội dung và không hỏi bỏ dữ liệu. Biểu mẫu chưa nhập hoặc đã xóa về giá trị ban đầu được quay lại ngay; nhánh tiếp nhận không cần kết luận vẫn hoạt động như trước.
- Các thao tác quay lại, tiếp tục hoặc bỏ bản nháp không gửi quyết định xử lý. Luồng lưu kết luận vẫn cần xác nhận riêng. Không tự lưu kết luận vào browser storage; backend, SQL và hợp đồng API không đổi.

`AdminDisputesPage.test.jsx` đã kiểm tra qua router và `UnsavedChangesProvider` thật thay vì bỏ qua cơ chế bảo vệ. Bổ sung 9 ca hồi quy; trước sửa, hai ca có nội dung chưa gửi thất bại đúng vì không có cảnh báo. Sau sửa, **24/24 kiểm thử tập trung** cho trang khiếu nại và cơ chế cảnh báo chung đạt.

`npm.cmd run test:disputes`: **23/23 kiểm tra Chrome đạt**, gồm hai nhánh quay lại, tiếp tục/Escape, bỏ có xác nhận, sửa từ bước xem lại, hoàn nguyên, không phát sinh request ghi khi bỏ bản nháp, cùng các luồng tiếp nhận/giải quyết/từ chối và lỗi trước đó. Kiểm tra ở 320/768/1024/1440 px, sáng/tối; các ảnh chụp hộp thoại ở 320/1440 px qua axe, không có lỗi JavaScript chưa xử lý. Script cũng xác nhận rõ **Rời đi** khi chủ động tải lại một quyết định chưa gửi để kiểm tra đọc lại sau lỗi, thay vì bỏ qua cảnh báo mục 7.

Hồi quy tại thời điểm sửa R2: `npm.cmd run check` đạt **587/587 test trong 51 tệp**, lint không lỗi/cảnh báo và build production thành công; `npm.cmd run format:check` đạt. `npm.cmd run test:navigation` đạt **23/23 kiểm tra Chrome**. Các số này chưa bao gồm bộ `test:prices`; kết quả sau sửa fixture ghi tại mục R3 bên dưới. Frontend dev nhận bản sửa qua Vite; backend không khởi động lại trong phần R2. Gói demo tại thời điểm đó được tạo lại từ bản build này cùng backend đã sửa R1.

Bằng chứng: nhật ký trong `Frontend VCoi/.cache/r2-dispute-draft/`; kết quả Chrome tại `Frontend VCoi/.cache/admin-disputes/results.json`, ảnh `unsaved-320-light.png`, `unsaved-320-dark.png`, `unsaved-1440-light.png`, `unsaved-1440-dark.png` cùng thư mục. Đây là kiểm tra UI với dữ liệu HTTP giả lập trong trình duyệt riêng; không gửi kết luận thử lên dữ liệu SQL Server đang dùng.

Chạy lại trong thư mục frontend, giữ website dev đang chạy ở cổng 5173 cho các lệnh Chrome:

```powershell
npm.cmd test -- src/pages/AdminDisputesPage.test.jsx src/features/navigation/UnsavedChanges.test.jsx
npm.cmd run test:disputes
npm.cmd run test:navigation
npm.cmd run check
npm.cmd run format:check
```

<a id="sua-r3-fixture-bang-gia"></a>
## Sửa R3: fixture bảng giá theo hợp đồng revision hiện tại

Ngày 26/10/2026. Phạm vi thay đổi: fixture và kịch bản kiểm thử frontend; API, logic ứng dụng, schema SQL và cấu hình đang chạy giữ nguyên. Đối chiếu nguồn chuẩn `ecothugom-backend/docs/admin-prices-openapi.json`, `AdminPriceRequests`/`AdminPriceService` và `src/features/admin/prices-api.js` trước khi sửa.

- `scripts/fixtures/admin-prices.mjs` trả `draftRevision` dạng 64 ký tự hex thường cho dữ liệu ban đầu, chi tiết, danh sách, lịch sử và bản nháp vừa tạo. Token được tính từ snapshot của dòng trong fixture; đổi số tiền, hiệu lực hoặc trạng thái sẽ đổi token, cùng snapshot giữ token ổn định. Đây là token mô phỏng, không cam kết trùng từng byte với thuật toán hash Java; client chỉ sao chép token nhận được.
- Sửa/duyệt/từ chối bắt buộc `expectedRevision`: thiếu hoặc sai định dạng trả 400, token cũ hoặc phiên bản đã chốt trả 409 và không thay đổi dòng. Tạo mới không yêu cầu token. Fixture chỉ ghi các trường nghiệp vụ được phép; `expectedRevision` không bị chép vào dữ liệu phản hồi.
- `scripts/verify-admin-prices.mjs` kiểm tra chính xác body PUT và POST duyệt/từ chối, revision trước/sau ghi, cùng ba tình huống đổi giá sau GET kiểm tra nhưng trước PUT/POST. Kết quả phải là 409, giá mới giữ nguyên, nút ghi bị khóa và không tự gửi lại. Các bước chủ động đóng/tải lại biểu mẫu đã sửa đi qua cảnh báo chưa lưu.
- `scripts/verify-workspace-navigation.mjs` bỏ đoạn gán revision cố định cho từng dòng, dùng chung fixture chuẩn. Thêm `src/features/admin/price-fixture.test.js` để phát hiện fixture lệch hợp đồng sớm.

| Kiểm tra | Kết quả thực tế |
|---|---|
| Trước sửa: test:prices | Timeout khi chờ bảng do dữ liệu thiếu draftRevision |
| Trước sửa: 19 ca hồi quy fixture mới | 19 thất bại, tái hiện thiếu revision và thiếu kiểm tra token |
| Fixture + model/client API bảng giá | 48/48 test đạt |
| npm.cmd run test:prices | 24/24 kiểm tra Chrome đạt; sáng/tối, 320/768/1024/1440 px, axe và không có lỗi JavaScript chưa xử lý |
| npm.cmd run test:navigation | 23/23 kiểm tra Chrome đạt sau khi bỏ revision gán tay |
| npm.cmd run check | 606/606 test trong 52 tệp đạt; lint không lỗi/cảnh báo và build production thành công |
| npm.cmd run format:check | Đạt |
| Backend: AdminPriceApiTests + CurrentPriceApiTests | 33/33 test đạt trên database H2 kiểm thử, bao gồm token cũ và luồng quản trị/công khai |
| Kiểm tra độ tin cậy của test | Tạm bỏ điều kiện từ chối token cũ làm 4 ca hồi quy thất bại; đã khôi phục fixture đúng từng byte về bản đã kiểm tra |

Chạy lại ở thư mục frontend với website dev đang mở ở cổng 5173:

```powershell
npm.cmd test -- src/features/admin/price-fixture.test.js src/features/admin/prices.test.js
npm.cmd run test:prices
npm.cmd run test:navigation
npm.cmd run check
npm.cmd run format:check
```

Kiểm tra backend liên quan ở thư mục backend:

```powershell
.\mvnw.cmd -B -ntp -o '-Dtest=AdminPriceApiTests,CurrentPriceApiTests' test
```

Bằng chứng frontend ở `.cache/r3-price-fixture/`, kết quả Chrome ở `.cache/admin-prices/results.json` và `.cache/workspace-navigation/result.json`; nhật ký backend ở `.local/r3-price-fixture/price-api-tests.log`. Chrome dùng HTTP fixture riêng, backend dùng H2; lượt R3 này không ghi thử lên EcoThuGomDB hoặc kiểm tra lại hai phiên admin trên SQL Server. Postman CLI chưa có, nên dùng hợp đồng cục bộ cùng các bộ kiểm thử sẵn có. README, mã kiểm thử và gói demo được cập nhật cùng bản build đã đạt kiểm tra; không đóng gói nhật ký riêng tư hoặc thư mục cache.

<a id="ban-do-thu-gom"></a>
## Bản đồ điểm thu gom và chỉ đường cho nhân viên

Đã triển khai ngày 26/10/2026 theo lựa chọn của người dùng: bản đồ ở bước địa chỉ khi đặt lịch và ở địa chỉ đã lưu; tuyến đường dành cho ô tô/xe tải nhỏ. Backend đang chạy bản mới ở cổng 8080, SQL Server localhost:1435; đăng nhập lại sau lần khởi động backend khi cập nhật tính năng.

| Phần | Trách nhiệm | Phụ thuộc |
|---|---|---|
| pickup-location | Khách lấy GPS hoặc chọn điểm; lưu vị trí với địa chỉ và snapshot riêng của đơn; hiển thị điểm cho người được quyền xem đơn | Quyền địa chỉ và đơn hiện có |
| collector-directions | Khi đơn ASSIGNED, tự tìm tuyến ô tô từ điểm xuất phát demo; hiển thị đường, khoảng cách, thời gian và hướng dẫn. Điểm xuất phát tập trung trong `src/features/maps/collector-origin.js` | pickup-location |

Thứ tự: lưu/đọc tọa độ và kiểm thử quyền → bản đồ chọn điểm và địa chỉ → chỉ đường theo đơn → kiểm thử trình duyệt, SQL Server và đóng gói. Tận dụng cột lat/lng của addresses; thêm hai cột snapshot nullable vào collection_orders bằng migration bổ sung, giữ nguyên đơn cũ. Vị trí là tùy chọn để tương thích dữ liệu cũ; nếu chưa có điểm bản đồ, giao diện giải thích và vẫn cho xem địa chỉ liên hệ.

Hợp đồng đã triển khai: `pickupAddress.location` là null hoặc `{lat,lng}` hợp lệ; chi tiết đơn thêm `pickupLocation`. Backend chốt điểm đích từ snapshot đã lưu, không nhận điểm đích do nhân viên tự gửi. API `POST /api/collector/orders/{id}/route` nhận `{origin:{lat,lng}}`, yêu cầu phiên COLLECTOR/CSRF và đơn được phân công còn trong giai đoạn di chuyển. Trả đường dạng GeoJSON cùng khoảng cách/thời gian/hướng dẫn; không lưu điểm xuất phát của nhân viên và không đưa tên/số điện thoại sang dịch vụ bản đồ.

Thiết kế: giữ màu xanh, font Be Vietnam Pro, nút/hộp trạng thái và cảnh báo chưa lưu đang có theo Taste Skill. Dùng Leaflet 1.9.4. Khách chọn vị trí bằng GPS sau khi bấm nút hoặc chọn trên bản đồ; nhân viên không bị yêu cầu chia sẻ GPS để xem tuyến. Chọn điểm bằng click hoặc di chuyển bản đồ bằng bàn phím rồi chọn điểm giữa. Thử các trạng thái tải, từ chối quyền, thiếu GPS, lỗi bản đồ/định tuyến và màn hình nhỏ. Địa chỉ lưu dùng cùng form/map; giữ nguyên điểm của đơn khi địa chỉ nguồn bị sửa/xóa.

Nguồn bản đồ: [quy định tile OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/), có attribution và dùng cache trình duyệt, không tải hàng loạt. Định tuyến: [Valhalla](https://github.com/valhalla/valhalla/blob/master/docs/docs/api/route/api-reference.md), `auto` với `shortest=true`, yêu cầu tắt hierarchy pruning trong phạm vi dịch vụ cho phép. Chế độ này ưu tiên khoảng cách theo dữ liệu và giới hạn bộ định tuyến; không khẳng định đường tối ưu tuyệt đối hoặc tính được tình trạng giao thông thực tế. Mặc định dùng demo endpoint công khai được [Valhalla công bố](https://github.com/valhalla/valhalla#demo-server), có timeout và giới hạn tần suất; endpoint cấu hình được để chuyển sang máy chủ riêng. Không làm tự động tìm địa chỉ bằng Nominatim hoặc theo dõi GPS liên tục trong phần này.

### Dùng chức năng bản đồ

1. Khách mở **Đặt lịch** hoặc **Địa chỉ thu gom → Thêm/Sửa địa chỉ**. Bấm **Lấy vị trí hiện tại** rồi cho phép trình duyệt, hoặc bấm trên bản đồ. Bàn phím có thể di chuyển bản đồ bằng phím mũi tên rồi chọn **Chọn điểm giữa bản đồ**. GPS hoạt động trên HTTPS hoặc localhost; vẫn chọn điểm thủ công được khi từ chối GPS.
2. Kiểm tra điểm đúng cổng/lối vào và đối chiếu với địa chỉ đã nhập. Điểm là tùy chọn, có nút bỏ điểm. Khi đặt lịch bằng địa chỉ đã lưu, điểm theo địa chỉ đó được giữ ở chế độ chỉ xem; sửa địa chỉ ở trang quản lý nếu muốn cập nhật nguồn.
3. Admin xác nhận/phân công như luồng cũ. Khi nhân viên mở chi tiết đơn ASSIGNED có tọa độ, ứng dụng tự gọi API và hiển thị tuyến ngắn nhất cho ô tô/xe tải nhỏ, khoảng cách, thời gian ước tính và hướng dẫn từng chặng. Điểm xuất phát tạm là khu vực Công viên Tao Đàn, gần trung tâm Quận 1, TP. Hồ Chí Minh (`10.77479, 106.69309`); vị trí này dựa trên điểm bản đồ Công viên Tao Đàn và chỉ để minh họa, không phải địa chỉ đại lý chính thức. Khi đã EN_ROUTE/ARRIVED, nhân viên có thể bấm **Tính lại tuyến đường** từ cùng điểm. Khi chốt nơi tập kết thật, thay `temporaryCollectorOrigin` tại `src/features/maps/collector-origin.js`. [Tọa độ Công viên Tao Đàn trên bản đồ OpenStreetMap](https://mapcarta.com/29017812).
4. Đơn cũ chưa có snapshot vị trí hiển thị hướng dẫn liên hệ khách; sửa địa chỉ nguồn không tự thay đổi đơn cũ. Tạo một lịch mới có điểm bản đồ để thử luồng đầy đủ. Không suy đoán hoặc gán tọa độ giả cho các đơn đã tồn tại.

Tọa độ được làm tròn 6 chữ số thập phân trước khi gửi; cả hai thành phần phải hợp lệ, kể cả giá trị 0. Khi GPS phản hồi chậm, chọn điểm khác hoặc chuyển sang địa chỉ lưu sẽ bỏ kết quả GPS cũ để tránh ghi đè điểm mới. Vị trí bản nháp chỉ giữ trong bộ nhớ phiên của ứng dụng và được xóa theo cơ chế đăng xuất hiện có.

### Điểm xuất phát tạm cho nhân viên

Đã chọn khu vực Công viên Tao Đàn ở trung tâm Quận 1 làm điểm khởi hành minh họa: `10.77479, 106.69309`. Tọa độ đại diện khu vực công viên theo dữ liệu OpenStreetMap, không phải địa chỉ đại lý hay vị trí bãi xe chính thức. Khi đơn đã **ASSIGNED** và có điểm khách, trang chi tiết tự gọi API tuyến đường; nhân viên không phải cấp quyền GPS. Bản đồ hiển thị điểm xuất phát và điểm khách, sau đó vẽ tuyến cùng khoảng cách, thời gian ước tính và hướng dẫn chặng khi API trả thành công. Từ EN_ROUTE/ARRIVED vẫn có thể tính lại từ điểm tạm này.

Tọa độ nằm riêng trong `Frontend VCoi/src/features/maps/collector-origin.js`; khi chốt địa chỉ đại lý thật, cập nhật điểm và nhãn tại đó. Tuyến đi dùng API hiện có, chỉ gửi `{origin:{lat,lng}}`; API tiếp tục lấy điểm đích từ snapshot trong đơn và không lưu điểm xuất phát. [Vị trí Công viên Tao Đàn trên dữ liệu OpenStreetMap](https://mapcarta.com/29017812).

Kiểm tra lượt này: `npm run check` đạt 648 test/57 tệp, lint và build; `npm run format:check` đạt sau chuẩn hóa định dạng. `npm run test:maps` đạt 15 kiểm tra Chrome, trong đó xác nhận tự gọi endpoint khi ASSIGNED, dùng đúng tọa độ tạm, không đọc GPS, tính lại tuyến, lỗi định tuyến, đơn cũ thiếu tọa độ, sáng/tối và màn hình 320–1440 px. Kịch bản Chrome dùng fixture HTTP cho endpoint định tuyến và tile bản đồ cục bộ; lượt này không gọi Valhalla thật hoặc kiểm tra đơn 89 trên SQL Server.

### Database, cấu hình và kiểm tra

Database hiện tại đã được nhận diện khớp hoàn toàn fingerprint cũ trước khi thêm marker và hai cột nullable. Migration không xóa/ghi lại dữ liệu. Schema mới: 14 bảng, 159 cột, 42 check, 32 FK, 48 index; fingerprint `0BE24917CBDF3FAE15FB3E9DAE726E2A72D2969EECC5FEF8AAC24274A9BB3245`. `VCoi.SchemaVersion=2026-10-25.1` vẫn là marker nhận diện bộ schema gốc; migration bổ sung có marker riêng `VCoi.PickupLocationVersion=1`.

Máy cài mới dùng `01-schema.sql`/`initialize-demo-db.ps1` đã có phần vị trí. Với database của bản trước, chạy ở thư mục backend; script từ chối schema lạ và không thay thế database:

```powershell
.\scripts\migrate-pickup-location.ps1 -ServerInstance 'localhost,1435' -DatabaseName EcoThuGomDB -TrustServerCertificate
pwsh -File .\scripts\verify-pickup-location-sql.ps1 -DbHost localhost -DbPort 1435
```

`ROUTING_URL` đổi endpoint định tuyến; mặc định `https://valhalla1.openstreetmap.de/route`. `ROUTING_TIMEOUT_MS` mặc định 15000, trong khoảng 100–15000; client giới hạn response 1 MB, geometry 20.000 điểm và không đi theo redirect. Mỗi backend cách hai yêu cầu provider tối thiểu 1,1 giây. `ROUTING_PROXY_URL` là proxy HTTP không kèm thông tin đăng nhập nếu mạng cần proxy; `start-local.ps1` nhận proxy hệ thống hiện có khi phù hợp rồi khôi phục môi trường sau khi dừng. Không nhúng mật khẩu proxy vào source hoặc hướng dẫn. `VITE_MAP_TILE_URL` cho phép thay nguồn tile khi build frontend; mặc định OSM chuẩn. Bản đồ tải Leaflet riêng khi cần, không thêm thư viện định tuyến frontend.

| Kiểm tra tính năng vị trí/chỉ đường | Kết quả |
|---|---|
| Backend đầy đủ | 245 test đạt, 0 thất bại/lỗi/bỏ qua; JAR build thành công |
| Lưu địa chỉ/đặt lịch và quyền chỉ đường trên SQL Server thật | 11/11 test đạt trong database VCoi_MapTest riêng; database thử đã dọn |
| Hồi quy frontend đầy đủ, gồm GPS đến muộn khi đổi địa chỉ | 638 test / 55 tệp đạt; lint và build production đạt |
| Ca hồi quy GPS đến muộn khi chuyển địa chỉ lưu | Thất bại trước sửa; 26 kiểm thử liên quan đạt sau sửa |
| Chrome test:maps | 15 kiểm tra đạt, gồm GPS, địa chỉ lưu, đặt lịch, lỗi dịch vụ, sáng/tối và 320/768/1024/1440 px; hộp bản đồ/chỉ đường qua axe |
| Chrome test:navigation | 23 kiểm tra đạt, giữ cơ chế cảnh báo chưa lưu và bộ lọc/trang |
| Client Java gọi dịch vụ công khai thật | Tuyến mẫu giữa hai điểm công khai tại TP.HCM: 1.533 m, 330 giây, 83 điểm hình học, 8 hướng dẫn; khoảng 12,5 giây trên mạng đang dùng |
| Timeout, giới hạn dữ liệu và lỗi provider | Kiểm thử bằng HTTP server riêng trên loopback, không gửi vị trí thật của người dùng |

Frontend chạy `npm.cmd run test:maps`; kiểm tra SQL dùng PowerShell 7 và Windows authentication, như script kiểm thử SQL trước đó. Bằng chứng frontend ở `.cache/pickup-location/`, `.cache/maps/results.json` và ảnh cùng thư mục; backend ở `.local/pickup-location/`, `.local/maps-sql/`. Các trình duyệt test dùng GPS giả lập, API fixture và tile cục bộ, không tự tải hàng loạt tile công khai. Hợp đồng cập nhật ở `docs/collector-routing-openapi.json` cùng các OpenAPI đơn thu gom hiện có. Lượt kiểm thử không đổi hồ sơ, mật khẩu hoặc trạng thái đơn của người dùng trong EcoThuGomDB.

<a id="tan-trang-toan-bo-giao-dien"></a>
## Tân trang toàn bộ giao diện

Đã triển khai ngày 26/10/2026 theo yêu cầu làm mới toàn bộ website, bao gồm các trang nhỏ. Áp dụng **Taste Skill**, **Frontend UI Engineering**, **GSAP Core/React**; giữ hệ thống CSS hiện có, font Be Vietnam Pro tự lưu và bộ icon Phosphor. Không thay framework hoặc đưa thêm một design system vào các biểu mẫu đang chạy.

**Design Read:** làm mới website của một đại lý thu mua cho khách hàng, nhân viên và quản trị viên; giữ nhận diện VCoi xanh đậm/vàng chanh, rõ ràng và dễ thao tác. Điều chỉnh các mức của Taste: trang giới thiệu DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4; trang nghiệp vụ 4 / 3 / 5 để ưu tiên khả năng đọc, dữ liệu và thao tác.

- **Giới thiệu và bảng giá:** ảnh có chú thích, nhịp chữ/khoảng cách mới, khối quy trình xanh đậm, điều hướng và liên kết rõ trạng thái. Giữ nội dung nghiệp vụ và các đường dẫn cũ.
- **Đăng nhập, đăng ký và trang nhỏ:** khung biểu mẫu thống nhất; trạng thái tải có biểu tượng/skeleton, rỗng/lỗi có hướng xử lý và nút thử lại. Giữ chức năng hiện/ẩn mật khẩu và kiểm tra dữ liệu.
- **Khách hàng và nhân viên:** điều hướng có icon, trạng thái mục đang mở, bố cục hồ sơ/địa chỉ/đặt lịch/chi tiết đơn, cân/ảnh/báo giá/thanh toán và biên nhận theo cùng màu, đường viền và nhịp khoảng cách. Thu gọn tiêu đề và khung chỉ đường.
- **Toàn bộ quản trị:** đồng bộ tiêu đề, thống kê, bảng, bộ lọc, biểu mẫu và xác nhận ở đơn, danh mục/vật liệu, giá, tài khoản, hủy/đổi lịch, khiếu nại, thống kê, hồ sơ, hồ sơ đơn và biên nhận.
- **Animation:** GSAP **3.15.0** + **@gsap/react 2.1.2**: vào trang nhẹ, xuất hiện từng phần khi cuộn trang chủ; CSS cho hover/nhấn, trạng thái tải và hộp cảnh báo. Tọa độ, hình bản đồ và dữ liệu số không bị thay đổi để tạo hiệu ứng. Không khóa cuộn hoặc phát lại animation mỗi lần đổi bộ lọc.

Chuyển động dùng ref có phạm vi, được dọn khi đổi trang/unmount và khi bật `prefers-reduced-motion`; giao diện giảm chuyển động vẫn hiển thị đầy đủ. Ảnh đầu trang luôn hiện để không trì hoãn nội dung chính. Lỗi CSS bảng giá admin ảnh hưởng sang bảng giá công khai khi chuyển trang đã được tái hiện trên Chrome 320 px, rồi sửa bằng cách giới hạn selector trong `.admin-shell`.

Các URL, hợp đồng API, quyền truy cập, cảnh báo chưa lưu và trạng thái danh sách được giữ theo luồng hiện có. Không có animation trang trí lặp vô hạn; biểu tượng tải chỉ chuyển động khi đang chờ dữ liệu.

Tệp chính: `Frontend VCoi/src/styles/refinement.css` (màu và các thành phần dùng chung), `src/components/MotionMain.jsx` (chuyển trang), `src/features/home/HomeMotion.jsx` (trang chủ), các layout và `AsyncState.jsx`. Giới hạn CSS bảng quản trị ở `src/styles/admin-prices.css`. Hai dependency animation được khóa phiên bản trong manifest và lockfile.

| Kiểm tra giao diện | Kết quả thực tế |
|---|---|
| Frontend: kiểm tra đầy đủ | `npm.cmd run check`: lint đạt, 638 test / 55 tệp đạt, build production đạt; `npm.cmd run format:check` đạt |
| Nghiệp vụ qua trình duyệt | 469 kiểm tra đạt trên 20 nhóm: auth/đặt lịch, điều phối/phân công lại, tiến độ, cân/ảnh, báo giá, duyệt giá, thanh toán, hồ sơ/địa chỉ, hủy/đổi lịch, khiếu nại, danh mục/giá/tài khoản, thống kê, hồ sơ đơn/biên nhận và điều hướng |
| Chrome: toàn bộ trang và các biến thể theo vai trò | 169 lượt đạt: 320/768/1440 px, sáng/tối, kiểm tra tràn ngang và axe ở desktop; không lỗi JavaScript |
| Chrome: chuyển từ bảng giá admin sang bảng giá công khai | Tái hiện lỗi bảng bị cắt ở 320 px trước sửa; đạt sau sửa |
| Chrome: bật giảm chuyển động khi animation đang chạy | Đạt cho chuyển trang và xuất hiện khi cuộn; không để lại transform hoặc nội dung mờ |
| Dependency frontend chạy thực tế | `npm audit --omit=dev --audit-level=high`: 0 lỗ hổng tại thời điểm kiểm tra |

Chạy kiểm tra giao diện bằng `npm.cmd run test:ui`; kiểm thử hành vi từng chức năng giữ trong các lệnh `test:*` hiện có. Một số script cũ được bổ sung thao tác xác nhận **Rời đi** tại bước chủ động tải lại/đóng biểu mẫu, phù hợp cảnh báo chưa lưu đã có từ mục 7; không tắt hoặc bỏ qua cơ chế bảo vệ của ứng dụng. Bằng chứng ở `.cache/ui-refresh/`, gồm ảnh chụp, `summary.json` của 20 nhóm kiểm thử nghiệp vụ, `results.json` và `transitions.json` của kiểm tra giao diện; thư mục này không được đưa vào gói bàn giao. Các ca mô phỏng lỗi/đồng thời sử dụng fixture HTTP cục bộ. Kiểm tra bảng giá công khai còn đối chiếu dữ liệu SQL Server qua proxy Vite; kiểm thử vị trí trên SQL Server thật được ghi riêng ở phần bản đồ.

<a id="chinh-sua-theo-gop-y"></a>
## Chỉnh sửa theo góp ý giao diện, kỳ thống kê và vị trí

Cập nhật 26/10/2026, theo các đánh dấu trực tiếp trên trình duyệt. Áp dụng Taste Skill theo hướng chỉnh đúng các vùng được yêu cầu, giữ hệ thống màu và component của VCoi.

- **Header và ảnh đầu trang:** menu nằm giữa trên desktop, nút tài khoản và sáng/tối ở bên phải; xóa khung chú thích chèn trên ảnh; tăng ảnh lên 590 px ở desktop và điều chỉnh độ phân giải tải theo kích thước mới.
- **Quy trình:** bốn bước nằm trên một hàng ở desktop, mỗi bước có ảnh minh họa từ các ảnh dự án hiện có và icon; chuyển thành hai cột ở tablet, một cột trên điện thoại nhỏ.
- **Sáng/tối:** có nút ở website, trang tài khoản, không gian khách hàng, nhân viên và quản trị. Lần đầu theo hệ thống; lựa chọn thủ công được lưu ở khóa `vcoi.theme` và giữ khi đổi trang/tải lại. Đổi giao diện đồng bộ cả biến màu, badge và trường nhập; hoạt động cả khi trình duyệt chặn lưu tùy chọn.
- **Thống kê:** thêm bộ chọn **Ngày / Tháng / Quý / Năm**, cho chọn tháng/năm/quý lịch sử, cùng nút **Hôm nay**. Bấm **Áp dụng kỳ** để cập nhật báo cáo. Khoảng ngày tùy chỉnh vẫn có ở dưới. Dùng API hiện có với `from` bao gồm ngày đầu, `to` loại trừ ngày cuối kế tiếp, theo giờ Việt Nam; có kiểm tra năm nhuận và ranh giới năm/quý. URL giữ kỳ đã áp dụng sau tải lại; cảnh báo khi bỏ tiêu chí chưa áp dụng vẫn hoạt động.
- **Lấy vị trí:** ưu tiên vị trí nhanh (`enableHighAccuracy=false`, cache tối đa 60 giây), timeout trình duyệt 5 giây và giới hạn chờ của giao diện 6 giây, kể cả lúc trình duyệt chưa phản hồi quyền. Có **Hủy lấy vị trí**, bỏ kết quả đến muộn khi hủy/chọn điểm khác/rời form. Nếu máy không trả được tọa độ, chọn ghim trực tiếp; không tự đoán vị trí khách.
- **Tải bản đồ:** đã tái hiện `tile.openstreetmap.org` bị phân giải về `127.0.0.1` và báo connection refused trên máy đang dùng. Tự chuyển sang `tile.openstreetmap.de`, giữ attribution, kiểm soát chờ tải và có **Tải lại bản đồ** ngay trong form; giữ địa chỉ đã nhập và điểm đã chọn. Nguồn dự phòng do [OSM Deutschland/FOSSGIS vận hành](https://www.openstreetmap.de/nutzen/dienste-osm-de/). `VITE_MAP_TILE_URL` có thể thay nguồn lúc build; khi đặt nguồn riêng, ứng dụng dùng nguồn đã cấu hình.

Kiểm thử bao gồm lỗi cả hai nguồn ảnh nền, tải lại, hủy GPS và kết quả đến muộn, lựa chọn theme, bốn loại kỳ thống kê qua API fixture, cảnh báo chưa lưu và các kích thước 320/768/1024/1864 px. Một lượt kiểm tra tích hợp tải ảnh nền thật trong form tại TP.HCM đã thành công, có đầy đủ attribution; các bộ test tự động còn lại chặn ảnh nền bằng fixture cục bộ. GPS trong test được giả lập, không lấy vị trí thật của người dùng.

Lệnh kiểm tra mới: `npm.cmd run test:review-fixes`. Bằng chứng tại `Frontend VCoi/.cache/review-fixes/`, gồm `results.json`, `live-map.json`, ảnh chụp và log kiểm thử. Các kiểm tra `test:reports`, `test:maps`, `test:browser`, `test:navigation` và `test:ui` tiếp tục được giữ.

| Kiểm tra sau sửa | Kết quả |
|---|---|
| `npm.cmd run check` và `npm.cmd run format:check` | Lint/format đạt, 644 test trong 56 tệp đạt, build production đạt |
| `test:review-fixes` | 12 kiểm tra mới đạt, gồm khôi phục nền bản đồ, retry/giữ form, hủy GPS, header/ảnh/quy trình, theme, kỳ lịch sử và cảnh báo chưa lưu |
| `test:reports`, `test:maps`, `test:browser`, `test:navigation` | Lần lượt 22, 15, 21 và 23 kiểm tra đạt |
| `test:ui` | 169 kiểm tra trang/sáng/tối/kích thước + 2 kiểm tra chuyển trang/giảm chuyển động đạt |
| Tải nền bản đồ thật | Ảnh OSM Deutschland 256×256 đã tải và hiển thị trong form; đã xem ảnh chụp để xác nhận nội dung bản đồ, không chỉ kiểm tra mã HTTP |

Phần này sửa frontend và cấu hình nguồn ảnh nền, dùng lại API báo cáo theo khoảng ngày hiện có; database và bản JAR backend giữ phiên bản đã kiểm tra ở phần trước. Gói demo được cập nhật từ bản build frontend mới.

## Mục lục

- [Cập nhật hồ sơ đơn admin và hai lỗi điều hướng](#cap-nhat-ho-so-admin).
- [Phân công lại nhân viên trước khi khởi hành](#cap-nhat-phan-cong-lai).
- [Nhân viên tải ảnh phiếu cân](#cap-nhat-anh-phieu-can).
- [Hồ sơ và đổi mật khẩu cho nhân viên/admin](#cap-nhat-ho-so-nhan-su).
- [Bộ cài database và chạy demo trên máy khác](#demo-may-khac).
- [Cảnh báo biểu mẫu và giữ vị trí danh sách](#cap-nhat-trai-nghiem-dieu-huong).
- [Rà soát tổng thể sau mục 7](#ra-soat-sau-muc-7).
- [Sửa lỗi đồng thời khi khóa tài khoản R1](#sua-loi-dong-thoi-tai-khoan).
- [Sửa cảnh báo bỏ kết luận khiếu nại R2](#sua-r2-ket-luan-khieu-nai).
- [Sửa fixture và kiểm thử bảng giá R3](#sua-r3-fixture-bang-gia).
- [Bản đồ và chỉ đường thu gom](#ban-do-thu-gom).
- [Tân trang toàn bộ giao diện](#tan-trang-toan-bo-giao-dien).
- [Chỉnh sửa header, sáng/tối, kỳ thống kê và vị trí](#chinh-sua-theo-gop-y).

### Hướng dẫn dự án và dữ liệu mẫu

- [EcoThuGom Backend](#doc-ecothugom-backend-readme-md) — `ecothugom-backend/README.md`
- [Dữ liệu mẫu EcoThuGom](#doc-ecothugom-backend-scripts-sql-readme-md) — `ecothugom-backend/scripts/sql/README.md`
- [Frontend VCoi](#doc-frontend-vcoi-readme-md) — `Frontend VCoi/README.md`
- [EcoThuGom](#doc-readme-md) — `README.md`

### Backend: nghiệp vụ, API và thiết kế

- [Hoàn thiện backend theo tám nhóm API của người dùng](#doc-ecothugom-backend-capability-map-md) — `ecothugom-backend/CAPABILITY-MAP.md`
- [API quản trị danh mục và vật liệu](#doc-ecothugom-backend-docs-admin-catalog-md) — `ecothugom-backend/docs/admin-catalog.md`
- [ADMIN quản lý bảng giá thu mua](#doc-ecothugom-backend-docs-admin-prices-md) — `ecothugom-backend/docs/admin-prices.md`
- [Xác thực và phân quyền](#doc-ecothugom-backend-docs-auth-api-md) — `ecothugom-backend/docs/auth-api.md`
- [Hoàn thiện tám nhóm API của đồ án EcoThuGom](#doc-ecothugom-backend-docs-backend-completion-md) — `ecothugom-backend/docs/backend-completion.md`
- [Đặt lịch thu gom của khách hàng](#doc-ecothugom-backend-docs-collection-orders-md) — `ecothugom-backend/docs/collection-orders.md`
- [Di chuyển, cân thực tế và khách duyệt báo giá](#doc-ecothugom-backend-docs-collection-workflow-md) — `ecothugom-backend/docs/collection-workflow.md`
- [API bảng giá thu mua hiện hành](#doc-ecothugom-backend-docs-current-prices-md) — `ecothugom-backend/docs/current-prices.md`
- [Xác nhận và phân công thu gom](#doc-ecothugom-backend-docs-dispatch-orders-md) — `ecothugom-backend/docs/dispatch-orders.md`
- [Hồ sơ, mật khẩu và địa chỉ](#doc-ecothugom-backend-docs-profile-addresses-md) — `ecothugom-backend/docs/profile-addresses.md`
- [Thanh toán mô phỏng](#doc-ecothugom-backend-docs-simulated-payments-md) — `ecothugom-backend/docs/simulated-payments.md`
- [admin-reports](#doc-ecothugom-backend-spec-admin-reports-md) — `ecothugom-backend/SPEC-admin-reports.md`
- [disputes](#doc-ecothugom-backend-spec-disputes-md) — `ecothugom-backend/SPEC-disputes.md`
- [evidence](#doc-ecothugom-backend-spec-evidence-md) — `ecothugom-backend/SPEC-evidence.md`
- [order-changes](#doc-ecothugom-backend-spec-order-changes-md) — `ecothugom-backend/SPEC-order-changes.md`
- [order-history](#doc-ecothugom-backend-spec-order-history-md) — `ecothugom-backend/SPEC-order-history.md`
- [profile-addresses](#doc-ecothugom-backend-spec-profile-addresses-md) — `ecothugom-backend/SPEC-profile-addresses.md`

### Frontend: giao diện và luồng chức năng

- [Admin quản lý tài khoản](#doc-frontend-vcoi-docs-admin-accounts-ui-md) — `Frontend VCoi/docs/admin-accounts-ui.md`
- [Admin quản lý danh mục và vật liệu](#doc-frontend-vcoi-docs-admin-catalog-ui-md) — `Frontend VCoi/docs/admin-catalog-ui.md`
- [Giao diện quản trị VCoi tham khảo PCMaker](#doc-frontend-vcoi-docs-admin-design-md) — `Frontend VCoi/docs/admin-design.md`
- [Admin xác nhận và phân công trên frontend](#doc-frontend-vcoi-docs-admin-dispatch-spec-md) — `Frontend VCoi/docs/admin-dispatch-spec.md`
- [Admin xử lý khiếu nại khách hàng](#doc-frontend-vcoi-docs-admin-disputes-ui-md) — `Frontend VCoi/docs/admin-disputes-ui.md`
- [Admin xử lý yêu cầu hủy và đổi lịch](#doc-frontend-vcoi-docs-admin-order-changes-ui-md) — `Frontend VCoi/docs/admin-order-changes-ui.md`
- [Admin quản lý bảng giá thu mua](#doc-frontend-vcoi-docs-admin-prices-ui-md) — `Frontend VCoi/docs/admin-prices-ui.md`
- [Thống kê thu mua theo kỳ](#doc-frontend-vcoi-docs-admin-reports-ui-md) — `Frontend VCoi/docs/admin-reports-ui.md`
- [Xác thực, điều hướng vai trò và đặt lịch](#doc-frontend-vcoi-docs-auth-booking-spec-md) — `Frontend VCoi/docs/auth-booking-spec.md`
- [Nhân viên ghi nhận thanh toán mô phỏng](#doc-frontend-vcoi-docs-collector-payment-md) — `Frontend VCoi/docs/collector-payment.md`
- [Nhân viên khởi hành và đến điểm thu gom](#doc-frontend-vcoi-docs-collector-progress-md) — `Frontend VCoi/docs/collector-progress.md`
- [Nhân viên gửi báo giá sau cân](#doc-frontend-vcoi-docs-collector-quotation-md) — `Frontend VCoi/docs/collector-quotation.md`
- [Nhân viên nhập cân thực tế](#doc-frontend-vcoi-docs-collector-weighing-md) — `Frontend VCoi/docs/collector-weighing.md`
- [Hoàn thiện khu khách hàng VCoi](#doc-frontend-vcoi-docs-customer-workspace-md) — `Frontend VCoi/docs/customer-workspace.md`
- [Hướng giao diện VCoi](#doc-frontend-vcoi-docs-design-direction-md) — `Frontend VCoi/docs/design-direction.md`
- [Thiết kế lại VCoi](#doc-frontend-vcoi-docs-frontend-redesign-md) — `Frontend VCoi/docs/frontend-redesign.md`

### Các đợt kiểm thử và rà soát

- [Rà soát hoàn thiện đồ án VCoi](#doc-bao-cao-ra-soat-vcoi-2026-10-25-md) — `BAO_CAO_RA_SOAT_VCOI_2026-10-25.md`
- [Xác minh API admin danh mục/vật liệu – 23/10/2026](#doc-ecothugom-backend-docs-admin-catalog-verification-md) — `ecothugom-backend/docs/admin-catalog-verification.md`
- [Bổ sung xác minh — 25/10/2026](#doc-ecothugom-backend-docs-admin-prices-verification-md) — `ecothugom-backend/docs/admin-prices-verification.md`
- [Báo cáo rà soát và hoàn thiện backend — 23/10/2026](#doc-ecothugom-backend-docs-backend-completion-verification-md) — `ecothugom-backend/docs/backend-completion-verification.md`
- [Xác minh thanh toán mô phỏng – 23/10/2026](#doc-ecothugom-backend-docs-simulated-payments-verification-md) — `ecothugom-backend/docs/simulated-payments-verification.md`
- [Kết quả kiểm tra ba bước thu gom – 23/10/2026](#doc-ecothugom-backend-docs-workflow-verification-md) — `ecothugom-backend/docs/workflow-verification.md`
- [Kết quả quản trị và tách bố cục chức năng](#doc-frontend-vcoi-docs-admin-dispatch-verification-md) — `Frontend VCoi/docs/admin-dispatch-verification.md`
- [Kết quả xác thực và đặt lịch frontend](#doc-frontend-vcoi-docs-auth-booking-verification-md) — `Frontend VCoi/docs/auth-booking-verification.md`
- [Kết quả kiểm tra bản khởi tạo VCoi](#doc-frontend-vcoi-docs-verification-md) — `Frontend VCoi/docs/verification.md`

### Kế hoạch và lịch sử triển khai

- [Phần backend còn thiếu và thứ tự đề xuất](#doc-ecothugom-backend-docs-backend-roadmap-md) — `ecothugom-backend/docs/backend-roadmap.md`
- [Quản trị danh mục và vật liệu – 23/10/2026](#doc-ecothugom-backend-tasks-admin-catalog-md) — `ecothugom-backend/tasks/admin-catalog.md`
- [ADMIN quản lý phiên bản giá](#doc-ecothugom-backend-tasks-admin-prices-md) — `ecothugom-backend/tasks/admin-prices.md`
- [Thanh toán mô phỏng – 23/10/2026](#doc-ecothugom-backend-tasks-payment-md) — `ecothugom-backend/tasks/payment.md`
- [Thu gom, cân thực tế và khách duyệt báo giá](#doc-ecothugom-backend-tasks-plan-md) — `ecothugom-backend/tasks/plan.md`
- [Tiến độ](#doc-ecothugom-backend-tasks-todo-md) — `ecothugom-backend/tasks/todo.md`
- [Kế hoạch xác thực và đặt lịch](#doc-frontend-vcoi-tasks-plan-md) — `Frontend VCoi/tasks/plan.md`
- [Frontend VCoi/tasks/todo.md](#doc-frontend-vcoi-tasks-todo-md) — `Frontend VCoi/tasks/todo.md`

### Lịch sử dọn dẹp dự án

- [Dọn tệp không dùng trong backend và frontend VCoi](#doc-bao-cao-don-dep-2026-10-25-md) — `BAO_CAO_DON_DEP_2026-10-25.md`

---

<a id="group-huong-dan"></a>
## Hướng dẫn dự án và dữ liệu mẫu

<a id="doc-ecothugom-backend-readme-md"></a>
### EcoThuGom Backend

Nguồn trước khi gộp: `ecothugom-backend/README.md`.

<!-- source-begin:doc-ecothugom-backend-readme-md -->
<a id="doc-ecothugom-backend-readme-md--ecothugom-backend"></a>
#### EcoThuGom Backend

Backend đồ án thương mại điện tử thu mua phế liệu của **một đại lý**, dùng SQL Server đã có. Có danh mục/giá, xác thực/phân quyền, hồ sơ/địa chỉ, đặt lịch/điều phối, cân/báo giá/thanh toán mô phỏng, yêu cầu hủy/đổi lịch, timeline/biên nhận, ảnh riêng tư, khiếu nại và thống kê admin.

<a id="doc-ecothugom-backend-readme-md--công-nghệ"></a>
##### Công nghệ

- Java, mã nguồn biên dịch cho Java 21.
- Spring Boot 4.1.1, Spring MVC, Spring Data JPA, Bean Validation, Spring Security (session, BCrypt, CSRF).
- Microsoft JDBC Driver 13.4.0 và SQL Server.
- Maven Wrapper 3.10.0; không cần cài Maven toàn máy.
- JUnit, MockMvc và H2 dành riêng cho kiểm thử.

<a id="doc-ecothugom-backend-readme-md--chạy-trên-máy-windows-hiện-tại"></a>
##### Chạy trên máy Windows hiện tại

Điều kiện: Java đã được cài; SQL Server đang chạy và có database `EcoThuGomDB` được tạo từ script của đồ án.

Mở PowerShell:

```powershell
cd D:\VCOI\ecothugom-backend
.\scripts\start-local.ps1
```

Script tải thư viện xác thực Windows chính thức của Microsoft từ Maven Central, xác minh SHA-256 rồi lưu vào `.local/native/`. Thư mục này được bỏ qua khi đưa mã lên Git. Sau đó script chạy Spring Boot bằng Maven Wrapper.

Mặc định, backend kết nối `localhost:1435`, database `EcoThuGomDB`, bằng tài khoản Windows đang chạy Java. Tài khoản này cần quyền đọc danh mục/bảng giá, SELECT/INSERT/UPDATE `dbo.users`, SELECT/INSERT/UPDATE `dbo.collection_orders` và SELECT/INSERT `dbo.collection_items`, `dbo.order_status_logs`. Instance đã được đối chiếu khi thiết lập là `ThanhDat\MSSQLSERVER01`.

Backend nghe tại **http://127.0.0.1:8080**. Dừng bằng `Ctrl+C`. Đây là API; địa chỉ `/` chưa có giao diện web.

Chờ log xuất hiện `Started EcoThuGomApplication` rồi mới gọi API. Lần chạy đầu cần thời gian tải dependency và kiểm tra cấu trúc bảng.

Sau lần chuẩn bị đầu tiên, cũng có thể chạy:

```powershell
.\mvnw.cmd spring-boot:run
```

Nếu dùng IDE để chạy trực tiếp `EcoThuGomApplication`, chạy script với `-PrepareOnly` trước rồi thêm VM option:

```text
-Djava.library.path=D:\VCOI\ecothugom-backend\.local\native
```

<a id="doc-ecothugom-backend-readme-md--các-api-hiện-có"></a>
##### Các API hiện có

Các API danh mục dưới đây vẫn công khai. Các API xác thực và phân quyền được hướng dẫn riêng trong [docs/auth-api.md](#doc-ecothugom-backend-docs-auth-api-md), kèm [OpenAPI](<ecothugom-backend/docs/auth-openapi.json>) có thể import vào Postman.

Tạo quản trị viên ban đầu: `.\scripts\create-initial-admin.ps1` (nhập mật khẩu ẩn). Sau đó đăng nhập ADMIN để tạo COLLECTOR; người dùng tự đăng ký sẽ luôn là CUSTOMER. Không cần chạy lại schema SQL; quyền kết nối được liệt kê ở phần chạy Windows phía trên.

| Method   | Đường dẫn                                           | Chức năng                                                                                |
| -------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET      | `/api/material-categories`                          | Các nhóm vật liệu đang hoạt động                                                         |
| GET      | `/api/materials`                                    | Vật liệu được thu mua thuộc nhóm đang hoạt động                                          |
| GET      | `/api/prices/current`                               | Giá thu mua hiện hành cho từng vật liệu; chưa có giá trả trạng thái liên hệ              |
| GET/POST | `/api/admin/material-categories`                    | ADMIN xem cả nhóm ẩn hoặc thêm danh mục                                                  |
| GET/PUT  | `/api/admin/material-categories/{id}`               | ADMIN xem hoặc thay thông tin danh mục                                                   |
| PATCH    | `/api/admin/material-categories/{id}/status`        | ADMIN ẩn/hiện danh mục bằng isActive                                                     |
| GET/POST | `/api/admin/materials`                              | ADMIN xem cả vật liệu ngừng thu mua hoặc thêm mới                                        |
| GET/PUT  | `/api/admin/materials/{id}`                         | ADMIN xem hoặc thay thông tin vật liệu                                                   |
| PATCH    | `/api/admin/materials/{id}/status`                  | ADMIN ngừng/nhận lại thu mua bằng accepted                                               |
| POST     | `/api/customer/orders`                              | CUSTOMER đặt lịch; cần cookie phiên và CSRF                                              |
| GET      | `/api/customer/orders/{id}`                         | CUSTOMER xem chi tiết đơn của chính mình                                                 |
| GET      | `/api/admin/orders`                                 | ADMIN xem đơn; lọc status, phân trang                                                    |
| GET      | `/api/admin/orders/{id}`                            | ADMIN xem chi tiết đơn                                                                   |
| POST     | `/api/admin/orders/{id}/confirm`                    | ADMIN xác nhận PENDING -> CONFIRMED; cần CSRF/version                                    |
| POST     | `/api/admin/orders/{id}/assign`                     | ADMIN giao cho nhân viên ACTIVE; kiểm tra trùng lịch                                     |
| GET      | `/api/collector/orders/{id}`                        | COLLECTOR xem chi tiết đơn được giao                                                     |
| POST     | `/api/collector/orders/{id}/start-trip`             | ASSIGNED -> EN_ROUTE                                                                     |
| POST     | `/api/collector/orders/{id}/arrive`                 | EN_ROUTE -> ARRIVED                                                                      |
| GET/POST | `/api/collector/orders/{id}/weighings`              | Xem lịch sử; nhập cân hoặc phiếu điều chỉnh                                              |
| POST     | `/api/collector/orders/{id}/quotes`                 | Gửi báo giá từ cân và giá APPROVED hiện hành                                             |
| GET      | `/api/customer/orders/{id}/quotes`                  | Khách xem báo giá đơn của mình; collector/admin có route tương ứng                       |
| POST     | `/api/customer/orders/{id}/quotes/{quoteId}/accept` | Đồng ý -> AWAITING_PAYMENT                                                               |
| POST     | `/api/customer/orders/{id}/quotes/{quoteId}/reject` | Từ chối -> ARRIVED                                                                       |
| POST     | `/api/collector/orders/{id}/payments/simulate`      | Nhân viên ghi thanh toán mô phỏng -> COMPLETED; cần version, quoteId, method, requestKey |
| GET      | `/api/customer/orders/{id}/payments`                | Khách xem thanh toán đơn của mình; collector/admin có route tương ứng                    |

Điều phối và cách thử Postman: [docs/dispatch-orders.md](#doc-ecothugom-backend-docs-dispatch-orders-md), [OpenAPI](<ecothugom-backend/docs/dispatch-orders-openapi.json>). Mỗi thao tác kiểm tra version và lưu log trong transaction. Không cần chạy lại schema SQL.

Quản trị danh mục/vật liệu: [hướng dẫn](#doc-ecothugom-backend-docs-admin-catalog-md), [OpenAPI import Postman](<ecothugom-backend/docs/admin-catalog-openapi.json>), [HTTP mẫu](<ecothugom-backend/docs/admin-catalog.http>). POST tạo trạng thái đang hoạt động; PUT thay thông tin và giữ trạng thái; PATCH `/status` ẩn/hiện hoặc ngừng/nhận lại. Thêm quyền SELECT/INSERT/UPDATE `dbo.material_categories`, `dbo.materials`. Không xóa vật lý và không đổi schema; quản trị bảng giá chưa thuộc phần này.

Hướng dẫn đặt lịch, request JSON và cách thử Postman: [docs/collection-orders.md](#doc-ecothugom-backend-docs-collection-orders-md). [OpenAPI đặt lịch](<ecothugom-backend/docs/collection-orders-openapi.json>) có thể import vào Postman. Đơn mới có trạng thái PENDING, lưu địa chỉ và giá ước tính tại lúc tạo; giá cuối cùng sẽ được chốt ở bước cân/báo giá. Quyền SQL bổ sung: SELECT/INSERT `dbo.collection_orders`, `dbo.collection_items`, `dbo.order_status_logs` (không cần đổi schema).

Tham số phân trang: `page` mặc định `0`, nhỏ nhất `0`; `size` mặc định `20`, từ `1` đến `100`. Danh mục/bảng giá sắp theo ID tăng dần; danh sách đơn theo createdAt giảm dần rồi ID giảm dần. Trang vượt quá số trang trả về danh sách rỗng.

`/api/materials` nhận thêm `categoryId` là số nguyên dương để lọc theo nhóm. Bỏ tham số để lấy tất cả nhóm đang hoạt động. Nhóm không tồn tại hoặc đã ngừng hoạt động trả về danh sách rỗng.

Ví dụ gọi từ PowerShell:

```powershell
Invoke-RestMethod 'http://127.0.0.1:8080/api/material-categories'
Invoke-RestMethod 'http://127.0.0.1:8080/api/materials'
Invoke-RestMethod 'http://127.0.0.1:8080/api/materials?categoryId=1&page=0&size=10'
```

Phản hồi vật liệu có cấu trúc:

```json
{
  "data": [
    {
      "id": 1,
      "categoryId": 1,
      "categoryName": "Giấy",
      "name": "Giấy carton",
      "grade": "Khô sạch",
      "unit": "KG",
      "description": null,
      "excludedItems": null,
      "imageUrl": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Đây là ví dụ định dạng; số lượng và nội dung phụ thuộc database. Phản hồi danh mục dùng cùng cấu trúc phân trang; mỗi phần tử gồm `id`, `name`, `description`. API vật liệu hiện chưa kèm giá thu mua.

Tham số sai trả HTTP `400` dạng `application/problem+json`, với các trường Problem Detail như `type`, `title`, `status`, `detail`, `instance`. Không trả Entity JPA trực tiếp ra API.

Các request có sẵn trong [docs/catalog-api.http](<ecothugom-backend/docs/catalog-api.http>).

API bảng giá nhận thêm `materialId`, `categoryId`, `page`, `size`. Chỉ sử dụng giá `APPROVED` có hiệu lực tại giờ UTC của máy chủ; khi nhiều phiên bản cùng hiệu lực, chọn phiên bản cao nhất. Vật liệu chưa có giá hợp lệ vẫn xuất hiện với `priceStatus=CONTACT_FOR_QUOTE` và `unitPrice=null`.

```powershell
Invoke-RestMethod 'http://127.0.0.1:8080/api/prices/current'
Invoke-RestMethod 'http://127.0.0.1:8080/api/prices/current?materialId=1'
```

Hợp đồng và ví dụ phản hồi được mô tả trong [docs/current-prices.md](#doc-ecothugom-backend-docs-current-prices-md).

<a id="doc-ecothugom-backend-readme-md--database-và-cấu-hình"></a>
##### Database và cấu hình

Dữ liệu mẫu cho cả 14 bảng nằm trong [scripts/sql](#doc-ecothugom-backend-scripts-sql-readme-md). Chạy `seed-sample-data.sql` để có bảng giá, khách hàng và các đơn mô phỏng từ đặt lịch đến hoàn tất; chạy `verify-sample-data.sql` để kiểm tra quan hệ và số tiền. Đây là thao tác riêng, không tự chạy lúc khởi động backend.

Ánh xạ hiện có:

```text
dbo.material_categories (1) ── (n) dbo.materials (1) ── (n) dbo.price_rules
```

Hibernate dùng `ddl-auto=validate`, SQL initialization dùng `never`. Chạy backend không tạo lại bảng, không seed và không thay đổi schema. Danh mục, vật liệu, giá và tài khoản dùng JPA; danh sách/đặt lịch/chi tiết đơn dùng JdbcTemplate trên schema hiện có.

Các cấu hình dùng chung nằm trong `src/main/resources/application.properties`.

- Profile mặc định `windows`: xác thực Windows cho máy phát triển. Kết nối có mã hóa và chấp nhận chứng chỉ SQL Server cục bộ.
- Profile `sqlserver`: xác thực bằng tài khoản SQL Server lấy từ biến môi trường. Mặc định kiểm tra chứng chỉ máy chủ.
- `DB_HOST`, `DB_PORT`, `DB_NAME`: thay đổi máy chủ, cổng, database.
- `DB_URL`: tùy chọn ghi đè toàn bộ JDBC URL.
- `SERVER_ADDRESS`, `SERVER_PORT`: địa chỉ và cổng HTTP; mặc định chỉ nghe trên máy hiện tại.

Ví dụ chọn cổng SQL Server khác:

```powershell
$env:DB_PORT = '56963'
.\scripts\start-local.ps1
```

Nếu cần SQL Server Authentication, đặt `SPRING_PROFILES_ACTIVE=sqlserver`, `DB_USERNAME`, `DB_PASSWORD` trong môi trường chạy của IDE hoặc terminal. Ứng dụng không tự tạo tài khoản SQL Server. Không ghi mật khẩu vào mã nguồn hoặc README. Spring Boot không tự đọc tệp `.env`.

<a id="doc-ecothugom-backend-readme-md--kiểm-thử-và-đóng-gói"></a>
##### Kiểm thử và đóng gói

```powershell
.\mvnw.cmd -B -ntp verify
```

Kiểm thử tự động dùng profile `test` và database H2 riêng trong bộ nhớ, không kết nối hoặc ghi vào SQL Server của bạn. Fixture kiểm tra danh mục, phân trang, tiếng Việt và giá với đồng hồ UTC cố định. Kiểm thử xác thực đi qua session và CSRF thực, bao gồm đăng ký, mật khẩu, trùng tài khoản, chống tự nâng quyền, ba vai trò, khóa phiên, đăng xuất, quyền sở hữu đơn và giới hạn đăng nhập. H2 giúp chạy độc lập; kiểm tra tích hợp SQL Server cần khởi động với profile `windows` hoặc `sqlserver` và gọi API thực tế. Dừng tiến trình đang chạy bằng JAR trước khi đóng gói lại để tránh Windows khóa file.

Sau khi build, có thể chạy JAR:

```powershell
java '-Djava.library.path=D:\VCOI\ecothugom-backend\.local\native' -jar .\target\ecothugom-backend-0.0.1-SNAPSHOT.jar
```

<a id="doc-ecothugom-backend-readme-md--cấu-trúc-và-phần-tiếp-theo"></a>
##### Cấu trúc và phần tiếp theo

```text
src/main/java/com/ecothugom/
  EcoThuGomApplication.java
  catalog/                 Controller, Service, Repository, Entity, DTO
  auth/                    Tài khoản, session, CSRF, BCrypt và phân quyền
  orders/                  Đặt lịch, điều phối, di chuyển, cân và duyệt báo giá
  reports/                 Thống kê admin theo kỳ, vật liệu và người chi tiền
  common/api/              Cấu trúc phản hồi phân trang
  common/config/           Đồng hồ UTC dùng chung cho nghiệp vụ thời gian
src/test/                  Kiểm thử API và fixture độc lập
scripts/start-local.ps1     Chuẩn bị xác thực Windows và chạy ứng dụng
scripts/create-initial-admin.ps1  Tạo admin bằng mật khẩu nhập ẩn
```

Tài liệu ba bước mới và cách thử: [docs/collection-workflow.md](#doc-ecothugom-backend-docs-collection-workflow-md), [OpenAPI import Postman](<ecothugom-backend/docs/collection-workflow-openapi.json>), [HTTP mẫu](<ecothugom-backend/docs/collection-workflow.http>). SQL cần thêm SELECT/INSERT `weighing_records`, `quote_items` và SELECT/INSERT/UPDATE `order_quotes`. Không cần chạy lại schema.

Thanh toán mô phỏng đã có ở [docs/simulated-payments.md](#doc-ecothugom-backend-docs-simulated-payments-md), [OpenAPI import Postman](<ecothugom-backend/docs/simulated-payments-openapi.json>) và [HTTP mẫu](<ecothugom-backend/docs/simulated-payments.http>). Cần thêm SELECT/INSERT `dbo.payments`; không đổi schema. Nhân viên được giao đơn ghi nhận CASH_SIMULATED hoặc TRANSFER_SIMULATED, số tiền lấy từ báo giá ACCEPTED hiện hành; đơn chuyển COMPLETED và có completed_at. Gửi trùng trả 409, kiểm tra kết quả bằng GET payments. Không gọi ngân hàng hoặc cổng thanh toán thật.

Quản trị bảng giá đã có: tạo/sửa DRAFT, duyệt hoặc từ chối, xem chi tiết và lịch sử phiên bản theo vật liệu. Xem [hướng dẫn Postman](#doc-ecothugom-backend-docs-admin-prices-md), [OpenAPI](<ecothugom-backend/docs/admin-prices-openapi.json>) và [HTTP mẫu](<ecothugom-backend/docs/admin-prices.http>). Mọi route `/api/admin/price-rules` yêu cầu ADMIN, lệnh ghi cần CSRF. Giá đã APPROVED/REJECTED bất biến; tạo phiên bản mới để thay giá. Bảng giá công khai và snapshot đơn/báo giá/thanh toán giữ quy tắc hiện có. Không cần sửa schema; tài khoản SQL cần SELECT/INSERT/UPDATE `dbo.price_rules` và SELECT/UPDATE `dbo.materials` để lấy khóa cấp phiên bản.

Tám nhóm API trong bảng yêu cầu đã được bổ sung: [hướng dẫn đầy đủ](#doc-ecothugom-backend-docs-backend-completion-md), [OpenAPI tổng hợp import Postman](<ecothugom-backend/docs/backend-completion-openapi.json>), [HTTP mẫu](<ecothugom-backend/docs/backend-completion.http>), [báo cáo xác minh](#doc-ecothugom-backend-docs-backend-completion-verification-md). Kết quả cuối: 211 test và 250 kiểm tra HTTP/SQL Server đạt. **Mọi yêu cầu hủy của khách đều cần ADMIN duyệt**; POST /cancel chỉ tạo yêu cầu PENDING. Ảnh lưu tại backend qua EVIDENCE_DIRECTORY (mặc định .local/evidence), JPEG/PNG tối đa 5 MiB, đọc qua API có kiểm tra quyền. Đổi mật khẩu thu hồi các phiên cũ. Các quyền SQL bổ sung cho địa chỉ/yêu cầu/khiếu nại/URL ảnh được nêu trong hướng dẫn; không cần chạy lại schema.

Có thể tiếp tục xây giao diện React theo các hợp đồng API đã có. Các route mới tuân theo quyền trong `auth/SecurityConfiguration`; route chưa khai báo mặc định bị chặn.

Ngày 25/10/2026, theo xác nhận của người dùng, riêng instance MSSQLSERVER01 đã chuyển sang TCP 1435 để tránh trùng MSSQLSERVER trên 1433. Profile windows mặc định 1435; có thể ghi đè bằng DB_PORT hoặc DB_URL. Script quản trị scripts/set-local-sql-port-1435.ps1 lưu cổng cũ tại .local/sql-port-before-1435.json trước khi đổi. Các script live frontend dùng localhost,1435 và truyền DB_PORT=1435 cho backend thử.

<!-- source-end:doc-ecothugom-backend-readme-md -->

<a id="doc-ecothugom-backend-scripts-sql-readme-md"></a>
### Dữ liệu mẫu EcoThuGom

Nguồn trước khi gộp: `ecothugom-backend/scripts/sql/README.md`.

<!-- source-begin:doc-ecothugom-backend-scripts-sql-readme-md -->
<a id="doc-ecothugom-backend-scripts-sql-readme-md--dữ-liệu-mẫu-ecothugom"></a>
#### Dữ liệu mẫu EcoThuGom

[seed-sample-data.sql](<ecothugom-backend/scripts/sql/seed-sample-data.sql>) bổ sung dữ liệu giả định vào database SQL Server `EcoThuGomDB` đã có đủ 14 bảng. Các mức giá phục vụ kiểm thử, không phải bảng giá thị trường.

<a id="doc-ecothugom-backend-scripts-sql-readme-md--chạy-bằng-ssms"></a>
##### Chạy bằng SSMS

1. Kết nối đúng SQL Server đang chứa `EcoThuGomDB`.
2. Mở `D:\VCOI\ecothugom-backend\scripts\sql\seed-sample-data.sql`.
3. Chọn Execute.
4. Mở và chạy [verify-sample-data.sql](<ecothugom-backend/scripts/sql/verify-sample-data.sql>). Bộ demo nguyên bản đạt 21 kiểm tra sẽ trả `PASS`.

Không cần chạy lại script tạo database. Backend không tự chạy file seed này khi khởi động.

Hoặc dùng PowerShell trên máy phát triển hiện tại:

```powershell
cd D:\VCOI\ecothugom-backend
sqlcmd -S 'lpc:.\MSSQLSERVER01' -E -C -b -f 65001 -i '.\scripts\sql\seed-sample-data.sql'
sqlcmd -S 'lpc:.\MSSQLSERVER01' -E -C -b -f 65001 -i '.\scripts\sql\verify-sample-data.sql'
```

<a id="doc-ecothugom-backend-scripts-sql-readme-md--bộ-dữ-liệu-ban-đầu"></a>
##### Bộ dữ liệu ban đầu

| Bảng | Số dòng trong bộ demo |
|---|---:|
| users | 5 |
| addresses | 2 |
| material_categories | 3 |
| materials | 9 |
| price_rules | 12 |
| collection_orders | 8 |
| collection_items | 16 |
| weighing_records | 9 |
| order_quotes | 5 |
| quote_items | 10 |
| payments | 4 |
| disputes | 1 |
| order_status_logs | 41 |
| order_change_requests | 3 |

Ba nhóm và ba vật liệu gốc được dùng lại theo tên/phân hạng. Script thêm sáu vật liệu còn thiếu. ID không được cố định; mọi quan hệ được tra theo khóa dữ liệu.

Các tài khoản gồm một quản trị viên, hai nhân viên thu gom và hai khách hàng. Tên bắt đầu bằng `DEMO`, điện thoại giả định bắt đầu bằng `000`, email thuộc miền `ecothugom.example`. Địa chỉ có nhãn mô phỏng và không dùng giao nhận thực tế.

Mật khẩu được băm BCrypt từ một giá trị ngẫu nhiên đã bỏ đi; file seed không công bố mật khẩu đăng nhập. Các tài khoản này phục vụ quan hệ dữ liệu. Khi làm API đăng nhập, cần thiết lập mật khẩu riêng qua chức năng phù hợp.

<a id="doc-ecothugom-backend-scripts-sql-readme-md--bảng-giá-khi-khởi-tạo"></a>
##### Bảng giá khi khởi tạo

| Vật liệu / phân hạng | Giá mẫu VND/kg |
|---|---:|
| Giấy carton / Khô sạch | 3.500 |
| Giấy báo / Khô sạch | 3.000 |
| Giấy văn phòng / Đã phân loại | 4.200 |
| Chai nhựa PET / Đã phân loại | 6.000 |
| Nhựa HDPE / Đã phân loại | 9.000 |
| Nhựa hỗn hợp / Cần kiểm tra | Liên hệ báo giá |
| Lon nhôm / Đã phân loại | 22.000 |
| Sắt vụn / Thông thường | 7.000 |
| Đồng đỏ / Loại 1 | 165.000 |

Tám mức giá đã được duyệt đang hiệu lực. Bốn dòng bổ sung minh họa giá carton đã hết hạn, giá carton tương lai, giá carton nháp và giá PET bị từ chối. Giá carton tương lai bắt đầu sau 30 ngày tính từ lần tạo demo đầu tiên; sau mốc đó, API sẽ chọn phiên bản tương lai này đúng theo quy tắc hiệu lực.

Mốc thời gian dùng UTC. Chạy lại script giữ nguyên ngày của bộ demo ban đầu, không tự dời lịch hoặc đặt lại hạn giá.

<a id="doc-ecothugom-backend-scripts-sql-readme-md--các-tình-huống-đơn-hàng"></a>
##### Các tình huống đơn hàng

| Mã đơn | Trạng thái | Dùng để thử |
|---|---|---|
| DEMO-0001 | PENDING | Khách vừa đặt lịch, có hai dòng vật liệu dự kiến |
| DEMO-0002 | CONFIRMED | Đơn đã xác nhận, khách gửi yêu cầu đổi lịch đang chờ xử lý |
| DEMO-0003 | ASSIGNED | Đã phân công và duyệt đổi lịch; giữ nguyên nhân viên |
| DEMO-0004 | AWAITING_SELLER_APPROVAL | Cân lại lon nhôm; báo giá v1 bị thay thế, v2 chờ khách đồng ý |
| DEMO-0005 | AWAITING_PAYMENT | Khách đã đồng ý 60.500đ; một lần thanh toán mô phỏng thất bại, một lần đang chờ |
| DEMO-0006 | COMPLETED | Thu mua xong, thanh toán tiền mặt mô phỏng 518.000đ |
| DEMO-0007 | CANCELLED | Khách xin hủy, đại lý đã duyệt |
| DEMO-0008 | DISPUTED | Đã thanh toán chuyển khoản mô phỏng 189.000đ, sau đó phát sinh khiếu nại |

Đơn `DEMO-0004` giữ bản cân cũ và tạo bản hiệu chỉnh qua `correction_of`. Báo giá cũ là 142.800đ; báo giá hiện hành sau cân lại là 145.000đ. Chi tiết báo giá giữ đúng bản cân và bản sao đơn giá của từng phiên bản.

Mọi bản ghi thanh toán đều dùng `CASH_SIMULATED` hoặc `TRANSFER_SIMULATED`. Script chỉ chèn dữ liệu SQL, không gọi dịch vụ thanh toán.

<a id="doc-ecothugom-backend-scripts-sql-readme-md--chạy-lại-và-kiểm-chứng"></a>
##### Chạy lại và kiểm chứng

Script dùng transaction và khóa riêng cho thao tác seed. Nó tra các khóa tự nhiên/mã `DEMO-0001..0008`, không xóa dữ liệu, không đặt lại ID và không cập nhật lại các dòng demo đã có. Nếu khóa tài khoản, mã đơn hoặc phiên bản giá dự kiến trùng với dữ liệu khác, script báo lỗi và rollback.

Các câu lệnh `UPDATE` trong script chỉ cập nhật biến bảng nội bộ dùng để tra ID. Không có `UPDATE` lên bảng nghiệp vụ.

Script kiểm chứng kiểm tra bộ demo nguyên bản. Nếu bạn chủ động thêm/sửa các đơn demo, các kiểm tra số lượng cố định có thể không còn phù hợp; chạy seed không phải thao tác khôi phục dữ liệu đã chỉnh.

Bộ dữ liệu đã được thử trong schema riêng của `tempdb` với toàn bộ cấu trúc/ràng buộc, chạy seed hai lần và đối chiếu số dòng của cả 14 bảng trước khi rollback vùng thử.

Sau khi nạp, có thể xem:

```sql
USE EcoThuGomDB;
SELECT code,status,pickup_start FROM dbo.collection_orders WHERE code LIKE 'DEMO-%' ORDER BY code;
SELECT material_id,unit_price,approval_status,valid_from,valid_to,version_number
FROM dbo.price_rules ORDER BY material_id,version_number;
```

Khi backend đang chạy, API `GET /api/prices/current` sẽ trả chín vật liệu: tám giá hiện hành và một vật liệu cần liên hệ báo giá. API hiện chỉ có danh mục/vật liệu/bảng giá; dữ liệu đơn hàng được chuẩn bị sẵn cho các API nghiệp vụ tiếp theo.

<!-- source-end:doc-ecothugom-backend-scripts-sql-readme-md -->

<a id="doc-frontend-vcoi-readme-md"></a>
### Frontend VCoi

Nguồn trước khi gộp: `Frontend VCoi/README.md`.

<!-- source-begin:doc-frontend-vcoi-readme-md -->
<a id="doc-frontend-vcoi-readme-md--frontend-vcoi"></a>
#### Frontend VCoi

Frontend React **JavaScript** cho đồ án thương mại điện tử thu mua phế liệu của một đại lý. Backend Spring Boot + SQL Server hiện có nằm ở `../ecothugom-backend`.

<a id="doc-frontend-vcoi-readme-md--chạy-trên-máy-hiện-tại"></a>
##### Chạy trên máy hiện tại

Các dependency đã được cài trong thư mục này. Mở PowerShell:

```powershell
cd "D:\VCOI\Frontend VCoi"
npm run dev
```

Mở **http://127.0.0.1:5173/**. Trang bảng giá: **http://127.0.0.1:5173/bang-gia**.

Để bảng giá có dữ liệu, chạy backend cổng `8080` trong một cửa sổ khác:

```powershell
cd D:\VCOI\ecothugom-backend
.\scripts\start-local.ps1
```

Dùng thống nhất host `127.0.0.1`. Vite chuyển tiếp `/api/*` sang backend nên không cần sửa CORS. Đăng ký và đặt lịch ghi dữ liệu qua API hiện có; không cần chạy lại script SQL.

<a id="doc-frontend-vcoi-readme-md--cài-lại-trên-máy-khác"></a>
##### Cài lại trên máy khác

Khuyến nghị Node.js **24 LTS**, npm 10 trở lên. Node 24.14.0 và npm 11.19.0 đã được dùng để cài dự án này. Node 22 cần ít nhất 22.13.

```powershell
npm ci
npm run dev
```

Giữ `package-lock.json` để cài đúng phiên bản. Nếu đổi địa chỉ backend, sao chép `.env.example` thành `.env.local`, sửa `BACKEND_PROXY_TARGET` rồi khởi động lại Vite. Không đặt mật khẩu, secret hay chuỗi kết nối SQL trong frontend hoặc biến `VITE_*`. Cấu hình Vite quét dependency của các route lazy ngay từ đầu để tránh tối ưu bổ sung khi vừa mở trang trên Windows; các tệp test được loại khỏi bước quét này.

<a id="doc-frontend-vcoi-readme-md--đã-có-trong-bản-khởi-tạo"></a>
##### Đã có trong bản khởi tạo

- Trang chủ VCoi với ảnh minh họa riêng, nhóm vật liệu, quy trình và FAQ.
- Bảng giá gọi GET `/api/material-categories` và `/api/prices/current`: lọc nhóm, phân trang, làm mới, tải/rỗng/lỗi; vật liệu chưa có giá hiển thị “Liên hệ báo giá”.
- Điều hướng bằng React Router, trang 404, menu điện thoại và điều khiển bằng bàn phím.
- Màu sáng/tối theo hệ điều hành; font Be Vietnam Pro và ảnh WebP lưu tại dự án.
- TanStack Query quản lý dữ liệu API; native fetch giữ cookie phiên. Chưa thêm Axios hoặc Redux vì chưa có nhu cầu.
- Tailwind CSS v4, CSS tokens, icon Phosphor; Vite, ESLint, Prettier, Vitest, Testing Library; axe và Lighthouse để kiểm tra giao diện.

<a id="doc-frontend-vcoi-readme-md--đã-bổ-sung-xác-thực-và-đặt-lịch"></a>
##### Đã bổ sung: xác thực và đặt lịch

| Trang          | Đường dẫn                       | Quyền và hành vi                                |
| -------------- | ------------------------------- | ----------------------------------------------- |
| Đăng ký        | `/dang-ky`                      | Tạo CUSTOMER, không tự đăng nhập                |
| Đăng nhập      | `/dang-nhap`                    | Số điện thoại hoặc email; vào đúng vai trò      |
| Lịch của khách | `/khach-hang`                   | Danh sách đơn của chính khách                   |
| Đặt lịch       | `/dat-lich`                     | CUSTOMER; nhập thông tin, xem lại và gửi        |
| Nhân viên      | `/nhan-vien`                    | Danh sách đơn được giao                         |
| Quản trị       | `/quan-tri`                     | Danh sách đơn của đại lý                        |
| Chi tiết đơn   | `/{khu-vuc}/don/{id}`           | Theo quyền của tài khoản đăng nhập              |
| Hồ sơ khách    | `/khach-hang/tai-khoan`         | Sửa tên/email, đổi mật khẩu và đăng nhập lại    |
| Địa chỉ khách  | `/khach-hang/dia-chi`           | Thêm/sửa/xóa, chọn mặc định, dùng khi đặt lịch  |
| Biên nhận      | `/khach-hang/don/:id/bien-nhan` | CUSTOMER; xem giao dịch đã hoàn tất, in/lưu PDF |

Bạn có thể đăng ký khách hàng mới trên giao diện. Nhân viên và admin dùng tài khoản đã tạo trong backend; form đăng ký không cho chọn vai trò. Nút **Đăng xuất** nằm trong điều hướng khi đã đăng nhập.

Từ trang chủ chọn **Đặt lịch thu gom**. Nếu chưa đăng nhập, website đưa bạn qua đăng nhập/đăng ký rồi quay lại form đặt lịch. Nhập địa chỉ, khung giờ Việt Nam, chọn vật liệu; số kg có thể để trống. Xem lại rồi xác nhận gửi. Backend trả mã đơn, trạng thái chờ xác nhận và ước tính; trang chi tiết có thể tải lại trạng thái.

Giữ cookie HttpOnly của backend, lấy CSRF mới trước mỗi thao tác ghi, không dùng JWT/localStorage cho xác thực. Khi phiên hết hạn hoặc đổi tài khoản, cache riêng tư bị xóa. Không tự gửi lại POST đặt lịch nếu mất kết nối hoặc chưa biết kết quả; website hướng về danh sách để tránh tạo đơn trùng.

Khu vực admin đã có **xác nhận và phân công thu gom**: mở chi tiết đơn PENDING → xác nhận → chọn nhân viên COLLECTOR đang ACTIVE → xem lại giờ hẹn → phân công. Lưu ghi chú tùy chọn cùng lịch sử xử lý. Backend kiểm tra trùng lịch và phiên bản; khi có xung đột hoặc chưa xác định kết quả, tải lại đơn và nhân viên trước khi xử lý tiếp. Không tự gửi lại POST.

Trang `/quan-tri` dùng topbar/sidebar, số lượng đơn từ API, lọc trạng thái qua URL, bảng đơn và phân trang; phong cách tham khảo PCMaker. Dự án `D:\WebPCMaker\frontend` chỉ được đọc để tham khảo, không chỉnh sửa. Số liệu bốn ô là số đơn theo trạng thái, chưa phải báo cáo tài chính/thống kê đầy đủ.

Nhân viên có danh sách, chi tiết và **cập nhật tiến độ di chuyển**. Đăng nhập COLLECTOR, mở đơn được giao tại `/nhan-vien/don/:id`: **Khởi hành** chuyển ASSIGNED → EN_ROUTE, sau đó **Đã đến điểm thu gom** chuyển EN_ROUTE → ARRIVED. Ghi chú tùy chọn tối đa 500 ký tự. Các nút chỉ hiện ở đúng bước, lấy version hiện tại từ server; khi xung đột hoặc chưa rõ kết quả, tải lại tiến độ trước khi tiếp tục. Không tự gửi lại POST. Hướng dẫn và kết quả kiểm tra: [collector-progress.md](#doc-frontend-vcoi-docs-collector-progress-md).

Khi đơn ARRIVED, nhân viên có **form cân thực tế**: chọn vật liệu, nhập tổng/bì theo kg, xem thực nhận và lưu một lô. Có kết quả hiện tại, lịch sử và cân điều chỉnh tham chiếu phiếu mới nhất, bắt buộc lý do. Chấp nhận dấu phẩy/chấm, tối đa 3 số lẻ; tổng phải lớn hơn bì. Khi version đơn/lịch sử lệch hoặc kết quả ghi chưa xác định, khóa lưu và tải lại cả hai. Xem [collector-weighing.md](#doc-frontend-vcoi-docs-collector-weighing-md).

Sau khi lưu đủ kết quả cân, nhân viên chọn **Xem trước báo giá** → kiểm tra từng vật liệu, phiếu cân mới nhất, đơn giá và tổng tham khảo → **Gửi báo giá cho khách**. Backend chốt giá, tạo báo giá hạn 24 giờ và chuyển đơn sang **Chờ khách duyệt báo giá**. Có báo giá hiện hành và lịch sử; báo giá đã hết hạn có thể được thay bằng bản mới theo quy tắc backend. Xem [collector-quotation.md](#doc-frontend-vcoi-docs-collector-quotation-md).

Khách hàng đã có **chấp thuận/từ chối báo giá** tại chi tiết đơn: xem khối lượng, đơn giá đã chốt, tổng tiền, hạn phản hồi và lịch sử; chọn quyết định → xem lại/ghi chú → xác nhận. Đồng ý chuyển sang AWAITING_PAYMENT; từ chối trả về ARRIVED để nhân viên xử lý lại. Báo giá hết hạn chỉ được xem. Kết quả phản hồi chính thức vẫn hiển thị nếu việc tải lại lịch sử gặp lỗi.

Khu khách còn có hồ sơ/đổi mật khẩu, sổ địa chỉ, đặt lịch từ địa chỉ lưu sẵn, ảnh vật liệu, kết quả cân, timeline, yêu cầu hủy/đổi lịch, khiếu nại và kết luận, thanh toán chỉ đọc và biên nhận. **Mọi yêu cầu hủy cần admin duyệt**, không tự hủy ngay. Đổi lịch trực tiếp trước khởi hành; khi EN_ROUTE phải gửi yêu cầu admin, từ ARRIVED không đổi lịch. Ảnh JPEG/PNG tối đa 5 MiB lưu tại backend theo API hiện có, xem bằng cookie và quyền với đơn.

Hướng dẫn sử dụng, phạm vi API và bằng chứng kiểm tra: [customer-workspace.md](#doc-frontend-vcoi-docs-customer-workspace-md). Taste Skill áp dụng cho toàn bộ frontend hiện có và phần mở rộng, tiếp nối nhận diện xanh rừng/xanh chanh, font và hệ thống thành phần của VCoi.

Nhân viên đã có **ghi nhận thanh toán mô phỏng** tại `/nhan-vien/don/:id` khi đơn AWAITING_PAYMENT: **Xem lại thanh toán** → chọn tiền mặt/chuyển khoản mô phỏng → **Xác nhận thanh toán mô phỏng**. Backend lấy tiền từ báo giá khách đã duyệt, ghi khoản chi và chuyển COMPLETED. Có kết quả/mã giao dịch sau reload; không tự gửi lại khi mất phản hồi. Xem [collector-payment.md](#doc-frontend-vcoi-docs-collector-payment-md) để biết điều kiện, phục hồi lỗi và bằng chứng kiểm tra.

Admin đã có **Danh mục** tại `/quan-tri/danh-muc` và **Vật liệu** tại `/quan-tri/vat-lieu`: thêm/sửa thông tin, ẩn/hiện danh mục, ngừng/nhận thu mua trở lại, lọc và phân trang theo URL. Trạng thái danh mục và cờ nhận thu mua của vật liệu được thể hiện riêng; có xác nhận trước thay đổi. Vật liệu mới chưa có giá hiển thị liên hệ báo giá. Xem [admin-catalog-ui.md](#doc-frontend-vcoi-docs-admin-catalog-ui-md) để biết quy tắc, API và kiểm tra.

Admin đã có **Bảng giá** tại `/quan-tri/bang-gia`: tạo/sửa giá nháp, xem chi tiết, xác nhận duyệt hoặc từ chối, lịch sử phiên bản theo vật liệu và bộ lọc/phân trang. Chỉ giá DRAFT được ghi; giá đã chốt giữ nguyên. Xem [admin-prices-ui.md](#doc-frontend-vcoi-docs-admin-prices-ui-md) để biết quy tắc hiệu lực, xử lý xung đột và kết quả kiểm tra.

Admin đã có **Tài khoản** tại `/quan-tri/tai-khoan`: danh sách phân trang, tạo nhân viên thu gom, khóa/mở khóa khách hàng và nhân viên qua bước xác nhận. ADMIN chỉ xem. Sau thay đổi làm mới nhân viên dùng để phân công; khóa tài khoản không tự thay đổi đơn đang có. Xem [admin-accounts-ui.md](#doc-frontend-vcoi-docs-admin-accounts-ui-md) để biết cách dùng, API và kiểm tra.

Admin đã có **Yêu cầu hủy/đổi lịch** tại `/quan-tri/yeu-cau`: lọc trạng thái, xem lý do/lịch cũ/mới và đơn hiện tại, chấp thuận/từ chối qua bước xem lại và xác nhận, lưu phản hồi cho khách. Yêu cầu đã chốt chỉ đọc. Duyệt đổi lịch EN_ROUTE đưa đơn về CONFIRMED, bỏ phân công cũ và dẫn đến trang phân công lại. Xem [admin-order-changes-ui.md](#doc-frontend-vcoi-docs-admin-order-changes-ui-md).

Admin đã có **Khiếu nại** tại `/quan-tri/khieu-nai`: xem nội dung và ảnh minh chứng, lọc/phân trang, tiếp nhận, giải quyết hoặc từ chối và lưu kết luận bắt buộc. Khiếu nại đã đóng chỉ đọc; kết luận xuất hiện ở lịch sử của khách. Đơn được phục hồi trạng thái trước khiếu nại, giữ nguyên tiền đã thanh toán. Xem [admin-disputes-ui.md](#doc-frontend-vcoi-docs-admin-disputes-ui-md).

Admin đã có **Thống kê** tại `/quan-tri/thong-ke`: chọn tháng/quý/năm hoặc khoảng ngày tối đa 366 ngày; số đơn, tỷ lệ hoàn tất, khối lượng và tiền đã chi; phân bố trạng thái và bảng phân trang theo vật liệu/nhân viên. Số đơn tính theo ngày tạo, tiền/khối lượng theo ngày thanh toán. Xem [admin-reports-ui.md](#doc-frontend-vcoi-docs-admin-reports-ui-md) để biết cách dùng và kết quả đối chiếu SQL thật.

Các API backend giữ nguyên. Khách chỉ theo dõi tiền đại lý chi và biên nhận, không thực hiện thanh toán.

<a id="doc-frontend-vcoi-readme-md--bố-cục-trang-giới-thiệu-và-trang-chức-năng"></a>
##### Bố cục trang giới thiệu và trang chức năng

| Khu vực            | Trang                                                                                                                                                                                       | Bố cục                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Website giới thiệu | `/`, `/bang-gia`                                                                                                                                                                            | `PublicLayout`: header và footer công khai       |
| Tài khoản          | `/dang-nhap`, `/dang-ky`                                                                                                                                                                    | `ServiceLayout account`: header tài khoản gọn    |
| Khách hàng         | `/khach-hang`, `/khach-hang/don/:id`, `/dat-lich`, hồ sơ/địa chỉ/biên nhận                                                                                                                  | `ServiceLayout`: điều hướng khách, đăng xuất     |
| Nhân viên          | `/nhan-vien`, `/nhan-vien/don/:id`                                                                                                                                                          | `ServiceLayout`: điều hướng nhân viên, đăng xuất |
| Quản trị           | `/quan-tri`, `/quan-tri/don/:id`, `/quan-tri/danh-muc`, `/quan-tri/vat-lieu`, `/quan-tri/bang-gia`, `/quan-tri/tai-khoan`, `/quan-tri/yeu-cau`, `/quan-tri/khieu-nai`, `/quan-tri/thong-ke` | `AdminLayout`: topbar/sidebar riêng              |

Các trang chức năng không dùng menu giới thiệu hoặc footer quảng bá. Mỗi khu có link **Về website**; bảo vệ route theo session và vai trò vẫn giữ nguyên. Khi thêm trang sau này, đặt dưới layout chức năng tương ứng trong `src/App.jsx`, không ghép lại với `PublicLayout`.

<a id="doc-frontend-vcoi-readme-md--cấu-trúc"></a>
##### Cấu trúc

```text
public/              Ảnh minh họa WebP, favicon
src/components/      Header và Footer dùng chung
src/features/home/   Các phần của trang chủ
src/features/prices/ Bảng giá
src/features/auth/   Phiên, CSRF, biểu mẫu và quyền
src/features/booking/Thông tin lịch và bước xem lại
src/features/orders/Đọc danh sách, chi tiết và định dạng đơn
src/features/admin/ Shell quản trị, bảng đơn, bộ lọc và số lượng
src/features/customer/ Báo giá khách, tài khoản/địa chỉ và vòng đời đơn
src/lib/             Đọc, kiểm tra dữ liệu API; định dạng VND và ngày giờ
src/pages/           Trang chủ, trang bảng giá và kiểm thử
src/styles/          Màu, khoảng cách và bố cục responsive
docs/                Hướng thiết kế và kết quả kiểm tra
```

Hợp đồng API nguồn: `../ecothugom-backend/docs/current-prices.md` và các OpenAPI trong thư mục backend. Không dùng dữ liệu giả để thay bảng giá khi backend lỗi. Dữ liệu SQL mẫu phục vụ đồ án, không đại diện giá thị trường.

<a id="doc-frontend-vcoi-readme-md--lệnh-phát-triển"></a>
##### Lệnh phát triển

| Lệnh                     | Công dụng                                                                   |
| ------------------------ | --------------------------------------------------------------------------- |
| `npm run dev`            | Máy chủ phát triển cổng 5173                                                |
| `npm run build`          | Tạo bản build trong `dist/`                                                 |
| `npm run preview`        | Xem bản build cổng 4173, có proxy API                                       |
| `npm run lint`           | Kiểm tra mã nguồn                                                           |
| `npm test`               | Chạy toàn bộ kiểm thử tự động                                               |
| `npm run test:watch`     | Chạy kiểm thử khi sửa mã                                                    |
| `npm run test:browser`   | Kiểm tra Chrome, responsive, axe và API                                     |
| `npm run test:flows`     | Kiểm tra xác thực và đặt lịch bằng HTTP mô phỏng                            |
| `npm run test:dispatch`  | Kiểm tra admin xác nhận/phân công và giao diện mới                          |
| `npm run test:progress`  | Kiểm tra nhân viên khởi hành/đến nơi và phục hồi lỗi                        |
| `npm run test:weighing`  | Kiểm tra cân nhiều vật liệu, cân lại, lịch sử và lỗi                        |
| `npm run test:quotation` | Kiểm tra xem trước/gửi báo giá, hết hạn và phục hồi lỗi                     |
| `npm run test:customer`  | Kiểm tra khu khách hàng, báo giá/tài khoản/địa chỉ/vòng đời đơn             |
| `npm run test:payment`   | Kiểm tra nhân viên chi trả mô phỏng, lỗi/đọc lại, responsive/axe            |
| `npm run test:catalog`   | Kiểm tra admin danh mục/vật liệu, trạng thái, lỗi và responsive/axe         |
| `npm run test:prices`    | Kiểm tra admin bảng giá nháp/duyệt/từ chối/lịch sử, lỗi và responsive/axe   |
| `npm run test:accounts`  | Kiểm tra admin tạo nhân viên, khóa/mở khóa và responsive/axe                |
| `npm run test:changes`   | Kiểm tra admin xử lý hủy/đổi lịch, version, phục hồi lỗi và responsive/axe  |
| `npm run test:disputes`  | Kiểm tra admin tiếp nhận/kết luận khiếu nại, version, lỗi và responsive/axe |
| `npm run test:reports`   | Kiểm tra thống kê theo kỳ, ngày/tổng số, hai bảng và lỗi/responsive/axe     |
| `npm run check`          | Lint, test, build                                                           |
| `npm run format`         | Định dạng mã                                                                |
| `npm run format:check`   | Kiểm tra định dạng                                                          |

`test:browser` cần Chrome đã cài, frontend cổng 5173 và backend cổng 8080 đang chạy với dữ liệu vật liệu mẫu. Lệnh chỉ đọc API, các tình huống lỗi/rỗng được mô phỏng trong trình duyệt kiểm thử, không sửa database. Kết quả và ảnh chụp lưu tại `.cache/verification/`.

`test:flows`, `test:dispatch`, `test:progress`, `test:weighing`, `test:quotation`, `test:customer`, `test:payment`, `test:catalog`, `test:prices`, `test:accounts`, `test:changes`, `test:disputes` và `test:reports` dùng HTTP mô phỏng theo hợp đồng, không ghi SQL. Ảnh và kết quả khu khách ở `.cache/customer-workspace/`; thanh toán nhân viên ở `.cache/collector-payment/`; danh mục/vật liệu ở `.cache/admin-catalog/`; khiếu nại ở `.cache/admin-disputes/`; thống kê ở `.cache/admin-reports/`.

Kiểm tra hệ thống thật trên Windows bằng `scripts/verify-live-auth-booking.ps1`: cần JAR backend đã build, JDK, sqlcmd và SQL Server hiện có. Script chạy 60 bước từ đăng ký/địa chỉ/đặt lịch, ảnh/đổi lịch/yêu cầu hủy đến phân công, di chuyển, cân điều chỉnh, khách từ chối báo giá đầu rồi chấp thuận bản mới, nhân viên thanh toán mô phỏng **qua UI**, biên nhận, khiếu nại và đổi mật khẩu/đăng nhập lại. Đối chiếu SQL: đơn chính COMPLETED version 14, 15 audit, hai phiếu cân, hai báo giá và một khoản chi mô phỏng khớp nhau; đơn phụ được admin duyệt hủy. Các bước admin duyệt hủy/xử lý khiếu nại trong script luồng tổng hợp này dùng API; các script chuyên biệt bên dưới kiểm tra chúng qua UI.

Script mở backend thử cổng 18080, frontend thử 5174, tạo tài khoản/đơn có marker riêng và thư mục ảnh riêng, rồi xóa đúng dữ liệu thử trong `finally`; không dừng các server 8080/5173 của bạn. Không chạy khi hai cổng thử đang được sử dụng. Kết quả ở `.cache/live-auth/result.json`; dữ liệu thử và ảnh được dọn cả khi kiểm tra lỗi. Không dùng tài khoản thật để chạy script.

Riêng danh mục/vật liệu có `scripts/verify-live-catalog.ps1`: 14 bước UI với backend/SQL thật bằng một admin, hai danh mục và hai vật liệu tổng hợp có marker riêng. Script kiểm tra CRUD/trạng thái, hiển thị công khai và SQL, rồi dọn đúng dữ liệu thử trong `finally`. Dùng cùng cổng thử 18080/5174 nên không chạy đồng thời với script luồng đơn. Không sửa danh mục/vật liệu sẵn có của bạn. Kết quả ở `.cache/live-catalog/`.

Riêng bảng giá có `scripts/verify-live-prices.ps1`: kiểm tra UI với năm phiên bản giá tổng hợp, backend và SQL thật; xác minh quy tắc hiệu lực/phiên bản và dọn dữ liệu có marker riêng trong `finally`. Dùng cổng 18080/5174 bằng bản build production qua Vite preview, không dừng server của bạn. Kết quả ở `.cache/live-prices/`; Chrome HTTP mô phỏng ở `.cache/admin-prices/`.

Riêng tài khoản có `scripts/verify-live-accounts.ps1`: ba tài khoản tổng hợp, kiểm tra UI tạo nhân viên/khóa/mở khóa, mất phiên và đăng nhập lại bằng backend/SQL thật, rồi dọn đúng tài khoản thử trong `finally`. Dùng cùng cổng thử 18080/5174 và production preview; kết quả ở `.cache/live-accounts/`, Chrome HTTP mô phỏng ở `.cache/admin-accounts/`.

Riêng yêu cầu hủy/đổi lịch có `scripts/verify-live-order-changes.ps1`: 13 bước kiểm tra thật, năm quyết định qua UI, hai đơn và ba tài khoản tổng hợp, đối chiếu version/audit/lịch/collector rồi dọn trong `finally`. Kết quả ở `.cache/live-order-changes/`, Chrome HTTP mô phỏng ở `.cache/admin-order-changes/`.

Riêng khiếu nại có `scripts/verify-live-disputes.ps1`: 15 kiểm tra thật, sáu quyết định qua UI trên bốn khiếu nại của hai đơn thử, ba phiên độc lập và ảnh riêng. Xác minh quyền/version/audit/kết luận, phục hồi ARRIVED hoặc COMPLETED và giữ nguyên thanh toán/biên nhận; dọn dữ liệu/ảnh trong `finally`. Dùng cùng cổng thử 18080/5174, không chạy đồng thời với các script live khác. Cần ít nhất một vật liệu đang có giá. Kết quả ở `.cache/live-disputes/`.

Riêng thống kê có `scripts/verify-live-reports.ps1`: 15 kiểm tra thật, ba tài khoản/ba đơn thử; hai thanh toán, hai vật liệu, cân điều chỉnh và khiếu nại sau thanh toán. Đối chiếu toàn bộ tổng quan, nhóm vật liệu và người ghi nhận tiền với SQL độc lập; kiểm tra số trên UI và hai kỳ ngày Việt Nam, rồi dọn dữ liệu trong `finally`. Cần hai vật liệu đang có giá, dùng cùng cổng thử 18080/5174. Trang thống kê chỉ gửi GET; các API nghiệp vụ được dùng để chuẩn bị dữ liệu kiểm thử. Kết quả ở `.cache/live-reports/`.

Trên máy này, SQL Server chứa EcoThuGomDB hiện dùng `localhost,1435` (Windows Authentication), tránh trùng instance SQL khác trên 1433/1434. Profile windows của backend và các script live đã cập nhật; frontend vẫn gọi API 8080 qua proxy.

Kết quả đợt xác thực/đặt lịch: [auth-booking-verification.md](#doc-frontend-vcoi-docs-auth-booking-verification-md). Kết quả lịch sử bản khởi tạo: [verification.md](#doc-frontend-vcoi-docs-verification-md).

Kết quả cho quản trị, xác nhận/phân công và tách bố cục: [admin-dispatch-verification.md](#doc-frontend-vcoi-docs-admin-dispatch-verification-md).

Đợt thiết kế lại giao diện: [frontend-redesign.md](#doc-frontend-vcoi-docs-frontend-redesign-md). Trang chủ dùng bố cục chữ/ảnh riêng, màu xanh rừng và xanh chanh; bảng giá, đăng nhập/đăng ký, đặt lịch, danh sách/chi tiết đơn và khu admin được đồng bộ. Các layout chức năng vẫn tách khỏi trang giới thiệu. Đợt này không thay API, phân quyền hay dependency.

Khi đưa lên hosting, cần cấu hình reverse proxy `/api` đến Spring Boot, HTTPS và SPA fallback về `index.html`. Proxy của Vite chỉ phục vụ phát triển/xem thử.

Ảnh trong `public/` do AI tạo để minh họa đồ án, không phải ảnh cơ sở hoặc nhân viên thực tế. Tham khảo thiết kế tại [design-direction.md](#doc-frontend-vcoi-docs-design-direction-md).

<!-- source-end:doc-frontend-vcoi-readme-md -->

<a id="doc-readme-md"></a>
### EcoThuGom

Nguồn trước khi gộp: `README.md`.

<!-- source-begin:doc-readme-md -->
<a id="doc-readme-md--ecothugom"></a>
#### EcoThuGom

Đồ án hệ thống thương mại điện tử thu mua phế liệu của một đại lý.

Backend Java Spring Boot và hướng dẫn chạy nằm trong [ecothugom-backend](#doc-ecothugom-backend-readme-md).

Frontend React JavaScript và hướng dẫn chạy nằm trong [Frontend VCoi](#doc-frontend-vcoi-readme-md).
Database SQL Server `EcoThuGomDB` được tạo trước bằng script SQL của đồ án.

<!-- source-end:doc-readme-md -->

---

<a id="group-backend"></a>
## Backend: nghiệp vụ, API và thiết kế

<a id="doc-ecothugom-backend-capability-map-md"></a>
### Hoàn thiện backend theo tám nhóm API của người dùng

Nguồn trước khi gộp: `ecothugom-backend/CAPABILITY-MAP.md`.

<!-- source-begin:doc-ecothugom-backend-capability-map-md -->
<a id="doc-ecothugom-backend-capability-map-md--hoàn-thiện-backend-theo-tám-nhóm-api-của-người-dùng"></a>
#### Hoàn thiện backend theo tám nhóm API của người dùng

Phạm vi người dùng đã yêu cầu: rà soát bảng tám nhóm và triển khai các phần thiếu. Một đại lý, Spring Boot/SQL Server, thanh toán mô phỏng; chưa làm React trong lượt này.

| Module | Trách nhiệm | Phụ thuộc |
|---|---|---|
| admin-catalog | Danh mục/vật liệu, đã hoàn tất | auth |
| admin-prices | Nháp/duyệt/từ chối/lịch sử giá, đã hoàn tất | admin-catalog, auth |
| profile-addresses | Sửa hồ sơ, đổi mật khẩu, địa chỉ riêng và đặt lịch từ địa chỉ lưu sẵn | auth, booking |
| order-changes | Mọi hủy cần admin duyệt, đổi lịch/yêu cầu và phân công lại | booking, dispatch, auth |
| order-history | Timeline và biên nhận snapshot | orders, quotes, simulated-payments |
| evidence | Tải/đọc ảnh vật liệu và cân theo quyền với đơn | orders, weighing, auth |
| disputes | Khách gửi, admin tiếp nhận/kết luận và phục hồi trạng thái trước tranh chấp | orders, auth, evidence |
| admin-reports | Thống kê theo kỳ/vật liệu/collector từ snapshot giao dịch đã thanh toán | simulated-payments, auth |

Thứ tự: profile-addresses → order-changes → order-history → evidence → disputes → admin-reports. Chỉ bổ sung các nhóm trong bảng; không tự thêm thông báo, đánh giá, vùng phục vụ hay cổng thanh toán thật.

Nguồn chuẩn: schema SQL Server, controller/service hiện có và tài liệu hợp đồng cục bộ. Các module tái dùng quyền, CSRF, Clock UTC, PageResponse, CAS/version và OrderWorkflow; không mở endpoint PATCH status tự do. Từng lát có test tập trung, cập nhật tài liệu và kiểm tra hồi quy.

Trạng thái cuối: đủ tám nhóm đã hoàn tất; 211 test và 250 kiểm tra HTTP/SQL Server đạt. Người dùng đã chốt ảnh lưu tại backend và mọi hủy phải qua admin. Xem docs/backend-completion-verification.md; không triển khai các mục ngoài bảng trong lượt này.

<!-- source-end:doc-ecothugom-backend-capability-map-md -->

<a id="doc-ecothugom-backend-docs-admin-catalog-md"></a>
### API quản trị danh mục và vật liệu

Nguồn trước khi gộp: `ecothugom-backend/docs/admin-catalog.md`.

<!-- source-begin:doc-ecothugom-backend-docs-admin-catalog-md -->
<a id="doc-ecothugom-backend-docs-admin-catalog-md--api-quản-trị-danh-mục-và-vật-liệu"></a>
#### API quản trị danh mục và vật liệu

Tất cả route dưới `/api/admin`, chỉ ADMIN đang đăng nhập. POST/PUT/PATCH cần cookie JSESSIONID và X-CSRF-TOKEN lấy mới sau login. Dùng schema hiện có, không chạy lại SQL.

<a id="doc-ecothugom-backend-docs-admin-catalog-md--danh-mục"></a>
##### Danh mục

| Method | Route | Kết quả |
|---|---|---|
| GET | /api/admin/material-categories?isActive=false&page=0&size=20 | PageResponse gồm cả nhóm ẩn nếu bỏ filter |
| GET | /api/admin/material-categories/{id} | Category gồm id, name, description, isActive |
| POST | /api/admin/material-categories | Tạo mới, isActive=true, trả 201 Category |
| PUT | /api/admin/material-categories/{id} | Thay name/description, giữ isActive, trả 200 |
| PATCH | /api/admin/material-categories/{id}/status | {"isActive":false} để ẩn, true để hiện; trả 200 |

Body POST/PUT: `{"name":"Giấy","description":"Các loại giấy thu mua"}`. name bắt buộc, sau strip không rỗng, tối đa 100 ký tự; description tối đa 500, thiếu/null/trống được lưu NULL. PUT là thay toàn bộ trường thông tin, không phải partial PATCH. Không cho truyền id/isActive trong body POST/PUT. Tên nhóm phải duy nhất, so trùng không phân biệt hoa thường; kiểm tra cả nhóm đã ẩn.

<a id="doc-ecothugom-backend-docs-admin-catalog-md--vật-liệu"></a>
##### Vật liệu

| Method | Route | Kết quả |
|---|---|---|
| GET | /api/admin/materials?categoryId=1&accepted=false&page=0&size=20 | PageResponse, gồm dữ liệu ẩn/ngừng thu mua nếu bỏ filter |
| GET | /api/admin/materials/{id} | Material đầy đủ cờ trạng thái |
| POST | /api/admin/materials | Tạo mới accepted=true, trả 201 Material |
| PUT | /api/admin/materials/{id} | Thay các trường thông tin, giữ accepted, trả 200 |
| PATCH | /api/admin/materials/{id}/status | {"accepted":false} để ngừng, true để nhận lại; trả 200 |

Body POST/PUT: `{"categoryId":1,"name":"Giấy carton","grade":"Khô sạch","unit":"KG","description":null,"excludedItems":null,"imageUrl":null}`. categoryId dương và tồn tại (kể cả nhóm ẩn); name bắt buộc tối đa 150, grade bắt buộc tối đa 50, unit chỉ KG. description/excludedItems/imageUrl tối đa 1000, thiếu/null/trống -> NULL. imageUrl nếu có phải là URL HTTP/HTTPS hợp lệ, có host và không userinfo; backend chỉ lưu, không tải URL. Chưa có upload ảnh trong module này. Tổ hợp categoryId/name/grade duy nhất, kiểm tra cả vật liệu đã ngừng thu mua. Không cho truyền accepted/id/giá vào body thông tin.

Admin Material gồm id, categoryId, categoryName, categoryActive, name, grade, unit, description, excludedItems, imageUrl, accepted và available. available = accepted AND categoryActive. Ẩn nhóm không sửa accepted của các vật liệu; hiện lại nhóm không tự nhận lại vật liệu đã ngừng. Admin được chuẩn bị vật liệu trong nhóm ẩn, khi đó available=false.

<a id="doc-ecothugom-backend-docs-admin-catalog-md--quy-tắc-chung-và-ảnh-hưởng"></a>
##### Quy tắc chung và ảnh hưởng

- Page từ 0, size 1..100 (mặc định 20), id tăng dần. Filter tùy chọn; ngoài trang hoặc nhóm không có vật liệu trả page rỗng. isActive/accepted dùng true/false.
- Không xóa row hoặc đổi ID. Ẩn/ngừng không sửa collection_items, price_rules, weighing_records, order_quotes, quote_items, payments hoặc audit đơn. Bảng giá công khai và tạo đơn mới tuân theo active/accepted hiện có. Giá phiên bản đã duyệt vẫn lưu trong database, không bị xóa.
- Đơn cũ vẫn đọc được. Mọi số cân, ước tính tiền, snapshot báo giá và tiền thanh toán đã chốt giữ nguyên. Chi tiết ước tính đơn cũ hiện lấy tên/grade trực tiếp từ danh mục, nên có thể hiển thị tên mới sau PUT; báo giá dùng snapshot nên giữ tên cũ. Không thêm cột snapshot mới trong phần này.
- Đơn chưa gửi báo giá vẫn phải có vật liệu đang nhận và giá hiện hành theo quy tắc cũ; nếu admin ngừng thu mua thì gửi báo giá có thể trả 409. Đơn đã có quote ACCEPTED vẫn thanh toán mô phỏng theo snapshot được.
- PUT/PATCH khóa dòng trong transaction. Schema chưa có version danh mục; các sửa đổi nối tiếp áp dụng theo thứ tự được xử lý. PUT thông tin không đổi cờ trạng thái. Không nhận PATCH status rỗng/null hoặc trường ngoài hợp đồng.
- Lỗi Problem Detail: 400 đầu vào sai, 401 chưa đăng nhập/phiên bị khóa, 403 sai vai trò/CSRF, 404 id/nhóm tham chiếu không tồn tại, 409 trùng tên/tổ hợp hoặc ràng buộc xung đột, 500 lỗi lưu dữ liệu; không trả SQL trong lỗi.

Các route trên là contract của phần triển khai này. Quản trị bảng giá nằm ở bước kế tiếp, chưa thuộc module danh mục.

<a id="doc-ecothugom-backend-docs-admin-catalog-md--thử-trên-postman"></a>
##### Thử trên Postman

1. Khởi động lại bằng `.\scripts\start-local.ps1` rồi import `docs/admin-catalog-openapi.json`. Dùng `http://127.0.0.1:8080` nhất quán để giữ cookie. File `.http` cùng thư mục có các request mẫu.
2. Đăng nhập ADMIN bằng POST `/api/auth/login`, sau đó GET `/api/auth/csrf` để lấy token mới. Mọi POST/PUT/PATCH chọn Body > raw > JSON, Content-Type application/json và X-CSRF-TOKEN; giữ cookie JSESSIONID.
3. POST danh mục với name/description. Lấy id từ response 201, dùng id thật cho GET/PUT/PATCH. Tên ví dụ có thể đã tồn tại, khi đó đổi tên mới hoặc sửa đúng bản ghi của bạn.
4. POST vật liệu với categoryId vừa tạo, name, grade, unit KG và các mô tả tùy chọn. Lấy materialId từ response 201. Vật liệu mới chưa có giá sẽ có CONTACT_FOR_QUOTE trên API giá công khai; phần tạo giá thuộc module kế tiếp.
5. PATCH `/material-categories/{id}/status` với `{"isActive":false}` rồi GET công khai `/api/materials?categoryId=...`: danh sách rỗng, trong khi GET admin vẫn có dữ liệu. Đổi isActive=true để hiện lại.
6. PATCH `/materials/{id}/status` với `{"accepted":false}` rồi GET `/api/prices/current?materialId=...`: không có vật liệu đó. accepted=true để nhận lại; chỉ công khai khi nhóm cũng đang hiện.
7. PUT gửi đầy đủ trường thông tin bắt buộc, kể cả categoryId/grade/unit của vật liệu. Trường mô tả tùy chọn bỏ qua hoặc null/trống sẽ được xóa nội dung. Không gửi isActive/accepted trong POST/PUT; chỉ dùng PATCH trạng thái cho hai cờ này.
8. 409: kiểm tra tên nhóm hoặc tổ hợp nhóm/tên/phân hạng (kể cả bản ghi ẩn). 403: kiểm tra đúng ADMIN và token CSRF cùng session. 400: kiểm tra JSON, giới hạn trường và URL. Không dùng DELETE để ẩn vì không có API xóa vật lý.

OpenAPI sao chép schema auth từ auth-openapi.json để import độc lập, mô tả mười API danh mục/vật liệu. Chưa đẩy workspace hay chạy collection bằng Postman CLI; khi CLI/MCP không khả dụng, xác minh bằng Maven/MockMvc và HTTP PowerShell.

<!-- source-end:doc-ecothugom-backend-docs-admin-catalog-md -->

<a id="doc-ecothugom-backend-docs-admin-prices-md"></a>
### ADMIN quản lý bảng giá thu mua

Nguồn trước khi gộp: `ecothugom-backend/docs/admin-prices.md`.

<!-- source-begin:doc-ecothugom-backend-docs-admin-prices-md -->
<a id="doc-ecothugom-backend-docs-admin-prices-md--admin-quản-lý-bảng-giá-thu-mua"></a>
#### ADMIN quản lý bảng giá thu mua

API dùng bảng `dbo.price_rules` hiện có. Không cần chạy lại schema. Import `admin-prices-openapi.json` vào Postman hoặc dùng `admin-prices.http`. Backend phải được khởi động lại sau build. Tài khoản SQL chạy ứng dụng cần SELECT/INSERT/UPDATE `price_rules`, SELECT/UPDATE `materials` để lấy khóa; quyền danh mục và xác thực vẫn như trước.

<a id="doc-ecothugom-backend-docs-admin-prices-md--endpoint"></a>
##### Endpoint

| Phương thức | Đường dẫn | Kết quả |
|---|---|---|
| GET | `/api/admin/price-rules?materialId=1&approvalStatus=DRAFT&page=0&size=20` | Tất cả phiên bản, lọc tùy chọn; id giảm dần |
| POST | `/api/admin/price-rules` | Tạo DRAFT, trả 201 |
| GET | `/api/admin/price-rules/{id}` | Chi tiết bất kỳ trạng thái |
| PUT | `/api/admin/price-rules/{id}` | Thay giá và khoảng hiệu lực của DRAFT |
| POST | `/api/admin/price-rules/{id}/approve` | DRAFT → APPROVED |
| POST | `/api/admin/price-rules/{id}/reject` | DRAFT → REJECTED |
| GET | `/api/admin/materials/{id}/price-rules?page=0&size=20` | Lịch sử gồm mọi trạng thái, versionNumber giảm dần |

Tất cả yêu cầu tài khoản ADMIN và cookie phiên. Lệnh ghi cần `X-CSRF-TOKEN` lấy từ GET `/api/auth/csrf` trong cùng phiên. GET không cần token CSRF. Sau đăng nhập lấy lại token trước khi ghi. Giữ cùng host `127.0.0.1` cho mọi request để Postman gửi cookie tự động.

Phân trang theo cấu trúc có sẵn `data/page/size/totalElements/totalPages`, page bắt đầu 0, size mặc định 20 và tối đa 100. Bộ lọc approvalStatus chỉ nhận DRAFT/APPROVED/REJECTED (phân biệt hoa thường). Vật liệu tồn tại nhưng chưa có giá: lịch sử rỗng; vật liệu không tồn tại: lịch sử 404. Danh sách lọc materialId không tồn tại trả trang rỗng.

<a id="doc-ecothugom-backend-docs-admin-prices-md--thử-trên-postman"></a>
##### Thử trên Postman

1. Đăng nhập ADMIN như trước, GET `/api/auth/me` xác nhận role=ADMIN. GET `/api/auth/csrf`, lưu token mới.
2. POST `/api/admin/price-rules`, Body → raw → JSON, header `X-CSRF-TOKEN` và Content-Type application/json:

```json
{
  "materialId": 1,
  "unitPrice": 3500,
  "validFrom": "2026-10-23T09:00:00+07:00",
  "validTo": null
}
```

3. Lưu `id` trả về. Trạng thái DRAFT, `versionNumber` tự tăng theo vật liệu. DRAFT chưa làm thay đổi GET `/api/prices/current?materialId=1`.
4. GET `/api/admin/price-rules/{id}` để lấy `draftRevision` của bản nháp đang xem. PUT gửi `unitPrice`, `validFrom`, `validTo` và `expectedRevision` bằng đúng `draftRevision` vừa đọc. Không gửi lại materialId. PUT bỏ/null validTo sẽ xóa mốc kết thúc.
5. GET chi tiết ngay trước khi duyệt/từ chối. POST `/{id}/approve` hoặc `/{id}/reject` với body `{"expectedRevision":"<draftRevision vừa đọc>"}`; không truyền người duyệt/thời điểm/trạng thái.
6. GET `/api/prices/current?materialId=1` và GET `/api/admin/materials/1/price-rules` để đối chiếu giá công khai và lịch sử.

Giá đã APPROVED hoặc REJECTED không được sửa hay duyệt/từ chối lại (409). Muốn điều chỉnh tạo DRAFT mới, kể cả khi bản trước bị từ chối. Không có DELETE. Không có cột lưu lý do/người từ chối trong schema hiện tại nên API từ chối chỉ lưu trạng thái, không nhận rejectionReason.

<a id="doc-ecothugom-backend-docs-admin-prices-md--giá-thời-gian-và-phiên-bản"></a>
##### Giá, thời gian và phiên bản

- unitPrice là nguyên VND trên một đơn vị vật liệu, từ 1 đến 999999999999999999. Không nhận số lẻ, 0 hoặc âm. Đơn vị KG và currency VND do backend trả theo mô hình hiện tại.
- validFrom bắt buộc có `Z` hoặc offset, validTo có thể null. Backend chuyển về UTC, bỏ phần dưới mili giây; validTo phải sau validFrom sau bước chuẩn hóa. Mốc UTC phải nằm trong năm 0001–9999 của SQL Server datetime2.
- Khoảng hiệu lực là `[validFrom, validTo)`. Có thể chuẩn bị lịch quá khứ/tương lai và giá cho vật liệu đang ngừng nhận/nhóm ẩn. Chúng vẫn bị lọc khỏi bảng giá công khai theo quy tắc sẵn có.
- Khi nhiều giá APPROVED cùng đang hiệu lực, phiên bản cao nhất được chọn. Phiên bản DRAFT/REJECTED/tương lai/hết hạn không che giá hợp lệ cũ. Không tự đóng validTo của bản cũ; khi bản cao hơn hết hạn, bản cũ còn hiệu lực có thể trở lại làm giá hiện hành.
- Mỗi bản mới lấy MAX(version_number)+1, kể cả các bản bị từ chối. Khóa vật liệu bảo vệ cấp số đồng thời; unique constraint SQL Server là lớp bảo vệ cuối. versionNumber là số phiên bản nghiệp vụ, không tăng khi sửa cùng một bản nháp.
- Sửa/duyệt/từ chối khóa bản giá trong transaction và so sánh `expectedRevision` với snapshot hiện tại trước khi ghi. Mã `draftRevision` là SHA-256 tính từ dữ liệu đã lưu, không cần thêm cột hay sửa schema. Nếu admin thứ hai sửa, duyệt hoặc từ chối sau khi trang này tải dữ liệu, yêu cầu cũ trả 409 và không ghi đè. Tải lại bản nháp rồi xem lại nội dung trước khi thử tiếp; không tự gửi lại thao tác.
- Cùng một mã revision chỉ cho phép một thao tác thay đổi. Duyệt/từ chối hoặc sửa thành công tạo mã mới; các phiên admin cũ sẽ bị từ chối. Lịch sử vẫn lưu các phiên bản nghiệp vụ và trạng thái cuối, không lưu từng lần gõ sửa bản nháp.
- createdBy/createdAt và approvedBy/approvedAt do backend gán. Tên/hạng/đơn vị vật liệu trong response là thông tin hiện tại của danh mục; đơn/báo giá dùng snapshot riêng theo luồng hiện có.
- Duyệt bản giá mới không sửa đơn, báo giá đã gửi/đã chấp thuận hay số tiền đã thanh toán. Đơn đặt mới/báo giá mới dùng giá hiện hành tại thời điểm tạo theo service chung.

<a id="doc-ecothugom-backend-docs-admin-prices-md--lỗi"></a>
##### Lỗi

400: thiếu/sai giá, thời gian, ID, revision hoặc phân trang, trường ngoài hợp đồng. 401: chưa đăng nhập/phiên hết hạn/tài khoản khóa. 403: sai vai trò hoặc thiếu/sai CSRF. 404: không tìm thấy bản giá/vật liệu yêu cầu. 409: revision đã cũ, bản giá không còn DRAFT, đạt giới hạn phiên bản, vi phạm ràng buộc hoặc tranh chấp khóa; dữ liệu không bị ghi nếu revision không khớp. Tải lại trước khi quyết định lại. 500: lỗi đọc/ghi dữ liệu, không trả nội dung SQL cho client. Phản hồi lỗi dùng application/problem+json theo backend hiện tại.

OpenAPI là hợp đồng cục bộ. Chưa push lên Postman workspace; import file không cần thay đổi workspace hay đồng bộ cả thư mục backend.

<!-- source-end:doc-ecothugom-backend-docs-admin-prices-md -->

<a id="doc-ecothugom-backend-docs-auth-api-md"></a>
### Xác thực và phân quyền

Nguồn trước khi gộp: `ecothugom-backend/docs/auth-api.md`.

<!-- source-begin:doc-ecothugom-backend-docs-auth-api-md -->
<a id="doc-ecothugom-backend-docs-auth-api-md--xác-thực-và-phân-quyền"></a>
#### Xác thực và phân quyền

Hợp đồng HTTP dùng cho công cụ: [auth-openapi.json](<ecothugom-backend/docs/auth-openapi.json>). Tài liệu này giải thích cách dùng hợp đồng; kiểm thử trong `AuthApiTests` xác minh hành vi thực tế. Request mẫu: [auth-api.http](<ecothugom-backend/docs/auth-api.http>). Có thể import OpenAPI vào Postman.

Triển khai dùng session phía máy chủ, cookie `HttpOnly`, CSRF cho mọi thao tác ghi. Đăng ký không tự đăng nhập. Số điện thoại đăng ký gồm 10 chữ số Việt Nam; email không bắt buộc. Mật khẩu 12–64 ký tự, tối đa 72 byte UTF-8. Thời gian lưu ở UTC.

| Method | API | Quyền | Kết quả |
|---|---|---|---|
| GET | `/api/auth/csrf` | Công khai | 200 `{headerName,token}` |
| POST | `/api/auth/register` | Công khai + CSRF | 201, tạo CUSTOMER |
| POST | `/api/auth/login` | Công khai + CSRF | 200, tạo phiên đăng nhập |
| GET | `/api/auth/me` | Đã đăng nhập | 200, thông tin tài khoản |
| POST | `/api/auth/logout` | CSRF | 204, hủy phiên |
| GET | `/api/admin/users` | ADMIN | 200, danh sách phân trang |
| POST | `/api/admin/collectors` | ADMIN + CSRF | 201, tạo COLLECTOR |
| PATCH | `/api/admin/users/{id}/status` | ADMIN + CSRF | 200, đổi ACTIVE/LOCKED; không đổi tài khoản ADMIN |
| GET | `/api/customer/orders` | CUSTOMER | Chỉ đơn của chính khách hàng |
| GET | `/api/collector/orders` | COLLECTOR | Chỉ đơn được giao cho nhân viên |

Đăng ký/tạo nhân viên nhận `{fullName,phone,email,password}`. Đăng nhập nhận `{identifier,password}`; identifier là số điện thoại hoặc email. Đổi trạng thái nhận `{status:"LOCKED"}` hoặc ACTIVE. Không nhận role/status trong đăng ký. User trả về `{id,fullName,phone,email,role,status}`, không bao giờ trả password/hash. Các API danh mục và bảng giá vẫn công khai.

Lỗi dạng Problem Detail: 400 dữ liệu sai/field không hỗ trợ, 401 chưa đăng nhập hoặc thông tin đăng nhập sai/tài khoản bị khóa, 403 thiếu CSRF/sai vai trò, 404 tài khoản không tồn tại, 409 trùng thông tin hoặc thao tác không hợp lệ, 429 vượt giới hạn. Login dùng cùng thông báo cho sai mật khẩu, không tồn tại và bị khóa. Các trang dùng `page=0&size=20`, size 1–100.

Trình duyệt giữ cookie; gọi GET csrf trước POST và gửi header do API trả về. Lấy CSRF mới sau login/logout vì token cũ bị vô hiệu hóa. Phiên được kiểm tra trạng thái tài khoản mỗi request; khóa tài khoản vô hiệu hóa quyền ở request tiếp theo.

<a id="doc-ecothugom-backend-docs-auth-api-md--tạo-quản-trị-viên-ban-đầu"></a>
##### Tạo quản trị viên ban đầu

Tại thư mục backend, dừng phiên backend cũ bằng Ctrl+C rồi chạy:

```powershell
.\scripts\create-initial-admin.ps1
```

Nhập họ tên, **số điện thoại mới**, email tùy chọn và mật khẩu hai lần. Số điện thoại phải đủ 10 số, bắt đầu bằng **03, 05, 07, 08 hoặc 09**; đầu 01 không hợp lệ theo quy tắc của hệ thống. Mật khẩu **12–64 ký tự**, tối đa **72 byte UTF-8**. Script kiểm tra họ tên, số điện thoại và mật khẩu trước khi khởi động backend; nếu báo sai, chạy lại và sửa trường được nêu trong thông báo.

Script khởi động backend và chỉ tạo admin nếu số điện thoại chưa tồn tại; không đổi mật khẩu, không nâng quyền tài khoản đã có. Mật khẩu nhập ẩn, truyền qua môi trường tiến trình, không ghi file hoặc đưa lên URL/command line. Sau lần này có thể chạy bình thường bằng `scripts/start-local.ps1`.

Các tài khoản DEMO trong seed dùng hash ngẫu nhiên không có mật khẩu được công bố. Không dùng chúng để đăng nhập và không sửa hash thủ công. Không có API công khai để tự tạo ADMIN. Nếu số điện thoại đã thuộc admin, bootstrap giữ nguyên tài khoản và mật khẩu cũ.

<a id="doc-ecothugom-backend-docs-auth-api-md--ví-dụ-gọi-bằng-powershell"></a>
##### Ví dụ gọi bằng PowerShell

```powershell
$baseUrl = 'http://127.0.0.1:8080'
$csrf = Invoke-RestMethod "$baseUrl/api/auth/csrf" -SessionVariable loginSession
$secret = Read-Host 'Mat khau' -AsSecureString
$credential = [pscredential]::new('local', $secret)
$body = @{ identifier = (Read-Host 'So dien thoai hoac email'); password = $credential.GetNetworkCredential().Password } | ConvertTo-Json
$user = Invoke-RestMethod "$baseUrl/api/auth/login" -Method Post -WebSession $loginSession -ContentType 'application/json' -Headers @{ $csrf.headerName = $csrf.token } -Body $body
$body = $null
$credential = $null
$user
# Login thay token; lấy mới trước thao tác ghi tiếp theo.
$csrf = Invoke-RestMethod "$baseUrl/api/auth/csrf" -WebSession $loginSession
Invoke-RestMethod "$baseUrl/api/auth/me" -WebSession $loginSession
Invoke-RestMethod "$baseUrl/api/auth/logout" -Method Post -WebSession $loginSession -Headers @{ $csrf.headerName = $csrf.token }
```

<a id="doc-ecothugom-backend-docs-auth-api-md--tích-hợp-react"></a>
##### Tích hợp React

Trong phát triển dùng Vite proxy `/api` tới `http://127.0.0.1:8080`; React gọi đường dẫn tương đối. Cookie và CSRF cùng origin, không cần mở CORS. Khi triển khai dùng reverse proxy cùng origin và HTTPS. Profile `windows` cho phép cookie trên HTTP localhost; profile khác mặc định `Secure=true`.

```js
const token = await fetch('/api/auth/csrf', { credentials: 'include' }).then(r => r.json());
const response = await fetch('/api/auth/login', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json', [token.headerName]: token.token },
  body: JSON.stringify({ identifier, password }),
});
if (!response.ok) throw await response.json();
const user = await response.json();
// Lấy token CSRF mới sau login; không lưu password/cookie trong localStorage.
```

Session lưu trong RAM, hết hạn sau 30 phút không hoạt động và mất khi restart backend. Bộ giới hạn đăng nhập cũng lưu trong RAM: 10 request login và 5 register/15 phút/IP; trả 429 và `Retry-After`. Mô hình này phù hợp một backend của đồ án. Bản nhiều máy chủ cần kho session và rate limit dùng chung. Chưa bao gồm quên mật khẩu, xác minh email hoặc MFA.

Không cần chạy lại script tạo database. JPA chỉ `validate` schema `dbo.users` đang có; quyền SQL cần SELECT, INSERT, UPDATE bảng users và SELECT collection_orders.

<a id="doc-ecothugom-backend-docs-auth-api-md--kết-quả-kiểm-tra-ngày-23102026"></a>
##### Kết quả kiểm tra ngày 23/10/2026

- 45 kiểm thử JUnit/MockMvc đạt, 0 thất bại, 0 lỗi; gồm 28 kiểm thử danh mục/giá sẵn có và 17 kiểm thử xác thực mới. Chạy bằng Maven Wrapper trong bước `verify`.
- Đóng gói JAR thành công bằng `.\mvnw.cmd -B -ntp -DskipTests package` sau khi bộ kiểm thử trên đã đạt.
- JAR cuối chạy với SQL Server `EcoThuGomDB` trên cổng thử 18080: đạt 23 kiểm tra HTTP cho đăng ký, đăng nhập ba vai trò, cookie, CSRF, quyền truy cập, khóa phiên, đăng xuất và bảng giá công khai.
- Tài khoản và mật khẩu thử được tạo ngẫu nhiên, không công bố; đã xóa đúng ba tài khoản thử và dừng JVM thử. Không thay mật khẩu tài khoản DEMO.
- File OpenAPI đã parse JSON và kiểm tra các tham chiếu schema nội bộ. Không sử dụng mock để kết luận SQL Server hoạt động.

<!-- source-end:doc-ecothugom-backend-docs-auth-api-md -->

<a id="doc-ecothugom-backend-docs-backend-completion-md"></a>
### Hoàn thiện tám nhóm API của đồ án EcoThuGom

Nguồn trước khi gộp: `ecothugom-backend/docs/backend-completion.md`.

<!-- source-begin:doc-ecothugom-backend-docs-backend-completion-md -->
<a id="doc-ecothugom-backend-docs-backend-completion-md--hoàn-thiện-tám-nhóm-api-của-đồ-án-ecothugom"></a>
#### Hoàn thiện tám nhóm API của đồ án EcoThuGom

Backend cho **một đại lý**, Spring Boot + SQL Server; thanh toán mô phỏng. Các nhóm trong bảng yêu cầu đã có mã triển khai. Kết quả kiểm thử tổng hợp được ghi riêng sau khi chạy xong ở `backend-completion-verification.md`.

| Nhóm | API chính | Hành vi |
|---|---|---|
| Danh mục, vật liệu | `/api/admin/material-categories`, `/api/admin/materials` | Thêm/sửa/ẩn/ngừng nhận; giữ dữ liệu giao dịch cũ |
| Bảng giá | `/api/admin/price-rules`, `/api/admin/materials/{id}/price-rules` | DRAFT → APPROVED/REJECTED, lịch sử phiên bản; giá đã xử lý bất biến |
| Hồ sơ, địa chỉ | `/api/auth/profile`, `/api/auth/password`, `/api/customer/addresses` | Hồ sơ riêng, đổi mật khẩu thu hồi phiên; địa chỉ mặc định và booking bằng addressId |
| Hủy, đổi lịch | `/api/customer/orders/{id}/cancel`, `/reschedule`, `/change-requests`; `/api/admin/order-change-requests`, `/orders/{id}/reassign` | **Mọi hủy cần ADMIN duyệt**, đổi lịch/phân công có kiểm tra trạng thái và lịch trùng |
| Lịch sử, biên nhận | `/api/{customer|collector|admin}/orders/{id}/timeline`, `/receipt` | Timeline phân trang; biên nhận lấy quote/payment và đúng phiếu cân đã chốt |
| Ảnh minh chứng | `/api/customer/orders/{id}/items/{itemId}/photo`, `/api/collector/orders/{id}/weighings/{weighingId}/photo`, `/api/evidence/{name}` | Lưu tại backend, chỉ người có quyền với đơn được xem |
| Khiếu nại | `/api/customer/orders/{id}/disputes`, `/api/admin/disputes` | OPEN → IN_REVIEW → RESOLVED/REJECTED; phục hồi trạng thái trước tranh chấp |
| Thống kê | `/api/admin/reports/overview`, `/materials`, `/collectors` | Tổng đơn, tỉ lệ hoàn tất, tiền đã chi và cân snapshot, lọc theo kỳ |

<a id="doc-ecothugom-backend-docs-backend-completion-md--dùng-postman"></a>
##### Dùng Postman

Import `docs/backend-completion-openapi.json`. File có 60 thao tác gồm các nhóm bổ sung, quản trị danh mục/giá, auth cơ bản và đặt lịch. Luồng xác nhận/phân công/di chuyển/cân/báo giá/thanh toán trước đây vẫn được mô tả trong các OpenAPI chuyên biệt đã có; file này không thay thế mọi tài liệu cũ.

Đăng nhập như trước, giữ cookie JSESSIONID và cùng host `http://127.0.0.1:8080`. Sau login, GET `/api/auth/csrf` rồi gửi token qua `X-CSRF-TOKEN` cho mọi lệnh ghi, kể cả multipart/DELETE. GET không cần CSRF. Tài khoản khóa, phiên hết hạn hoặc đổi mật khẩu phải đăng nhập lại. Không ghi mật khẩu/token thật vào file JSON, script hoặc Git. Spec chỉ đăng ký cục bộ trong `.postman/resources.yaml`, chưa push lên cloud.

Các GET danh sách mới dùng PageResponse `data/page/size/totalElements/totalPages`, page bắt đầu 0, size mặc định 20 và tối đa 100. Khi nhận 409, tải lại đơn/yêu cầu rồi kiểm tra trạng thái và version trước khi gửi thao tác mới. Không sửa version tùy ý để bỏ qua xung đột.

<a id="doc-ecothugom-backend-docs-backend-completion-md--hủy-đổi-lịch-và-phân-công-lại"></a>
##### Hủy, đổi lịch và phân công lại

Theo xác nhận của người dùng: **khách không tự hủy đơn trực tiếp**. POST `/api/customer/orders/{id}/cancel` với `{ "version": 2, "reason": "Lý do xin hủy" }` tạo yêu cầu CANCEL/PENDING (201), đơn vẫn ở trạng thái hiện tại; orderVersion tăng để bảo vệ thao tác đồng thời. Đây là yêu cầu gửi đến admin trong hệ thống; không tự gửi SMS/email hoặc gọi điện bên ngoài.

ADMIN GET `/api/admin/order-change-requests?status=PENDING`, đọc request và thông tin đơn rồi POST `/{requestId}/approve` hoặc `/reject`:

```json
{ "version": 3, "requestVersion": 0, "responseNote": "Đã trao đổi với khách" }
```

version là phiên bản **đơn hiện tại**, requestVersion là phiên bản **yêu cầu**. Chỉ duyệt mới chuyển CANCELLED và lưu cancelledAt/reason. Từ chối giữ trạng thái đơn; kết quả và actor/time được lưu. Khách xem GET `/api/customer/orders/{id}/change-requests` hoặc POST `/{requestId}/withdraw` với cùng hai version để rút yêu cầu. Tối đa một yêu cầu PENDING mỗi đơn; muốn thay yêu cầu hãy rút yêu cầu cũ trước.

Trước EN_ROUTE (PENDING/CONFIRMED/ASSIGNED), khách có thể POST `/reschedule`:

```json
{
  "version": 2,
  "reason": "Đổi giờ nhận hàng",
  "pickupStart": "2026-10-25T09:00:00+07:00",
  "pickupEnd": "2026-10-25T10:00:00+07:00"
}
```

Khung giờ phải tương lai, kết thúc sau bắt đầu. Nếu đã có collector, backend khóa nhân viên và kiểm tra trùng; hai khung sát nhau được phép. Thao tác đổi lịch trực tiếp thu hồi yêu cầu đang chờ của đơn để admin không xử lý một yêu cầu cũ.

Khi đã EN_ROUTE, khách gửi POST `/change-requests` gồm version, requestType=RESCHEDULE, reason và hai mốc giờ. Duyệt reschedule ở EN_ROUTE đưa đơn về CONFIRMED, bỏ collector để điều phối lại. Từ ARRIVED không đổi lịch vì đã bắt đầu nghiệp vụ cân, nhưng còn có thể xin hủy để admin xem xét đến AWAITING_PAYMENT. Đơn COMPLETED/CANCELLED/DISPUTED không tạo yêu cầu thay đổi; đơn hoàn tất đi qua khiếu nại, tiền đã thanh toán không bị hủy tự động. Nếu nhân viên tiếp tục xử lý trong lúc yêu cầu chờ, admin phải đọc version và trạng thái mới trước khi quyết định.

Phân công lại: POST `/api/admin/orders/{id}/reassign` với `{ "version": 2, "collectorId": 13, "reason": "Đổi nhân viên" }`. Chỉ ASSIGNED, người mới phải khác người cũ, active và không trùng lịch. Nhân viên cũ mất quyền đọc đơn/ảnh sau khi chuyển giao. Audit lưu cả collector cũ và mới. Không có API PATCH status tự do.

<a id="doc-ecothugom-backend-docs-backend-completion-md--lịch-sử-và-biên-nhận"></a>
##### Lịch sử và biên nhận

GET timeline của đúng vai trò, sắp log ID tăng dần. Event gồm trạng thái, actor ID/tên hiện tại, collector cũ/mới, lý do và giờ UTC. GET receipt chỉ có khi tồn tại payment COMPLETED (nếu chưa có trả 409), gồm order, quote đã thanh toán, payment và các phiếu cân chính xác mà quote tham chiếu. Giá/tên/hạng/khối lượng/thành tiền trong quote là snapshot, không lấy lại từ danh mục hay cân mới nhất. Biên nhận vẫn đọc được trong khi khiếu nại sau hoàn tất.

Khách/admin còn có GET `/api/customer/orders/{id}/weighings`, `/api/admin/orders/{id}/weighings`; collector giữ endpoint cân cũ. Chỉ đúng chủ/collector đang được giao/admin được xem; ID ngoài phạm vi trả 404.

<a id="doc-ecothugom-backend-docs-backend-completion-md--ảnh-minh-chứng"></a>
##### Ảnh minh chứng

Trong Postman chọn Body → form-data, trường `file` đổi Type thành File, trường `version` là Text chứa số phiên bản đơn. Không dùng raw JSON cho upload. Backend trả 201 với url, mediaType và orderVersion mới; dùng version mới khi gọi bước kế tiếp.

- Ảnh JPEG/PNG thực tối đa **5 MiB**, mỗi chiều tối đa 8192, tổng tối đa 16 triệu pixel. Backend đọc header/giải mã rồi mã hóa lại; không tin tên file/MIME của client và không lưu metadata ảnh gốc. File giả/ảnh sai trả 400, quá dung lượng trả 413.
- Ảnh vật liệu: customer sở hữu đơn, trước khởi hành. Ảnh cân: collector được giao, ARRIVED, lần cân mới nhất và chưa được quote tham chiếu. Mỗi slot chỉ nhận một ảnh; không ghi đè lịch sử. Muốn ảnh cân mới sau báo giá, tạo phiếu điều chỉnh mới có lý do trước.
- URL dạng `/api/evidence/{uuid}.png` hoặc `.jpg`; GET cần cookie và quyền với đơn. Biết URL vẫn không đọc được ảnh của người khác. Không có thư mục static công khai.
- Cấu hình `EVIDENCE_DIRECTORY`, mặc định `.local/evidence` dưới thư mục chạy backend. Khi chạy production/demo hãy chọn thư mục dữ liệu bền vững và sao lưu cùng DB. File mới được dọn nếu transaction DB rollback; không xóa ảnh khi đọc/báo giá. Không lưu byte ảnh trong SQL Server và không dùng dịch vụ ngoài.

<a id="doc-ecothugom-backend-docs-backend-completion-md--khiếu-nại"></a>
##### Khiếu nại

Khách POST `/api/customer/orders/{id}/disputes` với version, reason (tối đa 1000), evidenceUrl tùy chọn. evidenceUrl phải là ảnh của đúng đơn đã upload bằng API, không nhận URL ngoài. Mở từ EN_ROUTE/ARRIVED/AWAITING_SELLER_APPROVAL/AWAITING_PAYMENT/COMPLETED/CANCELLED; một khiếu nại đang xử lý mỗi đơn. Backend lưu previousOrderStatus, chuyển đơn DISPUTED và ghi audit.

Admin GET `/api/admin/disputes?status=OPEN`, GET `/{id}`, POST `/{id}/review` với `{ "version": 9 }`. Sau đó POST `/resolve` hoặc `/reject` với `{ "version": 10, "resolution": "Kết luận xử lý" }` (tối đa 1000). Có thể kết luận trực tiếp từ OPEN; trạng thái kết luận bất biến. Kết luận phục hồi previousOrderStatus; không sửa payment, completedAt hoặc giá chốt. Đây là xử lý nghiệp vụ đồ án, không có hoàn tiền/ngân hàng thật. Đơn tranh chấp đang thực hiện vẫn giữ chỗ lịch nhân viên; tranh chấp từ COMPLETED/CANCELLED không chiếm lại lịch.

<a id="doc-ecothugom-backend-docs-backend-completion-md--thống-kê-quản-trị"></a>
##### Thống kê quản trị

Chỉ ADMIN, GET với from/to kiểu YYYY-MM-DD theo **Asia/Ho_Chi_Minh**. `from` bao gồm, `to` không bao gồm; mặc định tháng hiện tại, cửa sổ 1–366 ngày. Ví dụ `?from=2026-10-01&to=2026-11-01`. Backend đổi mốc sang UTC trước query, không phụ thuộc timezone máy.

Overview trả kỳ đo, currency VND, weightUnit KG, totalOrders, completedOrders, completionRatePercent, ordersByStatus, paidOrders, totalPaidAmount và totalWeight. Nhóm số đơn/tỉ lệ dùng các đơn **tạo trong kỳ**; completedOrders dựa completedAt. Tiền/khối lượng dùng các payment COMPLETED **đã trả trong kỳ**. Hai mốc đo khác nhau được nêu rõ để tránh hiểu nhầm. Tiền là tiền đại lý đã chi thu mua, không phải doanh thu bán hàng.

GET `/materials` có thêm materialId; `/collectors` có collectorId; đều có page/size. Vật liệu lấy actualQty/lineTotal và tên/hạng/đơn vị snapshot từ quote đã thanh toán; các tên/hạng lịch sử khác nhau có thể thành các nhóm riêng cho cùng materialId. Collector lấy payments.recordedBy và tên hiện tại. Không cộng các lần cân sửa hoặc nhân tiền theo số item. Đơn đã trả tiền rồi DISPUTED vẫn được tính số tiền thực tế đã ghi nhận.

<a id="doc-ecothugom-backend-docs-backend-completion-md--vận-hành"></a>
##### Vận hành

Không cần chạy lại schema production và không thêm dependency. Tài khoản SQL cần quyền đọc các bảng liên quan, SELECT/INSERT/UPDATE order_change_requests/disputes, SELECT/INSERT/UPDATE/DELETE addresses, UPDATE collection_items/weighing_records cho URL ảnh, và các quyền auth/đơn/quote/payment hiện có. H2 fixture đã bổ sung cột/bảng tương ứng để kiểm thử độc lập, không khởi tạo SQL Server tự động.

Build/test: `.\mvnw.cmd -B -ntp verify`. Khởi động: `.\scripts\start-local.ps1` sau khi dừng phiên backend cũ. Tài liệu hồ sơ/địa chỉ chi tiết: profile-addresses.md; catalog: admin-catalog.md; bảng giá: admin-prices.md. Chạy lại generator hợp đồng nếu cần bằng Python tiêu chuẩn: `python scripts/generate-completion-openapi.py`.

<!-- source-end:doc-ecothugom-backend-docs-backend-completion-md -->

<a id="doc-ecothugom-backend-docs-collection-orders-md"></a>
### Đặt lịch thu gom của khách hàng

Nguồn trước khi gộp: `ecothugom-backend/docs/collection-orders.md`.

<!-- source-begin:doc-ecothugom-backend-docs-collection-orders-md -->
<a id="doc-ecothugom-backend-docs-collection-orders-md--đặt-lịch-thu-gom-của-khách-hàng"></a>
#### Đặt lịch thu gom của khách hàng

Hợp đồng HTTP: `collection-orders-openapi.json`; request mẫu: `collection-orders.http`.

<a id="doc-ecothugom-backend-docs-collection-orders-md--phạm-vi-và-quy-tắc"></a>
##### Phạm vi và quy tắc

- `POST /api/customer/orders`: CUSTOMER đang ACTIVE, có session và CSRF; tạo đơn `PENDING`, chưa phân công nhân viên. Trả `201`, `Location: /api/customer/orders/{id}` và chi tiết đơn.
- `GET /api/customer/orders/{id}`: chỉ khách sở hữu đơn được xem; đơn không tồn tại hoặc thuộc khách khác đều trả `404`. ADMIN và COLLECTOR không dùng route khách hàng.
- `GET /api/customer/orders?page=0&size=20`: giữ hợp đồng danh sách hiện có.
- Khách nhập `pickupAddress` trực tiếp để tài khoản mới có thể đặt lịch. Lưu contact/address snapshot trong đơn, `source_address_id=NULL`; không tự tạo địa chỉ trong danh bạ. Quản lý địa chỉ lưu sẵn là bước riêng.
- Không nhận `sellerUserId`, `collectorId`, `status`, giá hoặc số tiền từ client. Chủ đơn lấy từ session; code do server tạo. Các field ngoài hợp đồng trả `400`.
- Thời gian đầu vào bắt buộc có offset (`+07:00` hoặc `Z`); chuẩn hóa UTC, chính xác millisecond. Bắt đầu phải ở tương lai, kết thúc phải sau bắt đầu; thời gian UTC phải nằm trong năm 1–9999. Chi tiết đơn trả UTC với `Z`; danh sách cũ giữ định dạng UTC không hậu tố hiện có.
- 1–50 loại vật liệu khác nhau; chỉ vật liệu đang thu mua thuộc nhóm đang hoạt động. `estimatedQty` có thể null khi khách chưa biết; nếu có phải > 0, tối đa 9 số nguyên và 3 số thập phân.
- Chụp giá APPROVED hiện hành tại thời điểm tạo bằng cùng quy tắc của API bảng giá: `validFrom <= now < validTo`, lấy version cao nhất. Không có giá vẫn nhận lịch, dùng `CONTACT_FOR_QUOTE`, lưu giá và rule ID là null.
- Thành tiền mỗi dòng = `ROUND(estimatedQty * estimatedUnitPrice, 0)` VND (HALF_UP, theo computed column SQL Server). `estimatedTotal` là null nếu có dòng chưa biết lượng/giá. Các số tiền dòng phải vừa DECIMAL(18,0).
- Một transaction lưu đơn, tất cả vật liệu và log `NULL -> PENDING` với `changed_by` là khách đăng nhập. Nếu bất kỳ bước nào thất bại, không lưu đơn dở dang.
- Đây là ước tính, chưa có cân thực tế, báo giá chốt hoặc thanh toán. Mỗi POST thành công tạo một đơn mới; chưa có cam kết idempotency, tránh bấm gửi nhiều lần khi chưa biết kết quả.

<a id="doc-ecothugom-backend-docs-collection-orders-md--request-tạo-lịch"></a>
##### Request tạo lịch

```json
{
  "pickupAddress": {
    "contactName": "Khách hàng thử",
    "contactPhone": "0934567890",
    "addressLine": "12 Đường mô phỏng",
    "ward": "Phường thử",
    "district": null,
    "province": "TP Hồ Chí Minh"
  },
  "pickupStart": "2026-10-25T09:00:00+07:00",
  "pickupEnd": "2026-10-25T10:00:00+07:00",
  "sellerNote": "Gọi trước khi đến",
  "items": [
    {"materialId": 1, "estimatedQty": 10.5, "note": "Giấy đã gom riêng"}
  ]
}
```

Ngày giờ và materialId trong ví dụ cần thay theo thời điểm gửi và `GET /api/materials`. Tên liên hệ <=100 ký tự, phone 10 số đầu 03/05/07/08/09, addressLine <=300, ward/district/province <=100; ward/district tùy chọn. Chuỗi địa chỉ ghép phải <=600 ký tự. sellerNote <=1000, note mỗi dòng <=500.

<a id="doc-ecothugom-backend-docs-collection-orders-md--lỗi-và-bảo-mật"></a>
##### Lỗi và bảo mật

400: JSON/field không hợp lệ, thời gian sai, vật liệu không khả dụng/trùng hoặc số lượng không hợp lệ. 401: chưa đăng nhập/session đã mất/khóa tài khoản. 403: CSRF sai hoặc sai vai trò. 404: không tìm thấy đơn của khách. Lỗi dùng Problem Detail, không đưa địa chỉ, contact, mật khẩu hoặc SQL vào thông báo lỗi.

<a id="doc-ecothugom-backend-docs-collection-orders-md--triển-khai-và-kiểm-thử"></a>
##### Triển khai và kiểm thử

Giữ Spring MVC, JdbcTemplate cho nghiệp vụ orders, service có transaction, DTO thay vì Entity. Tái sử dụng service bảng giá và Clock UTC. Không thêm dependency, không đổi schema SQL Server; cấu hình JPA vẫn validate và SQL init vẫn never.

Jackson từ chối số thập phân ở field số nguyên (`accept-float-as-int=false`) để materialId 1.5 không bị cắt thành 1. Các field ngoài hợp đồng tiếp tục bị từ chối theo cấu hình hiện có.

<a id="doc-ecothugom-backend-docs-collection-orders-md--thử-trên-postman"></a>
##### Thử trên Postman

1. Dừng backend cũ bằng Ctrl+C và chạy lại `.\scripts\start-local.ps1` để nạp API mới.
2. Import `docs/collection-orders-openapi.json` vào Postman. Giữ cùng host `http://127.0.0.1:8080` cho mọi request.
3. Đăng nhập CUSTOMER bằng luồng trong `auth-api.md`, gọi `GET /api/auth/me` để kiểm tra role.
4. Gọi `GET /api/materials` hoặc `/api/prices/current` để chọn materialId thực; không dùng ID ví dụ nếu database khác.
5. Gọi `GET /api/auth/csrf` sau login. POST `/api/customer/orders` dùng raw JSON, Content-Type application/json và header X-CSRF-TOKEN bằng token vừa nhận; Postman giữ JSESSIONID tự động.
6. Sửa giờ hẹn thành tương lai; với giờ Việt Nam gửi hậu tố `+07:00`. Ví dụ 09:00+07:00 sẽ được lưu/trả là 02:00Z, cùng một thời điểm.
7. Kết quả thành công `201`, status PENDING, collectorId null. Dùng id trong phản hồi để GET `/api/customer/orders/{id}` và GET danh sách đơn. Không gửi lại POST nếu chỉ muốn đọc kết quả cũ.
8. Đăng nhập một CUSTOMER khác: GET đơn trước phải 404. ADMIN/COLLECTOR gọi route đặt lịch phải 403. Tài khoản mới đặt đơn chưa phân công nên danh sách của nhân viên vẫn rỗng.

Chạy tập trung: `.\mvnw.cmd -B -ntp -Dtest=CollectionOrderApiTests test`.
Chạy đầy đủ/đóng gói: `.\mvnw.cmd -B -ntp verify`.
Chạy dev: `.\scripts\start-local.ps1`.

Tiêu chí hoàn thành: tạo đúng snapshot/giá/log; đọc lại từ SQL; chỉ chủ đơn được xem; xác thực+CSRF+vai trò được kiểm tra; lỗi không lưu dữ liệu dở dang; kiểm thử thời gian, giá thiếu, lượng thiếu, số thập phân, field giả mạo và rollback; có hướng dẫn Postman và kiểm tra SQL Server thực tế nếu kết nối được.

<a id="doc-ecothugom-backend-docs-collection-orders-md--kết-quả-xác-minh-23102026"></a>
##### Kết quả xác minh 23/10/2026

- Maven `verify`: 66 kiểm thử đạt, 0 thất bại/lỗi/bỏ qua; gồm 21 kiểm thử đặt lịch và 45 kiểm thử sẵn có. JAR đóng gói thành công.
- Kiểm thử có rollback thực trên H2: ép thao tác ghi audit thất bại, xác nhận không còn đơn hoặc item dở dang.
- JAR chạy trên cổng thử 18080 với SQL Server thật: 23 kiểm tra HTTP đạt; gồm đăng ký/đăng nhập, CSRF, đặt lịch, Unicode, giờ UTC, computed amount, đọc lại, chống xem đơn người khác, vật liệu lỗi/trùng, quantity/price null và đăng xuất. Đối chiếu số đơn/item/log trực tiếp trong SQL đạt.
- Tài khoản thử có marker ngẫu nhiên, mật khẩu ngẫu nhiên chỉ nằm trong RAM; đã dọn đúng 2 tài khoản và các đơn/log/item thử, dừng tiến trình thử. Backend cổng 8080 cần khởi động lại để nạp mã mới.
- OpenAPI parse JSON và kiểm tra được toàn bộ tham chiếu schema nội bộ. Chưa có frontend hoặc nghiệp vụ xác nhận/phân công trong phần việc này.

<!-- source-end:doc-ecothugom-backend-docs-collection-orders-md -->

<a id="doc-ecothugom-backend-docs-collection-workflow-md"></a>
### Di chuyển, cân thực tế và khách duyệt báo giá

Nguồn trước khi gộp: `ecothugom-backend/docs/collection-workflow.md`.

<!-- source-begin:doc-ecothugom-backend-docs-collection-workflow-md -->
<a id="doc-ecothugom-backend-docs-collection-workflow-md--di-chuyển-cân-thực-tế-và-khách-duyệt-báo-giá"></a>
#### Di chuyển, cân thực tế và khách duyệt báo giá

Contract bổ sung cho backend một đại lý, trên schema hiện có. Cookie session và CSRF giống auth-api.md. Mọi POST bắt buộc X-CSRF-TOKEN mới sau login. Các version là số nguyên 0..2147483646.

<a id="doc-ecothugom-backend-docs-collection-workflow-md--1-di-chuyển"></a>
##### 1. Di chuyển

POST `/api/collector/orders/{id}/start-trip` với `{version,reason?}`: ASSIGNED -> EN_ROUTE.
POST `/api/collector/orders/{id}/arrive` cùng body: EN_ROUTE -> ARRIVED.
Chỉ nhân viên được giao đơn. Trả Order 200, tăng version 1, giữ nguyên collector và ghi audit. Sai role/CSRF 403; không đăng nhập 401; không được giao/không tồn tại 404; sai thứ tự/version cũ 409; body sai 400. Không giới hạn theo giờ hẹn ở hai thao tác này.

<a id="doc-ecothugom-backend-docs-collection-workflow-md--2-cân-và-gửi-báo-giá"></a>
##### 2. Cân và gửi báo giá

POST `/api/collector/orders/{id}/weighings`: `{version,items:[{itemId,grossWeight,tareWeight,correctionOf?,correctionReason?}]}`. Một lần tối đa 50 item khác nhau thuộc đơn; chỉ ARRIVED. Khối lượng KG, tối đa 9 số nguyên/3 số lẻ; gross > tare >= 0. Lần đầu không có correction; sửa phải chỉ rõ phiếu mới nhất và lý do (tối đa 500 ký tự), tạo bản ghi mới. Tăng version đơn một lần cho cả lô. Trả 201 WeighingResult gồm orderId, orderVersion và toàn bộ lịch sử cân. GET cùng URL cho nhân viên được giao trả cùng dạng (200).

POST `/api/collector/orders/{id}/quotes`: `{version}`. Chỉ ARRIVED. Mọi item phải có cân net > 0 và giá APPROVED còn hiệu lực ở thời điểm gửi. Giá không có/không còn thu mua trả 409, không tự dùng giá ước tính cũ. Server lấy phiếu cân mới nhất, chụp tên/grade/unit/giá/quy tắc giá và tính từng dòng ROUND_HALF_UP(net*price,0), tổng cộng các dòng VND. Thời hạn cố định 24 giờ. Tạo SENT/is_current, tăng version_number báo giá, đơn -> AWAITING_SELLER_APPROVAL và version+1. Trả 201 Quote. Không hỗ trợ đơn giá tùy ý vì composite FK yêu cầu giá trùng quy tắc giá. Không sửa cân hoặc gửi thêm báo giá khi đang chờ khách phản hồi; khách từ chối hoặc báo giá hết hạn mới cho thay thế (báo giá hết hạn dùng API gửi lại, version đơn hiện tại).

<a id="doc-ecothugom-backend-docs-collection-workflow-md--3-khách-duyệt"></a>
##### 3. Khách duyệt

GET `/api/{customer|collector|admin}/orders/{id}/quotes`: danh sách báo giá theo version_number giảm dần (tối đa 100 gần nhất), đầy đủ item và phản hồi. Khách chỉ đơn của mình, collector chỉ đơn được giao; admin đọc mọi đơn. Không có báo giá trả [].
POST `/api/customer/orders/{id}/quotes/{quoteId}/accept` hoặc `/reject`: `{version,quoteVersion,responseNote?}`. version là version đơn; quoteVersion là version của bản ghi báo giá (khác versionNumber). Chỉ chủ đơn, trạng thái AWAITING_SELLER_APPROVAL, báo giá SENT hiện hành, chưa hết hạn (now < validUntil), version chính xác. Accept -> quote ACCEPTED, đơn AWAITING_PAYMENT; reject -> quote REJECTED, đơn ARRIVED. responseNote tối đa 500 ký tự. Tăng version đơn và version báo giá, ghi actor/thời gian phản hồi và audit trong một transaction. Trả 200 Quote với orderVersion mới. Báo giá đã ACCEPTED khóa quy trình cân/gửi lại; thanh toán ngoài phạm vi.

POST thay đổi dữ liệu và audit cùng transaction. CAS version đơn trước khi ghi cân/báo giá/phản hồi để serialize mọi thao tác trên một đơn; lỗi sau đó rollback toàn bộ. Không lộ dữ liệu đơn khác trong lỗi. Lịch sử cân và báo giá được giữ nguyên.

GET cân và GET báo giá giữ khóa đọc trên đơn trong transaction REPEATABLE_READ để orderVersion và các bản ghi con nhất quán khi có request ghi đồng thời. Các thao tác ghi vẫn dùng CAS/version; không đổi mức cô lập của toàn ứng dụng.

Đối với dữ liệu cũ có valid_until NULL, báo giá không có hạn hết hiệu lực; báo giá tạo qua API mới luôn có hạn 24 giờ. responseNote, correctionReason, reason đều được bỏ khoảng trắng hai đầu; chuỗi trống được coi là không có.

<a id="doc-ecothugom-backend-docs-collection-workflow-md--thử-trên-postman"></a>
##### Thử trên Postman

1. Khởi động lại backend bằng `.\scripts\start-local.ps1` để nạp mã mới. Import `docs/collection-workflow-openapi.json` (độc lập, kèm auth); request mẫu ở `collection-workflow.http`. Chưa có Postman CLI trên máy nên kiểm thử tự động dùng Maven/MockMvc và HTTP PowerShell, không tự đẩy workspace.
2. Cần một đơn ASSIGNED đã được admin phân công. Đăng nhập đúng COLLECTOR, GET `/api/auth/csrf`, giữ cookie JSESSIONID của host `http://127.0.0.1:8080`. Mỗi POST chọn Body > raw > JSON, Content-Type application/json, header X-CSRF-TOKEN lấy từ GET csrf.
3. GET chi tiết đơn để lấy id, version, itemId. POST `start-trip` với version hiện tại, sau đó `arrive` với version mới. Ví dụ đơn mới qua confirm/assign có version 2 -> 3 -> 4; các ví dụ không thay thế version thực.
4. POST `weighings` với từng itemId, grossWeight và tareWeight. Kết quả 201 trả orderVersion mới và records. Cân lại phải dùng correctionOf = id bản cân mới nhất của mặt hàng cùng lý do. Mỗi lần cân/sửa cân đều tăng version đơn.
5. POST `quotes` với version hiện tại, ví dụ `{"version":5}` nếu chỉ cân một lần từ version 4. Kết quả SENT, orderStatus AWAITING_SELLER_APPROVAL, lấy id báo giá và version của chính báo giá; orderVersion là version đơn mới.
6. Đăng nhập chủ đơn, GET csrf mới sau login và GET `/api/customer/orders/{id}/quotes`. Chọn accept HOẶC reject với `{"version":6,"quoteVersion":0,"responseNote":"Đã kiểm tra"}` theo dữ liệu thực tế. Thành công 200: accept -> AWAITING_PAYMENT, reject -> ARRIVED.
7. Sau reject, nhân viên được cân điều chỉnh hoặc gửi báo giá mới; phải đăng nhập lại đúng tài khoản và lấy CSRF mới. Nếu SENT hết hạn thì có thể gửi lại với version đơn hiện tại; bản cũ thành SUPERSEDED. Không cho cân lại trong AWAITING_SELLER_APPROVAL.
8. 409: GET lại đơn và báo giá, kiểm tra trạng thái, version và hạn; không lặp tự động yêu cầu cũ. 403: kiểm tra vai trò, cookie và CSRF cùng phiên. 400: kiểm tra JSON, itemId, số thập phân và các trường được phép. 404: kiểm tra đúng chủ đơn/nhân viên được giao.

`versionNumber` là thứ tự lần gửi báo giá; `version` trong Quote là số phiên bản bản ghi báo giá; `orderVersion` là phiên bản đơn. Dùng Quote.version cho request.quoteVersion, và Quote.orderVersion cho request.version. Không tráo ba giá trị này.

Bước sau AWAITING_PAYMENT đã được bổ sung riêng: [thanh toán mô phỏng](#doc-ecothugom-backend-docs-simulated-payments-md) cho nhân viên ghi nhận và chuyển đơn COMPLETED. Không cần sửa các API cân/duyệt ở tài liệu này.

<!-- source-end:doc-ecothugom-backend-docs-collection-workflow-md -->

<a id="doc-ecothugom-backend-docs-current-prices-md"></a>
### API bảng giá thu mua hiện hành

Nguồn trước khi gộp: `ecothugom-backend/docs/current-prices.md`.

<!-- source-begin:doc-ecothugom-backend-docs-current-prices-md -->
<a id="doc-ecothugom-backend-docs-current-prices-md--api-bảng-giá-thu-mua-hiện-hành"></a>
#### API bảng giá thu mua hiện hành

`GET /api/prices/current` là API công khai, chỉ đọc, dành cho bảng giá của một đại lý. Mỗi dòng tương ứng một loại/phân hạng vật liệu trong bảng `materials`.

<a id="doc-ecothugom-backend-docs-current-prices-md--quy-tắc-chọn-giá"></a>
##### Quy tắc chọn giá

1. Chỉ hiển thị vật liệu có `accepted=1` thuộc nhóm có `is_active=1`.
2. Chỉ lấy giá có `approval_status='APPROVED'`.
3. Xét hiệu lực theo khoảng `[valid_from, valid_to)`: `valid_from <= asOf` và `valid_to > asOf` hoặc `valid_to IS NULL`.
4. Nếu nhiều phiên bản cùng hợp lệ, chọn `version_number` cao nhất. Phiên bản cao hơn nhưng chưa duyệt, đã hết hạn hoặc chưa tới ngày hiệu lực không loại bỏ giá đang hợp lệ.
5. Vật liệu chưa có giá hợp lệ vẫn được trả về với `CONTACT_FOR_QUOTE`. Các trường giá, mã quy tắc giá, phiên bản và khoảng hiệu lực đều là `null`. Không dùng giá `0` để biểu thị chưa có giá.

`asOf` được lấy một lần từ đồng hồ UTC của máy chủ cho mỗi request. Các giá trị `DATETIME2` trong database được hiểu là UTC. API trả thời gian ISO-8601 có hậu tố `Z`. Client không được chỉ định thời điểm xét giá qua API này.

<a id="doc-ecothugom-backend-docs-current-prices-md--tham-số"></a>
##### Tham số

| Tham số | Bắt buộc | Mặc định | Quy tắc |
|---|---|---|---|
| `materialId` | Không | Tất cả vật liệu hợp lệ | Số nguyên dương |
| `categoryId` | Không | Tất cả nhóm hợp lệ | Số nguyên dương |
| `page` | Không | `0` | Số nguyên từ `0` |
| `size` | Không | `20` | Số nguyên từ `1` đến `100` |

Hai bộ lọc được kết hợp bằng điều kiện AND. Sắp xếp theo `materialId` tăng dần. Tổng bản ghi là tổng vật liệu hợp lệ, bao gồm vật liệu cần liên hệ báo giá. ID không tồn tại, không còn thu mua hoặc không khớp nhóm trả HTTP `200` với trang rỗng. Trang vượt quá số trang cũng trả danh sách rỗng nhưng vẫn giữ tổng bản ghi sau lọc.

Tham số sai định dạng hoặc ngoài giới hạn trả HTTP `400`, dạng `application/problem+json`, giống các API danh mục hiện có.

<a id="doc-ecothugom-backend-docs-current-prices-md--phản-hồi"></a>
##### Phản hồi

Ví dụ minh họa định dạng, không phải bảng giá thật được seed vào SQL Server:

```json
{
  "asOf": "2026-10-23T03:00:00Z",
  "data": [
    {
      "materialId": 1,
      "categoryId": 1,
      "categoryName": "Giấy",
      "materialName": "Giấy carton",
      "grade": "Khô sạch",
      "unit": "KG",
      "currency": "VND",
      "priceStatus": "AVAILABLE",
      "priceRuleId": 101,
      "unitPrice": 3500,
      "versionNumber": 1,
      "validFrom": "2026-10-22T03:00:00Z",
      "validTo": null
    },
    {
      "materialId": 4,
      "categoryId": 2,
      "categoryName": "Nhựa",
      "materialName": "Chai nhựa PET",
      "grade": "Đã phân loại",
      "unit": "KG",
      "currency": "VND",
      "priceStatus": "CONTACT_FOR_QUOTE",
      "priceRuleId": null,
      "unitPrice": null,
      "versionNumber": null,
      "validFrom": null,
      "validTo": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 2,
  "totalPages": 1
}
```

`unitPrice` là đơn giá cho một đơn vị vật liệu. Với mô hình hiện tại, đó là VND/kg. Backend dùng `BigDecimal` tương ứng `DECIMAL(18,0)`. `validTo=null` trên một giá `AVAILABLE` nghĩa là chưa có ngày kết thúc hiệu lực.

Frontend hiển thị `AVAILABLE` bằng đơn giá, còn `CONTACT_FOR_QUOTE` bằng “Liên hệ báo giá”. Không hiển thị `null` thành `0đ/kg`.

API không công bố giá nháp, giá bị từ chối hoặc thông tin người tạo/người duyệt. API không ghi hoặc seed dữ liệu. Khi `price_rules` trống, tất cả vật liệu đang thu mua sẽ có trạng thái cần liên hệ.

<a id="doc-ecothugom-backend-docs-current-prices-md--kiểm-thử-và-cách-truy-vấn"></a>
##### Kiểm thử và cách truy vấn

Kiểm thử tự động dùng H2, đồng hồ UTC cố định và dữ liệu thử được rollback sau mỗi ca. Các tình huống gồm: giá mở không có ngày hết hạn; bắt đầu hiệu lực đúng thời điểm hiện tại; hết hiệu lực đúng thời điểm hiện tại; giá tương lai/hết hạn/chưa duyệt; phiên bản chồng thời gian; vật liệu ngừng thu mua; lọc và phân trang; dữ liệu rỗng; tham số sai.

Hibernate được cấu hình `hibernate.type.java_time_use_direct_jdbc=true` để truyền/đọc `LocalDateTime` trực tiếp qua JDBC 4.2, giữ nguyên giá trị UTC trong `DATETIME2` thay vì chuyển qua múi giờ mặc định của JVM. Bộ kiểm thử chạy với JVM ở múi giờ `Asia/Ho_Chi_Minh` để phát hiện lại lỗi lệch 7 giờ. Xem [cấu hình Java Time của Hibernate](https://docs.hibernate.org/orm/7.2/javadocs/org/hibernate/cfg/MappingSettings.html#JAVA_TIME_USE_DIRECT_JDBC).

Ứng dụng lấy một trang vật liệu rồi truy vấn các giá hợp lệ cho cả trang trong một lần, tránh truy vấn giá riêng từng vật liệu. Nếu trang không có vật liệu, không gửi truy vấn giá với danh sách ID rỗng.

Khi triển khai API đặt lịch, backend cần lấy lại giá hợp lệ để tạo bản sao giá của đơn; không dùng trực tiếp mức giá do frontend gửi lên làm giá chính thức.

<!-- source-end:doc-ecothugom-backend-docs-current-prices-md -->

<a id="doc-ecothugom-backend-docs-dispatch-orders-md"></a>
### Xác nhận và phân công thu gom

Nguồn trước khi gộp: `ecothugom-backend/docs/dispatch-orders.md`.

<!-- source-begin:doc-ecothugom-backend-docs-dispatch-orders-md -->
<a id="doc-ecothugom-backend-docs-dispatch-orders-md--xác-nhận-và-phân-công-thu-gom"></a>
#### Xác nhận và phân công thu gom

Phần tiếp theo của luồng khách đặt lịch, trên schema SQL Server hiện có. Contract HTTP ở `dispatch-orders-openapi.json`; request mẫu ở `dispatch-orders.http`.

| Method | API | Quyền | Kết quả |
|---|---|---|---|
| GET | `/api/admin/orders?status=PENDING&page=0&size=20` | ADMIN | Danh sách đơn, có version và thông tin giao nhận |
| GET | `/api/admin/orders/{id}` | ADMIN | Chi tiết bất kỳ đơn nào |
| POST | `/api/admin/orders/{id}/confirm` | ADMIN + CSRF | PENDING -> CONFIRMED |
| POST | `/api/admin/orders/{id}/assign` | ADMIN + CSRF | CONFIRMED -> ASSIGNED, gán nhân viên |
| GET | `/api/collector/orders/{id}` | COLLECTOR được giao đơn | Chi tiết đơn; không được giao trả 404 |

Danh sách dùng page từ 0, size 1–100, sắp xếp createdAt giảm dần rồi id giảm dần. status tùy chọn, dùng tên trạng thái in hoa hiện có; sai giá trị trả 400. Không lọc status sẽ lấy tất cả trạng thái.

<a id="doc-ecothugom-backend-docs-dispatch-orders-md--request-và-quy-tắc"></a>
##### Request và quy tắc

Xác nhận: `{"version":0,"reason":"Đã xác minh lịch với khách"}`.

Phân công: `{"version":1,"collectorId":13,"reason":"Phân công nhân viên phụ trách"}`.

- version bắt buộc, số nguyên 0–2147483646, lấy từ GET chi tiết/danh sách. Thành công tăng đúng 1. Nếu version cũ, trạng thái không phù hợp hoặc đơn đã được gán thì trả 409 và không thêm log. Đọc lại đơn trước khi quyết định gửi thao tác mới.
- Không cho client truyền status hoặc changedBy. Người thao tác lấy từ session ADMIN; trạng thái và timestamp UTC lấy từ server.
- Phân công lần đầu chỉ từ CONFIRMED và chưa có collector. Collector phải có role COLLECTOR, trạng thái ACTIVE. Không tồn tại/sai vai trò trả 404, tài khoản bị khóa trả 409.
- Không phân công trùng khung giờ với đơn ASSIGNED, EN_ROUTE, ARRIVED, AWAITING_SELLER_APPROVAL hoặc AWAITING_PAYMENT của cùng nhân viên. Khoảng thời gian [start,end), nên đơn sau bắt đầu đúng giờ kết thúc đơn trước vẫn hợp lệ. Khóa dòng nhân viên trong transaction để hai request đồng thời không vượt qua kiểm tra trùng giờ.
- UPDATE đơn kiểm tra đồng thời id, trạng thái, collector và version. UPDATE và ghi log là một transaction; lỗi audit phải rollback trạng thái, collector, version.
- Log giữ old/new status, old/new collector, admin thực hiện, reason và changedAt. reason tùy chọn, tối đa 500 ký tự; trống dùng lý do mặc định.
- Nhân viên được giao thấy đơn trong danh sách hiện có và được đọc chi tiết. Khách vẫn thấy đơn, giờ hẹn và ước tính cũ qua API của mình. Các route ADMIN vẫn chỉ ADMIN.
- Chưa bao gồm đổi nhân viên, đổi lịch hoặc hủy đơn. Chuyển EN_ROUTE/ARRIVED, cân và báo giá có ở [collection-workflow.md](#doc-ecothugom-backend-docs-collection-workflow-md).

401 chưa đăng nhập/session bị khóa; 403 thiếu CSRF hoặc sai vai trò; 404 đơn/nhân viên không phù hợp phạm vi; 409 xung đột trạng thái/version/lịch; 400 dữ liệu sai; 500 lỗi lưu dữ liệu (rollback). Lỗi dùng Problem Detail, không trả SQL hoặc thông tin giao nhận trong lỗi.

<a id="doc-ecothugom-backend-docs-dispatch-orders-md--kiểm-tra"></a>
##### Kiểm tra

Chạy `.\mvnw.cmd -B -ntp -Dtest=DispatchOrderApiTests test`, rồi `.\mvnw.cmd -B -ntp verify`.

Kiểm thử qua session/CSRF thực với H2: xác nhận và phân công; phiên bản cũ; sai trạng thái; nhân viên sai vai trò/khóa; quyền xem chi tiết; lọc/phân trang; khung giờ chạm nhau và trùng nhau; hai request xác nhận đồng thời; hai request phân công cùng nhân viên đồng thời; rollback khi ghi audit lỗi. Kiểm tra JAR với SQL Server thật nếu kết nối được. Không đổi schema hoặc thêm dependency.

<a id="doc-ecothugom-backend-docs-dispatch-orders-md--thử-trên-postman"></a>
##### Thử trên Postman

1. Dừng backend cũ bằng Ctrl+C, chạy lại `.\scripts\start-local.ps1`. Import `docs/dispatch-orders-openapi.json`.
2. Cần có một đơn PENDING từ API đặt lịch khách hàng. Đăng nhập ADMIN, giữ host `http://127.0.0.1:8080`, gọi GET `/api/admin/orders?status=PENDING&page=0&size=20` và chọn id.
3. GET `/api/admin/orders/{id}` lấy version hiện tại, rồi GET `/api/auth/csrf` để lấy token sau login.
4. POST `/api/admin/orders/{id}/confirm`, raw JSON `{"version":0,"reason":"Đã xác minh với khách"}`; thay version theo đơn thực tế. Header Content-Type application/json và X-CSRF-TOKEN; giữ cookie JSESSIONID. Kết quả 200, CONFIRMED, version tăng 1.
5. GET `/api/admin/users?page=0&size=100` chọn tài khoản bạn đã tạo có role COLLECTOR và status ACTIVE. Dùng id thực, không lấy số điện thoại làm collectorId. Tài khoản DEMO không có mật khẩu công bố để thử đăng nhập.
6. POST `/api/admin/orders/{id}/assign`, raw JSON `{"version":1,"collectorId":13,"reason":"Phân công nhân viên phụ trách"}`; thay version và collectorId. Kết quả 200, ASSIGNED, version tăng 1.
7. Đăng nhập nhân viên được giao và GET `/api/collector/orders`, rồi `/api/collector/orders/{id}`: cả hai 200. Nhân viên khác GET chi tiết đó nhận 404; nhân viên gọi API quản trị nhận 403.
8. Nếu 409, GET lại chi tiết: kiểm tra trạng thái/version, nhân viên ACTIVE và khung giờ có trùng không. Không gửi lại lệnh cũ liên tục. Nếu vừa đổi tài khoản đăng nhập, phải GET CSRF mới trước POST tiếp theo.

Schema Order/OrderItem/Problem trong OpenAPI điều phối được sao chép từ `collection-orders-openapi.json` để có một file import độc lập; file đặt lịch là nguồn chuẩn cho ba schema dùng chung này.

<a id="doc-ecothugom-backend-docs-dispatch-orders-md--kết-quả-xác-minh-23102026"></a>
##### Kết quả xác minh 23/10/2026

- Maven `verify` đạt 82 kiểm thử (16 điều phối mới và 66 kiểm thử sẵn có), 0 thất bại/lỗi/bỏ qua; đóng gói JAR thành công.
- Đã thử đổi điều kiện trùng giờ sang gồm cả ranh giới: kiểm thử khung giờ liền nhau bắt được lỗi; mã nguồn được khôi phục nguyên byte trước lần verify đầy đủ.
- JAR chạy riêng trên cổng 18080 với SQL Server thật đạt 32 kiểm tra HTTP: đặt lịch, xác nhận, phân công, version cũ, CSRF, vai trò, quyền xem chi tiết, trạng thái tài khoản, lọc danh sách. Hai request phân công đồng thời cho một nhân viên vào cùng khung giờ cho đúng một 200 và một 409; hai khung giờ liền nhau đều được nhận.
- Đối chiếu trực tiếp SQL đạt: 2 đơn ASSIGNED/version 2, 1 đơn CONFIRMED/version 1, 8 log tổng và đúng 5 log do admin thực hiện; request xung đột không thêm log.
- Đã dọn tài khoản/đơn/item/log giả định và dừng JVM thử. Mật khẩu thử ngẫu nhiên chỉ dùng trong RAM, không dùng tài khoản đăng nhập của người dùng. Backend cổng 8080 cần khởi động lại để nạp mã mới.
- OpenAPI parse được JSON, kiểm tra đủ 48 tham chiếu nội bộ và ba schema dùng chung trùng với nguồn chuẩn.

<!-- source-end:doc-ecothugom-backend-docs-dispatch-orders-md -->

<a id="doc-ecothugom-backend-docs-profile-addresses-md"></a>
### Hồ sơ, mật khẩu và địa chỉ

Nguồn trước khi gộp: `ecothugom-backend/docs/profile-addresses.md`.

<!-- source-begin:doc-ecothugom-backend-docs-profile-addresses-md -->
<a id="doc-ecothugom-backend-docs-profile-addresses-md--hồ-sơ-mật-khẩu-và-địa-chỉ"></a>
#### Hồ sơ, mật khẩu và địa chỉ

Mọi API cần cookie phiên; lệnh ghi cần CSRF như auth-api.md. Không cần thay schema SQL Server. Hồ sơ dùng mọi vai trò; địa chỉ chỉ CUSTOMER và chỉ tài nguyên của mình. Sau build khởi động lại backend để có route mới.

| Method | Route | Body / hành vi |
|---|---|---|
| PUT | `/api/auth/profile` | `{ "fullName": "Tên mới", "email": null }`; bỏ email sẽ xóa email |
| POST | `/api/auth/password` | `{ "currentPassword": "…", "newPassword": "…" }`; 204, đăng nhập lại |
| GET/POST | `/api/customer/addresses` | Danh sách phân trang / tạo địa chỉ |
| GET/PUT/DELETE | `/api/customer/addresses/{id}` | Đọc / thay thông tin / xóa (204) |
| PUT | `/api/customer/addresses/{id}/default` | Chọn mặc định; không cần body |

Đổi mật khẩu cần mật khẩu hiện tại, mật khẩu mới khác cũ, 12–64 ký tự và không quá 72 byte UTF-8. Mọi phiên cũ mất quyền ở request tiếp theo, phiên đang đổi bị đăng xuất ngay; hash hoặc dấu kiểm phiên không xuất hiện trong response. fullName/email theo giới hạn đăng ký; không nhận phone/role/status qua profile; email trùng trả 409.

POST/PUT địa chỉ:

```json
{
  "pickupAddress": {
    "contactName": "Người liên hệ",
    "contactPhone": "0934567890",
    "addressLine": "12 Đường thử",
    "ward": null,
    "district": null,
    "province": "TP Hồ Chí Minh"
  },
  "isDefault": false
}
```

Response có id/pickupAddress/isDefault/createdAt UTC. Địa chỉ đầu tiên luôn mặc định. Tối đa 100 địa chỉ/tài khoản; chọn mặc định khóa tài khoản nên thao tác đồng thời không tạo hai mặc định. PUT isDefault bị bỏ giữ mặc định cũ; true chuyển mặc định sang địa chỉ này. Muốn bỏ mặc định hiện tại hãy chọn địa chỉ khác trước. Xóa mặc định chọn địa chỉ còn lại cũ nhất; không còn địa chỉ thì danh sách rỗng.

GET list: page=0, size=20, tối đa 100, mặc định trước rồi ID tăng dần. ID của người khác hoặc không tồn tại trả 404; vai trò khác trả 403. Không trả chủ sở hữu do client cung cấp.

Đặt lịch qua POST `/api/customer/orders` có thể thay pickupAddress bằng `"addressId": 1`. Phải chọn đúng một trong hai; các trường pickupStart/pickupEnd/items giữ hợp đồng cũ. Backend khóa địa chỉ theo chủ và chụp thông tin vào đơn. Sửa địa chỉ không cập nhật đơn cũ; xóa địa chỉ gỡ sourceAddressId nhưng giữ contactName/contactPhone/address và version của đơn. Tài khoản SQL cần SELECT/INSERT/UPDATE/DELETE addresses, SELECT/UPDATE users và quyền đặt lịch hiện có.

Kiểm chứng: 30 test tập trung AddressApiTests/ProfileApiTests/CollectionOrderApiTests đạt, thêm 13 AuthApiTests cũng đạt ở lượt kiểm tra hồ sơ trước đó. Xác minh tổng hợp và SQL Server sẽ được ghi trong báo cáo hoàn tất tám nhóm.

<!-- source-end:doc-ecothugom-backend-docs-profile-addresses-md -->

<a id="doc-ecothugom-backend-docs-simulated-payments-md"></a>
### Thanh toán mô phỏng

Nguồn trước khi gộp: `ecothugom-backend/docs/simulated-payments.md`.

<!-- source-begin:doc-ecothugom-backend-docs-simulated-payments-md -->
<a id="doc-ecothugom-backend-docs-simulated-payments-md--thanh-toán-mô-phỏng"></a>
#### Thanh toán mô phỏng

API dùng trong đồ án một đại lý: nhân viên ghi nhận đại lý trả tiền cho khách bán phế liệu. Không gọi ngân hàng/cổng thanh toán, không chuyển tiền thật. Sử dụng bảng payments hiện có, không cần chạy lại schema.

<a id="doc-ecothugom-backend-docs-simulated-payments-md--contract"></a>
##### Contract

POST `/api/collector/orders/{id}/payments/simulate`, COLLECTOR ACTIVE được phân công, cookie JSESSIONID và X-CSRF-TOKEN. Body JSON chỉ gồm:

```json
{
  "version": 7,
  "quoteId": 21,
  "method": "CASH_SIMULATED",
  "requestKey": "5feebfac-a549-41ad-ab35-e8d14e291e03"
}
```

- version bắt buộc, số nguyên 0..2147483646 của đơn AWAITING_PAYMENT hiện tại. quoteId là báo giá ACCEPTED hiện hành thuộc đúng đơn. Báo giá đã ACCEPTED vẫn được thanh toán nếu thời hạn trả lời ban đầu đã qua; hạn chỉ áp dụng lúc khách duyệt.
- method chỉ CASH_SIMULATED hoặc TRANSFER_SIMULATED. requestKey GUID bắt buộc, client tạo một lần cho một thao tác. Không truyền amount, status, recordedBy, paidAt hoặc referenceCode.
- Server lấy nguyên total_amount từ báo giá đã chấp thuận (VND), không dùng giá hiện hành và không tính lại giá ước tính. Tạo referenceCode có tiền tố SIM-, status COMPLETED, recordedBy từ session, paidAt/createdAt/completedAt từ thời gian UTC server.
- Trong cùng transaction: CAS đơn sang COMPLETED, tăng version một lần và đặt completed_at, INSERT payments và INSERT order_status_logs. Lỗi ở bất kỳ bước nào rollback toàn bộ. Chỉ một bản COMPLETED cho một đơn; giữ nguyên các bản PENDING/FAILED cũ.
- Thành công 201 trả Payment: id, orderId, quoteId, amount, currency, method, status, requestKey, paidAt, referenceCode, recordedBy, createdAt, orderStatus, orderVersion, completedAt. completedAt của đơn và paidAt trùng nhau.
- Yêu cầu lặp với cùng requestKey (kể cả payload khác), đổi key sau khi đơn COMPLETED, version cũ hoặc báo giá chưa chấp thuận: 409. API không replay bản ghi trước. Nếu mất response, GET payments để kiểm tra requestKey trước khi quyết định thao tác tiếp; không tự đổi key để gửi lại.

GET `/api/customer/orders/{id}/payments`, `/api/collector/orders/{id}/payments`, `/api/admin/orders/{id}/payments`: 200 mảng tối đa 100 bản gần nhất, sắp createdAt giảm dần rồi id giảm dần; không có thì []. CUSTOMER chỉ đơn của mình, COLLECTOR chỉ đơn được giao, ADMIN xem mọi đơn. Payload các vai trò giống nhau; không trả thông tin ngân hàng hoặc evidence_url.

Lỗi Problem Detail: 400 body/UUID/method/version sai; 401 chưa đăng nhập/tài khoản bị khóa; 403 sai vai trò/thiếu CSRF; 404 đơn hoặc báo giá ngoài phạm vi; 409 trạng thái/version/khóa yêu cầu/thanh toán xung đột; 500 lưu dữ liệu lỗi (rollback, không lộ SQL).

<a id="doc-ecothugom-backend-docs-simulated-payments-md--thử-bằng-postman"></a>
##### Thử bằng Postman

1. Khởi động lại backend bằng `.\scripts\start-local.ps1`. Import `docs/simulated-payments-openapi.json`. Giữ host `http://127.0.0.1:8080` cho mọi request để dùng chung cookie.
2. Đăng nhập COLLECTOR được giao đơn. Sau login, GET `/api/auth/csrf` lấy token mới; Postman giữ JSESSIONID. Không gọi thanh toán bằng session khách/admin.
3. GET `/api/collector/orders/{id}`: đơn phải AWAITING_PAYMENT; lấy version thật. GET `/api/collector/orders/{id}/quotes`: lấy id của bản current=true và status=ACCEPTED. Không lấy versionNumber làm quoteId.
4. Tạo GUID mới cho thao tác, ví dụ PowerShell `[guid]::NewGuid().ToString()`. POST `/api/collector/orders/{id}/payments/simulate`, Body > raw > JSON theo mẫu trên, thay version/quoteId/requestKey. Header Content-Type application/json và X-CSRF-TOKEN. Chọn CASH_SIMULATED hoặc TRANSFER_SIMULATED, không gửi amount.
5. Kết quả 201 có status và orderStatus COMPLETED; orderVersion tăng 1, paidAt bằng completedAt, amount bằng tổng báo giá ACCEPTED. GET `/api/collector/orders/{id}/payments` hoặc GET chi tiết đơn để xác nhận.
6. Gửi lại cùng request hoặc đổi requestKey sau khi hoàn tất đều trả 409. Khi mất response, GET payments và đối chiếu requestKey đã lưu. Không tự tạo một yêu cầu mới để thay yêu cầu chưa rõ kết quả.
7. Đăng nhập chủ đơn hoặc ADMIN rồi dùng GET payments theo tiền tố vai trò tương ứng. Mỗi lần đổi tài khoản đăng nhập phải GET csrf mới trước POST tiếp theo.

Quyền database: thêm SELECT/INSERT `dbo.payments` bên cạnh quyền đơn/báo giá/audit đã dùng. Không cần UPDATE payment qua API này; các bản PENDING/FAILED cũ được giữ nguyên. GET giới hạn 100, ngày UTC dạng ISO 8601 có Z. Phản hồi thanh toán gồm completedAt; GET chi tiết đơn hiện có vẫn giữ cấu trúc cũ và thể hiện trạng thái COMPLETED.

OpenAPI được tạo từ contract này, sao chép schema auth dùng chung từ auth-openapi.json để import độc lập. Không đẩy lên workspace Postman tự động. Kiểm thử tự động dùng Maven/MockMvc và HTTP PowerShell khi Postman CLI không khả dụng.

<!-- source-end:doc-ecothugom-backend-docs-simulated-payments-md -->

<a id="doc-ecothugom-backend-spec-admin-reports-md"></a>
### admin-reports

Nguồn trước khi gộp: `ecothugom-backend/SPEC-admin-reports.md`.

<!-- source-begin:doc-ecothugom-backend-spec-admin-reports-md -->
<a id="doc-ecothugom-backend-spec-admin-reports-md--admin-reports"></a>
#### admin-reports

Chỉ ADMIN: GET `/api/admin/reports/overview`, `/materials`, `/collectors`. Query from/to là ngày YYYY-MM-DD tại Asia/Ho_Chi_Minh, từ đầu from bao gồm đến đầu to không bao gồm; mặc định tháng hiện tại, cửa sổ >0 tối đa 366 ngày. Chuyển UTC LocalDateTime khi query SQL, không dùng timezone máy JVM. Breakdown phân trang PageResponse size 1..100.

Overview: số đơn tạo trong kỳ, phân bố trạng thái và tỷ lệ có completed_at trên cohort đơn tạo trong kỳ. Tổng tiền/khối lượng/số đơn đã trả tiền tính theo payment.paid_at trong kỳ (công bố hai mốc đo rõ trong response/docs). Chỉ payment COMPLETED; đơn chuyển DISPUTED sau hoàn tất vẫn được tính tiền đã chi. Khối lượng/tiền theo vật liệu lấy quote_items của quote đã thanh toán; không dùng weighing_records cộng lặp correction. Theo collector lấy payments.recorded_by là người đã ghi nhận chi tiền, không nhân tiền theo số item.

Material breakdown: materialId, tên snapshot, grade/unit snapshot, actualQty, lineTotal và distinct order count; dữ liệu đổi tên có thể thành nhóm snapshot riêng để giữ đúng tên giao dịch. Collector breakdown: ID/tên hiện tại, tổng payment và khối lượng lấy subquery quote aggregation rồi join một lần. Không ghi dữ liệu/dependency/schema. Test rỗng, boundary ngày Việt Nam, đã/chưa trả tiền/tranh chấp, nhiều item/correction, quyền và filter/page; SQL Server thật đối chiếu tổng. Commands/style và bảo mật như SPEC-profile-addresses.

<!-- source-end:doc-ecothugom-backend-spec-admin-reports-md -->

<a id="doc-ecothugom-backend-spec-disputes-md"></a>
### disputes

Nguồn trước khi gộp: `ecothugom-backend/SPEC-disputes.md`.

<!-- source-begin:doc-ecothugom-backend-spec-disputes-md -->
<a id="doc-ecothugom-backend-spec-disputes-md--disputes"></a>
#### disputes

Khách GET/POST `/api/customer/orders/{id}/disputes`; admin GET `/api/admin/disputes` phân trang/filter, GET chi tiết và POST `/{id}/review`, `/{id}/resolve`, `/{id}/reject`. Tạo gồm version đơn, reason không rỗng tối đa 1000, evidenceUrl tùy chọn chỉ URL ảnh của đúng đơn đã được API ảnh tạo. Admin thao tác gồm version đơn; resolve/reject cần resolution không rỗng tối đa 1000.

Cho mở từ EN_ROUTE/ARRIVED/AWAITING_SELLER_APPROVAL/AWAITING_PAYMENT/COMPLETED/CANCELLED; không mở khi DISPUTED. CAS order sang DISPUTED, lưu previous_order_status, trạng thái OPEN và audit trong transaction. Chỉ một dispute active vì trạng thái/CAS. Review OPEN→IN_REVIEW tăng version đơn/audit trạng thái giữ nguyên. Resolve/reject từ OPEN/IN_REVIEW ghi resolvedBy/At/resolution và phục hồi chính xác previous_order_status; không hủy payment hoặc tính lại tiền. Đơn từng COMPLETED giữ completed_at và payment, receipt/thống kê vẫn nhận giao dịch đó. Kết luận bất biến, stale/race 409.

Schema disputes đã có, bổ sung fixture H2 và delete ordering test. Không tự động hoàn tiền, không cổng thanh toán thật. Test owner/role/CSRF/reason/evidence, hai lần mở đồng thời, review/close xung đột, previous state/audit/rollback, tiền/biên nhận giữ nguyên. Commands/style/nguồn theo SPEC-profile-addresses; service và controller module orders, hợp đồng docs.

<!-- source-end:doc-ecothugom-backend-spec-disputes-md -->

<a id="doc-ecothugom-backend-spec-evidence-md"></a>
### evidence

Nguồn trước khi gộp: `ecothugom-backend/SPEC-evidence.md`.

<!-- source-begin:doc-ecothugom-backend-spec-evidence-md -->
<a id="doc-ecothugom-backend-spec-evidence-md--evidence"></a>
#### evidence

Ảnh minh chứng đồ án: lưu tại backend ngoài webroot bằng tên UUID ngẫu nhiên, cột photo_url đã có. JPEG/PNG thực tối đa 5 MiB, giới hạn kích thước điểm ảnh, đọc header/giải mã và mã hóa lại để không tin MIME/đuôi client. Không URL fetch, không đường dẫn/tên file do client quyết định. Cấu hình thư mục bằng môi trường, mặc định .local/evidence. Multipart giới hạn cấu hình, lỗi quá lớn 413.

POST multipart `/api/customer/orders/{id}/items/{itemId}/photo`, `file` và `version`: trước EN_ROUTE, owner, chỉ một ảnh cho slot. POST `/api/collector/orders/{id}/weighings/{weighingId}/photo`: ARRIVED, collector được giao, đúng lần cân mới nhất, chưa có quote tham chiếu; không ghi đè phiếu cân lịch sử. Ghi ảnh/CAS/audit/URL trong transaction; rollback dọn file mới. Không nhận URL ngoài qua payload.

GET `/api/evidence/{uuid}.{png|jpg}` cần xác thực và quyền đối với order tìm từ các cột ảnh, không chỉ biết URL là đọc được. Trả Content-Type chính xác, nosniff/cache private; 404 cho thiếu/sai quyền. Customer/collector/admin đọc theo scope, collector cũ mất quyền sau reassign. Response order/items và weighing thêm photoUrl tương thích. Mỗi slot có một ảnh bất biến; muốn thay ảnh cân phải tạo correction mới. File nằm trong thư mục server, không đồng bộ Postman/cloud. URL chỉ phục vụ qua API có quyền.

Test bytes hợp lệ/MIME giả/tên ../../file/quá lớn/kích thước, CSRF/ownership, trạng thái/stale version, quoted weighing immutable, transaction rollback dọn file, GET role. Test không phụ thuộc mạng, lưu thư mục tạm. SQL Server thật kiểm tra URL/link qua luồng. Theo commands/style trong SPEC-profile-addresses.

<!-- source-end:doc-ecothugom-backend-spec-evidence-md -->

<a id="doc-ecothugom-backend-spec-order-changes-md"></a>
### order-changes

Nguồn trước khi gộp: `ecothugom-backend/SPEC-order-changes.md`.

<!-- source-begin:doc-ecothugom-backend-spec-order-changes-md -->
<a id="doc-ecothugom-backend-spec-order-changes-md--order-changes"></a>
#### order-changes

Phạm vi theo xác nhận của người dùng: mọi hủy của khách đều gửi yêu cầu CANCEL và cần ADMIN duyệt, cả trước khởi hành. POST /cancel là lối tắt tạo yêu cầu PENDING, trả 201, không hủy trực tiếp. Khách tự đổi lịch trước khởi hành (PENDING/CONFIRMED/ASSIGNED); sau khởi hành gửi RESCHEDULE cho admin. Admin phân công lại ASSIGNED. Không hủy COMPLETED/DISPUTED, không sửa tiền hoặc snapshot báo giá. Dựa trên order_change_requests và version/CAS/audit hiện có.

Route: customer orders/{id}/cancel, /reschedule; GET/POST /change-requests, POST /change-requests/{requestId}/withdraw. ADMIN GET /order-change-requests, POST /order-change-requests/{requestId}/approve hoặc /reject; POST /orders/{id}/reassign. Quyền từ session, CSRF mọi write; ID thuộc người khác trả 404.

Input ghi gồm version đơn; review/withdraw thêm requestVersion; lý do không rỗng tối đa 500. RESCHEDULE gồm pickupStart/pickupEnd tương lai, có múi giờ; CANCEL không nhận slot mới. Tạo request tăng version đơn và audit trạng thái không đổi; unique PENDING/order của SQL Server. Admin approve kiểm tra lại trạng thái/version và lịch, request cập nhật cùng transaction với đơn. Reject/withdraw lưu actor/time/responseNote, tăng version request. Chỉ admin approve mới lưu cancelledAt/reason và chuyển CANCELLED. RESCHEDULE được yêu cầu đến EN_ROUTE; sau ARRIVED chỉ CANCEL request, không dời lại lần cân đã diễn ra. Duyệt reschedule từ EN_ROUTE trở về CONFIRMED và bỏ collector để điều phối lại; trước khởi hành giữ collector nếu có và phải kiểm tra lịch trùng. Cancel request có thể duyệt đến AWAITING_PAYMENT nếu chưa thanh toán; giữ báo giá lịch sử và chặn tác vụ do đơn CANCELLED. COMPLETED chỉ khiếu nại.

Phân công lại chỉ ASSIGNED và collector mới khác cũ, active, không trùng; khóa collector đích trước CAS như dispatch hiện có; audit old/new collector. Không mở PATCH status tự do. REJECTED/APPROVED/WITHDRAWN bất biến; lỗi stale/duplicate/race 409; lỗi body 400, tài nguyên 404.

Kiểm thử: direct/request/review/withdraw/scope, lịch trùng và cạnh sát, nhân viên cũ mất quyền, concurrency và rollback, audit, không tác động quote/payment cũ; H2 fixture khớp constraint và SQL Server thật. Theo lệnh Maven/kiểu mã/ba ranh giới trong SPEC-profile-addresses; module ở orders, docs hợp đồng/OpenAPI bên docs. Tái dùng OrderWorkflow, AccountService và kiểm tra cửa sổ thời gian chung.

<!-- source-end:doc-ecothugom-backend-spec-order-changes-md -->

<a id="doc-ecothugom-backend-spec-order-history-md"></a>
### order-history

Nguồn trước khi gộp: `ecothugom-backend/SPEC-order-history.md`.

<!-- source-begin:doc-ecothugom-backend-spec-order-history-md -->
<a id="doc-ecothugom-backend-spec-order-history-md--order-history"></a>
#### order-history

GET `/api/{customer|collector|admin}/orders/{id}/timeline?page=0&size=20`: PageResponse sắp log_id tăng dần, gồm status cũ/mới, actor ID/tên hiện tại, old/new collector, reason, changedAt UTC. GET tương tự `/receipt`: JSON tổng hợp order snapshot, quote có payment COMPLETED, payment và đúng các phiếu cân được quote tham chiếu; chưa thanh toán trả 409. Đang DISPUTED sau hoàn tất vẫn đọc biên nhận của payment đã chốt. Không lấy giá/tên hiện tại thay snapshot quote, không dùng lần cân điều chỉnh chưa thanh toán.

Role/scope dùng CollectionOrderReader qua một OrderReadAccess dùng chung cho các module đọc mới; customer chỉ đơn mình, collector chỉ đơn đang được giao, admin tất cả. Không sửa dữ liệu/schema. page 0, size 1..100; lỗi giống hợp đồng hiện tại. Test timeline trống/ordered/page/actor, receipt chưa trả tiền, nhiều version quote/correction, giá/metadata đổi, ownership/role. Build/test/nguồn chuẩn theo SPEC-profile-addresses.

<!-- source-end:doc-ecothugom-backend-spec-order-history-md -->

<a id="doc-ecothugom-backend-spec-profile-addresses-md"></a>
### profile-addresses

Nguồn trước khi gộp: `ecothugom-backend/SPEC-profile-addresses.md`.

<!-- source-begin:doc-ecothugom-backend-spec-profile-addresses-md -->
<a id="doc-ecothugom-backend-spec-profile-addresses-md--profile-addresses"></a>
#### profile-addresses

Mục tiêu: người đăng nhập sửa fullName/email của mình, đổi mật khẩu có kiểm tra mật khẩu cũ; khách quản lý địa chỉ và đặt lịch bằng addressId riêng. Không đổi vai trò, trạng thái hoặc số điện thoại qua hồ sơ.

API: PUT `/api/auth/profile` (fullName, email); POST `/api/auth/password` (currentPassword,newPassword), thành công 204 và mọi phiên cũ mất hiệu lực; CRUD `/api/customer/addresses`, PUT `/{id}/default`; đặt lịch nhận đúng một trong pickupAddress hoặc addressId.

Địa chỉ dùng các trường liên hệ/địa chỉ như pickupAddress hiện có. Địa chỉ đầu tiên mặc định; chọn mặc định khóa tài khoản để tối đa một địa chỉ mặc định. Xóa mặc định chọn địa chỉ còn lại cũ nhất; xóa địa chỉ từng dùng chỉ gỡ source_address_id, giữ nguyên snapshot và version đơn. PUT thay toàn bộ thông tin; không đổi chủ sở hữu/createdAt. Người khác đọc/sửa/xóa ID trả 404, COLLECTOR/ADMIN không truy cập route khách. Dữ liệu/CSRF/phiên khóa được kiểm tra. Lệnh ghi toàn bộ trong transaction.

Nguồn và phong cách: `auth/AccountService`, `orders/CustomerOrderService`, PageResponse, ProblemDetail. Không dependency/schema production mới; H2 fixture mở rộng cột địa chỉ để khớp production. Mật khẩu theo chuẩn đăng ký hiện tại (12–64 ký tự, tối đa 72 byte UTF-8, BCrypt12); dùng dấu kiểm credential phía server để mọi phiên của mật khẩu cũ bị vô hiệu, không trả hash/stamp.

Kiểm thử: MockMvc/session/CSRF thật và H2, ownership/validation/email trùng/rollback, concurrent chọn mặc định, địa chỉ chụp lại trên đơn không đổi sau sửa/xóa, mật khẩu sai/cũ/mới/phiên thứ hai. Chạy `.\mvnw.cmd -B -ntp '-Dtest=ProfileApiTests,AddressApiTests,AuthApiTests,CollectionOrderApiTests' test`, sau checkpoint `.\mvnw.cmd -B -ntp verify`; SQL Server thử bằng dữ liệu giả định có cleanup. Mã `src/main/java/com/ecothugom/{auth,orders}`, test `src/test/java`, docs `docs`.

Hoàn tất khi tất cả hành vi trên có test đạt, docs/OpenAPI đồng bộ và các API cũ vẫn tương thích JSON. Kiểm tra an toàn: không log mật khẩu/PII; phone/role/status không nhận từ profile; địa chỉ lấy owner từ phiên.

<!-- source-end:doc-ecothugom-backend-spec-profile-addresses-md -->

---

<a id="group-frontend"></a>
## Frontend: giao diện và luồng chức năng

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md"></a>
### Admin quản lý tài khoản

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-accounts-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-accounts-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--admin-quản-lý-tài-khoản"></a>
#### Admin quản lý tài khoản

Trang `/quan-tri/tai-khoan` kết nối ba API hiện có trong backend Spring Boot + SQL Server. Đăng nhập ADMIN và chọn **Tài khoản** trên sidebar. Không cần chạy SQL hoặc cài dependency mới.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--sử-dụng"></a>
##### Sử dụng

Danh sách hiển thị họ tên, mã, số điện thoại, email, vai trò và trạng thái. Mỗi trang 20 tài khoản, sắp theo ID tăng dần từ backend; trang hiện tại nằm trên URL. Có nút về trang đầu/cuối để tìm tài khoản mới. ADMIN chỉ xem; thao tác trạng thái chỉ có với CUSTOMER và COLLECTOR.

**Tạo nhân viên** → nhập họ tên, điện thoại, email tùy chọn, mật khẩu ban đầu và xác nhận → **Lưu nhân viên**. Mật khẩu 12–64 ký tự, tối đa 72 byte UTF-8. Backend tự cấp COLLECTOR/ACTIVE; form không cho chọn vai trò. Không gửi confirmPassword, role hoặc status. Tạo nhân viên không đăng nhập thay admin. Thông báo thành công có tên và ID; tài khoản mới ở cuối danh sách theo thứ tự ID.

**Khóa / Mở khóa** tại dòng tài khoản → xem lại người nhận, vai trò và liên hệ → xác nhận. **Giữ nguyên** đóng bước xác nhận mà không ghi. Hệ thống đọc lại đúng ID trên trang hiện tại trước khi mở bước xác nhận và trước PATCH, giữ trạng thái đích đã chọn. Nếu admin khác đã áp dụng đích, không đảo trạng thái theo dữ liệu cũ.

Khóa tài khoản ngăn đăng nhập và vô hiệu hóa quyền của phiên đang có ở request tiếp theo. Mở khóa cho phép đăng nhập lại, không khôi phục phiên đã bị vô hiệu hóa. Khóa không tự hủy đơn, xóa dữ liệu hay phân công lại người thu gom; admin cần xử lý công việc đang có theo luồng đơn.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--api-và-giới-hạn"></a>
##### API và giới hạn

Nguồn chuẩn: `../ecothugom-backend/docs/auth-api.md`, `auth-openapi.json`, `AdminUserController`, `AccountService`, `RegistrationRequest`, `UserResponse`, `AccountSessionFilter`.

| API                                   | Nội dung                                                |
| ------------------------------------- | ------------------------------------------------------- |
| GET `/api/admin/users?page=0&size=20` | Danh sách gồm cả ADMIN, phân trang                      |
| POST `/api/admin/collectors`          | `{fullName, phone, email, password}` → COLLECTOR/ACTIVE |
| PATCH `/api/admin/users/{id}/status`  | `{status: "LOCKED"}` hoặc `{status: "ACTIVE"}`          |

Backend chưa có API chi tiết tài khoản theo ID, tìm kiếm hay lọc vai trò/trạng thái. UI không gửi các tham số giả định, không tải toàn bộ database để tạo bộ lọc giả. Đọc lại bản ghi qua trang hiện tại; nếu không còn thấy đúng ID, yêu cầu tải lại trước khi thao tác.

Backend chưa có revision cho trạng thái tài khoản. Bước đọc lại phát hiện thay đổi đã quan sát được, không thay thế cơ chế kiểm tra cập nhật nguyên tử phía server. Các cập nhật đồng thời vẫn tuân theo thứ tự backend xử lý; request PATCH luôn gửi đích rõ ràng thay vì lệnh đảo trạng thái.

Không bổ sung tạo khách hàng bằng admin, đổi vai trò, xóa tài khoản, sửa hồ sơ của người khác hoặc reset mật khẩu ngoài phạm vi API. Khách tiếp tục tự đăng ký qua trang hiện có.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--giao-diện-và-bảo-vệ"></a>
##### Giao diện và bảo vệ

Áp dụng Taste Skill theo hướng preserve, dials 3/2/6: giữ AdminLayout, xanh rừng/xanh chanh, Be Vietnam Pro và Phosphor; bảng, form và xác nhận cùng hệ thành phần với các trang bảng giá/danh mục. Form hai cột trên desktop, một cột trên điện thoại; bảng có vùng cuộn riêng. Có nhãn, focus khi mở form/xác nhận và sáng/tối.

- Dùng cookie phiên và CSRF mới mỗi lần ghi; không lưu token hay mật khẩu vào localStorage, URL hoặc query cache.
- Schema quản trị chấp nhận ACTIVE/LOCKED riêng; không nới schema phiên chỉ chấp nhận ACTIVE.
- Chặn ADMIN ở UI và API client; backend vẫn là lớp phân quyền quyết định.
- Khóa đồng bộ chống nhấp đúp, không retry POST/PATCH tự động. Sai kết quả phản hồi được coi là chưa xác định.
- 404, xung đột khi đổi trạng thái hoặc kết quả không rõ khóa thao tác đến khi tải lại thành công. Đọc lại thất bại không mở khóa. Lỗi trùng điện thoại/email khi tạo vẫn cho sửa thông tin.
- Xóa ô mật khẩu sau lần gửi hợp lệ, kể cả lỗi; đóng form sau thành công. Không hiển thị lại mật khẩu hoặc hash trong danh sách/kết quả.
- Không render SQL/raw server errors. Kiểm tra ID, thông tin định danh, vai trò và trạng thái trả về trước khi báo thành công.
- Query riêng theo user ID và ADMIN; kiểm tra phiên trước/sau async, không khôi phục thông báo/cache riêng khi phiên đổi.
- Sau tạo hoặc đổi trạng thái, làm mới tài khoản và danh sách nhân viên ACTIVE dùng trong phân công đơn.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--tệp-chính-và-kiểm-tra"></a>
##### Tệp chính và kiểm tra

- `src/pages/AdminAccountsPage.jsx`: trang danh sách và điều hướng phân trang.
- `src/features/admin/accounts-model.js`, `accounts-api.js`, `useAdminAccounts.js`: contract, client, điều phối và phục hồi lỗi.
- `CollectorAccountForm.jsx`, `AccountStatusConfirm.jsx`, `AccountTable.jsx`: UI theo chức năng.
- `src/styles/admin-accounts.css`, `src/App.jsx`, `AdminLayout.jsx`: giao diện, route và menu.
- `scripts/verify-admin-accounts.mjs`, `fixtures/admin-accounts.mjs`: Chrome với HTTP mô phỏng, không ghi SQL.
- `scripts/verify-live-accounts.ps1`, `verify-live-accounts.mjs`: Chrome production preview, backend thật và SQL; ba tài khoản tổng hợp với marker riêng, dọn trong `finally`.

Chạy `npm run check` và `npm run format:check`. `npm run test:accounts` cần frontend và Chrome; có thể đặt `FRONTEND_URL` đến Vite preview để kiểm tra bản build ổn định.

Script live cần JAR backend đã build, JDK, sqlcmd và SQL Server hiện có; dùng cổng thử 18080/5174, không dừng server của người dùng ở 8080/5173. Không chạy đồng thời với script khác dùng cùng cổng thử. Mật khẩu tổng hợp ngẫu nhiên chỉ truyền qua môi trường, không ghi vào báo cáo. Cleanup chỉ xóa tài khoản khớp marker, số điện thoại và vai trò đã tạo, từ chối nếu có địa chỉ hoặc đơn liên quan; không xóa tài khoản sẵn có.

Kết quả/ảnh HTTP mô phỏng ở `.cache/admin-accounts/`, hệ thống thật ở `.cache/live-accounts/`. Postman CLI không có trong môi trường hiện tại; kiểm tra dùng contract cục bộ, Vitest và Playwright, không sửa hoặc đồng bộ Postman workspace.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--kết-quả-kiểm-tra-ngày-24102026"></a>
##### Kết quả kiểm tra ngày 24/10/2026

| Nhóm kiểm tra               | Kết quả                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`             | Lint, 332 test trong 32 tệp và Vite build đều qua; 29 test mới cho tài khoản                                                                           |
| Chrome HTTP mô phỏng        | 23 tình huống qua; không có pageerror                                                                                                                  |
| Responsive / accessibility  | 320/768/1024/1440 px, sáng/tối; form và xác nhận không tràn trang; axe không có vi phạm ở 320/1440 px                                                  |
| Chrome + backend + SQL thật | 14 bước qua: tạo COLLECTOR, khóa/mở khóa cả CUSTOMER/COLLECTOR, vô hiệu hóa phiên ở request tiếp theo, chặn đăng nhập khi khóa, đăng nhập lại khi mở   |
| Quyền quản trị              | CUSTOMER/COLLECTOR nhận 403 với danh sách admin; ADMIN không có nút đổi trạng thái và backend cũng từ chối PATCH thử trên admin tổng hợp bằng 409      |
| Bất biến SQL                | Đúng ba tài khoản tổng hợp, vai trò/điện thoại đúng; khách và nhân viên ACTIVE sau mở khóa; updated_at được cập nhật, password_hash là bcrypt 60 ký tự |
| Dọn dữ liệu                 | Tài khoản có marker thử còn 0; backend 18080 và frontend 5174 đã dừng; server 5173/8080 của người dùng vẫn trả HTTP 200                                |
| Hồi quy phân công           | 40 tình huống Chrome qua, gồm phân trang nhân viên, trạng thái ACTIVE/LOCKED, lỗi và responsive/axe                                                    |
| Độ nhạy test quyền          | Đảo điều kiện chặn ADMIN trong bản sao biệt lập làm test quyền thất bại đúng dự kiến; SHA256 mã nguồn gốc không đổi; bản sao đã dọn                    |

Hồi quy bảng giá cũng qua **21** tình huống Chrome. Đã sửa điểm chờ trong script kiểm tra bảng giá để đọc đơn giá sau khi tiêu đề bước xác nhận xuất hiện, tránh đọc giao diện cũ trước khi GET mới hoàn tất; không đổi chức năng bảng giá. Đã rà các tệp triển khai theo contract và quy ước hiện có, không sửa backend/schema hoặc dự án WebPCMaker.

HTTP fixture chỉ chứng minh UI theo tình huống định sẵn. Bộ live dùng ba cookie jar riêng và API/SQL thật để chứng minh hiệu lực khóa tài khoản; không dùng fixture thay backend trong sản phẩm. Các mật khẩu live được tạo ngẫu nhiên qua biến môi trường, không có trong JSON kết quả. Các lượt trình duyệt cuối cùng dùng bản build production qua Vite preview để tránh HMR/dependency optimizer trong lúc kiểm tra.

<a id="doc-frontend-vcoi-docs-admin-accounts-ui-md--khôi-phục-môi-trường-phát-triển"></a>
##### Khôi phục môi trường phát triển

Kiểm tra bổ sung ở cổng 5173 phát hiện lỗi EBUSY khi Vite tối ưu dependency phát hiện muộn của route lazy; module icon mới trả 404 dù bản production hoạt động. Đã khởi động lại đúng tiến trình Vite của workspace, giữ nguyên backend, và bổ sung optimizeDeps.entries trong vite.config.js để quét index.html cùng toàn bộ mã nguồn trang trước khi trình duyệt mở route (loại trừ test). Kiểm tra Chrome chỉ đọc trên 5173 sau sửa đã tải được bảng tài khoản, không có pageerror và không có request ghi. Không đổi CORS hoặc proxy backend. Các cổng thử riêng đã đóng; frontend phát triển tiếp tục chạy ở 5173.

<!-- source-end:doc-frontend-vcoi-docs-admin-accounts-ui-md -->

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md"></a>
### Admin quản lý danh mục và vật liệu

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-catalog-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-catalog-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--admin-quản-lý-danh-mục-và-vật-liệu"></a>
#### Admin quản lý danh mục và vật liệu

Frontend VCoi kết nối các API danh mục/vật liệu Spring Boot + SQL Server hiện có. Không sửa backend, schema hoặc dự án tham khảo WebPCMaker; không thêm dependency.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--cách-sử-dụng"></a>
##### Cách sử dụng

Đăng nhập **ADMIN**. Sidebar quản trị có thêm:

| Trang    | Đường dẫn            | Thao tác                                                       |
| -------- | -------------------- | -------------------------------------------------------------- |
| Danh mục | `/quan-tri/danh-muc` | Thêm, sửa tên/mô tả, ẩn và hiện lại                            |
| Vật liệu | `/quan-tri/vat-lieu` | Thêm, sửa thông tin/chuyển nhóm, ngừng và nhận thu mua trở lại |

Chọn **Thêm danh mục** hoặc **Thêm vật liệu**, nhập thông tin rồi lưu. Nút **Sửa** đọc lại chi tiết mới nhất trước khi mở form. Vật liệu bắt buộc tên, phân hạng, danh mục và đơn vị KG; mô tả, loại không tiếp nhận và URL ảnh là tùy chọn trong **Thông tin bổ sung**. Chưa có danh mục thì giao diện hướng đến trang tạo danh mục trước.

Để ẩn nhóm hoặc ngừng nhận vật liệu, chọn thao tác trong bảng, đọc phần ảnh hưởng rồi xác nhận. **Giữ nguyên** đóng bước xác nhận mà không ghi dữ liệu. Các thao tác khôi phục cũng có xác nhận riêng. Bộ lọc và trang hiện tại nằm trên URL, giữ khi tải lại. Bảng có phân trang 20 bản ghi; điện thoại cuộn bảng trong khung riêng.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--hiểu-đúng-trạng-thái"></a>
##### Hiểu đúng trạng thái

- **Đang hiện / Đã ẩn** thuộc danh mục. Ẩn nhóm tạm loại các vật liệu trong nhóm khỏi bảng giá công khai và lựa chọn đặt lịch.
- **Đang nhận / Đã ngừng** thuộc riêng vật liệu. Ẩn hoặc hiện lại danh mục không thay cờ này.
- Vật liệu chỉ hiển thị công khai khi **accepted AND categoryActive**. Bảng hiển thị cả cờ thu mua và hiệu lực như **Ẩn theo danh mục** để tránh hiểu nhầm.
- Admin có thể chuẩn bị vật liệu trong nhóm đang ẩn. Form báo rõ việc lưu chưa làm vật liệu hiển thị công khai.
- Không xóa vật lý danh mục/vật liệu, không xóa giá, cân, báo giá hoặc khoản chi đã lưu. Đơn cũ vẫn đọc được. Tên ở chi tiết ước tính đơn cũ có thể đổi theo tên danh mục hiện tại; snapshot tên/giá trong báo giá đã chốt vẫn giữ nguyên theo backend.
- Vật liệu mới chưa có giá xuất hiện công khai với **Liên hệ báo giá**, không tự tạo giá hoặc giá 0. Quản lý bảng giá đã có tại `/quan-tri/bang-gia`; xem [hướng dẫn bảng giá](#doc-frontend-vcoi-docs-admin-prices-ui-md).

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--api-được-sử-dụng"></a>
##### API được sử dụng

Nguồn chuẩn: `../ecothugom-backend/docs/admin-catalog.md`, `admin-catalog-openapi.json` và `AdminCatalogController/Requests/Response/Service.java`.

| Nhóm     | API                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------- |
| Danh mục | GET/POST `/api/admin/material-categories`; GET/PUT `/{id}`; PATCH `/{id}/status` với `{isActive}` |
| Vật liệu | GET/POST `/api/admin/materials`; GET/PUT `/{id}`; PATCH `/{id}/status` với `{accepted}`           |

POST/PUT chỉ chứa các trường thông tin được cho phép. Không gửi cờ trạng thái, giá, version hoặc ID trong body thông tin. Tên/mô tả được trim, các mô tả tùy chọn trống thành null. Vật liệu gửi đủ categoryId/name/grade/unit/description/excludedItems/imageUrl. CategoryId được kiểm tra dương, tồn tại theo API; danh sách chọn gồm cả nhóm ẩn, tải qua đủ trang với giới hạn 100 trang × 100 bản ghi và báo lỗi nếu không tải đủ.

URL ảnh chỉ nhận HTTP/HTTPS có host, không tài khoản/mật khẩu hoặc khoảng trắng. Module lưu URL, không tải file ảnh lên. Giao diện quản trị không tự fetch/preview ảnh ngoài từ URL đã nhập.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--thiết-kế-theo-taste-skill"></a>
##### Thiết kế theo Taste Skill

Design Read: giao diện quản lý dữ liệu của đại lý, gọn và dễ đối chiếu, tiếp nối admin VCoi. Chế độ preserve, **DESIGN_VARIANCE 3 / MOTION_INTENSITY 2 / VISUAL_DENSITY 6**. Giữ AdminLayout, màu xanh chanh, tokens sáng/tối, Be Vietnam Pro, Phosphor, kiểu bảng/nút và URL cũ. Hai mục sidebar mới có trạng thái chọn, breadcrumb và tiêu đề riêng; không thêm hero, số liệu giả hoặc hiệu ứng trang trí.

Taste Skill áp dụng cho nhận diện/copy/nhịp bố cục; bảng, biểu mẫu và trạng thái dùng frontend-ui-engineering. Form hai cột ở desktop, một cột trên điện thoại, có nhãn và lỗi theo trường. Thông tin tùy chọn được thu gọn. Các trạng thái tải/rỗng/lỗi/thành công và bước xác nhận không dùng màu sắc làm dấu hiệu duy nhất. Nhãn hiển thị của nút khớp tên truy cập cho trình đọc màn hình.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--bảo-vệ-thao-tác-và-phục-hồi-lỗi"></a>
##### Bảo vệ thao tác và phục hồi lỗi

- Route ADMIN và session cookie hiện có; mỗi write lấy CSRF mới. Không lưu thông tin phiên/bí mật vào localStorage.
- Khóa đồng bộ chống nhấp đúp. Không tự retry POST/PUT/PATCH. Lỗi trùng tên/tổ hợp 409 giữ form để admin sửa, vì module không có version danh mục.
- 404 hoặc kết quả ghi chưa rõ khóa thao tác. Chỉ sau khi tải lại đủ dữ liệu mới đóng form cũ và cho tiếp tục; không tự gửi lại một lần tạo đang chưa rõ kết quả.
- Trước bước xác nhận trạng thái, đọc lại chi tiết nhưng giữ **ý định đã chọn**. Nếu admin khác đã thực hiện trạng thái đích, chỉ tải lại danh sách, không đảo cờ theo dữ liệu cũ.
- Response được kiểm tra schema, ID, trường đã lưu và công thức available. Phản hồi ghi sai lệch được coi là chưa xác định. Không hiển thị SQL/raw server errors.
- Chỉ cập nhật khi còn đúng phiên ADMIN. Sau ghi làm mới danh mục/vật liệu, category options, bảng giá và vật liệu đặt lịch; không khôi phục cache riêng khi phiên đã đổi.
- Backend chưa có version cho module này. Sửa thông tin đồng thời vẫn áp dụng theo thứ tự server xử lý; bước đọc detail trước sửa không cung cấp cơ chế chống ghi đè hoàn toàn. PUT thông tin không thay cờ trạng thái.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--tệp-triển-khai-chính"></a>
##### Tệp triển khai chính

- `src/pages/AdminCatalogPage.jsx`: hai trang quản trị theo cấu hình route.
- `src/features/admin/catalog-model.js`, `catalog-api.js`: schema, filter URL và client API.
- `useAdminCatalog.js`: đọc/lưu, khóa, phục hồi và đồng bộ cache.
- `CatalogForm.jsx`, `CatalogTable.jsx`, `CatalogFilters.jsx`, `CatalogStatusConfirm.jsx`: UI tập trung theo chức năng.
- `AdminLayout.jsx`, `src/App.jsx`: sidebar, route và tiêu đề trang.
- `src/components/Pagination.jsx`: thêm noun/ariaLabel tùy chọn; các trang cũ giữ mặc định.
- `src/styles/admin-catalog.css`: responsive theo tokens admin hiện có.
- `scripts/verify-admin-catalog.mjs`, `fixtures/admin-catalog.mjs`: kiểm tra Chrome qua HTTP mô phỏng.
- `scripts/verify-live-catalog.ps1`, `verify-live-catalog.mjs`: kiểm tra backend và SQL thật bằng dữ liệu tổng hợp.

<a id="doc-frontend-vcoi-docs-admin-catalog-ui-md--kiểm-tra-và-bằng-chứng"></a>
##### Kiểm tra và bằng chứng

Ngày 24/10/2026 trên Windows, Chrome. Các kết quả được tách giữa HTTP mô phỏng và backend/SQL thật.

Hồi quy `test:dispatch` **40 kịch bản** và `test:browser` **21 kịch bản** đều đạt; admin đơn và website/bảng giá tiếp tục hoạt động. Lượt chốt `npm run lint`, `npm run format:check`, `npm run build` đều thành công sau căn chỉnh giao diện cuối. Quét axe bao gồm form và bước xác nhận tại 320/1440 px cả sáng/tối.

| Kiểm tra                          | Kết quả                                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                   | Lint không cảnh báo; **268 test / 28 file** đạt; build thành công                                                                                                                   |
| Test mới                          | **12 model/API + 9 component**: schema, URL, body, trạng thái riêng, nhiều trang danh mục, xác nhận, lỗi/đọc lại, đổi phiên và trạng thái do admin khác đã áp dụng                  |
| `npm run test:catalog`            | **20 kịch bản Chrome qua HTTP mô phỏng**: thêm/sửa/ẩn/hiện, ngừng/nhận lại, bộ lọc/phân trang, lỗi 401/403/404/409/500, dữ liệu đã ghi nhưng mất phản hồi, phân quyền và responsive |
| `scripts/verify-live-catalog.ps1` | **14 bước UI với backend/SQL thật**, SQL invariants PASS và cleanup PASS                                                                                                            |
| Độ nhạy test                      | Thay AND bằng OR trong công thức available ở bản sao tạm: test phát hiện lỗi; hash mã chính không đổi, đã dọn bản sao                                                               |

Kiểm tra layout ở **320, 768, 1024, 1440 px**, cả sáng/tối; bảng chỉ cuộn trong khung, không tràn toàn trang, một main. Quét axe tại 320/1440 px, mở form bằng bàn phím, xem ảnh desktop sáng và điện thoại tối. Đã sửa lỗi nhãn nút ẩn/hiện không khớp tên truy cập và căn đầu các trường để dòng gợi ý không làm lệch vị trí input. Quét tự động chỉ là phạm vi kiểm tra nêu trên, không phải chứng nhận toàn sản phẩm.

Luồng thật tạo hai danh mục và hai vật liệu có tên bắt đầu bằng `VCOI-CATALOG-LIVE-<GUID>`. Admin sửa tên/mô tả nhóm, tạo vật liệu trong nhóm ẩn, sửa/chuyển vật liệu sang nhóm đang hiện, ngừng thu mua, ẩn/hiện nhóm và nhận lại. GET công khai xác nhận vật liệu ẩn/ngừng không còn được chọn; vật liệu mới có hiệu lực nhưng chưa có giá trả CONTACT_FOR_QUOTE. Không tự tải ảnh URL ngoài. SQL đối chiếu đúng thông tin sửa, categoryId và các cờ trạng thái độc lập.

Script không tạo đơn hoặc giá cho dữ liệu tổng hợp. Cleanup từ chối xóa nếu xuất hiện bản ghi khác hoặc tham chiếu giá/đơn/báo giá, chỉ xóa đúng vật liệu, danh mục và admin thử có marker riêng. Server thử được dừng; server của người dùng 8080/5173 được giữ nguyên. Không chạy khi cổng thử 18080/5174 đang có tiến trình khác.

Postman CLI chưa có trên máy. Đợt này dùng Vitest, Playwright và các contract local có sẵn; không tạo hoặc đồng bộ workspace Postman. Không chạy lại toàn bộ test backend vì không thay mã backend; bằng chứng tích hợp thật là các bước UI/API/SQL ở trên.

Bằng chứng tại máy:

- `.cache/admin-catalog/results.json`, `mutation.json` và ảnh danh sách/form/xác nhận tại 320/1440 px sáng/tối.
- `.cache/live-catalog/result.json`, `categories.png`, `materials.png` và log server thử.

Màn hình tiếp theo là **quản lý bảng giá**; phần này không thay giá hiện hành hoặc tạo phiên bản giá.

<!-- source-end:doc-frontend-vcoi-docs-admin-catalog-ui-md -->

<a id="doc-frontend-vcoi-docs-admin-design-md"></a>
### Giao diện quản trị VCoi tham khảo PCMaker

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-design.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-design-md -->
<a id="doc-frontend-vcoi-docs-admin-design-md--giao-diện-quản-trị-vcoi-tham-khảo-pcmaker"></a>
#### Giao diện quản trị VCoi tham khảo PCMaker

Chỉ đọc `D:\WebPCMaker\frontend`. Nguồn tham khảo: `src/pages/Admin.jsx` (shell, Dashboard, AdminOrders), `src/functional.css` (topbar/sidebar, table, stat-strip), `src/index.css` (tokens). Không sửa, cài dependency hoặc chạy build trong dự án đó.

<a id="doc-frontend-vcoi-docs-admin-design-md--hướng-thiết-kế"></a>
##### Hướng thiết kế

Khu quản trị vận hành một đại lý: bố cục gọn, sidebar 240 px, topbar 74 px, nền trung tính, đường viền mảnh và màu nhấn xanh. Giữ font Be Vietnam Pro cùng component/form, session cookie và CSRF của VCoi. Chỉ thay giao diện các route ADMIN; trang khách/nhân viên và trang công khai vẫn dùng bố cục hiện tại.

- Topbar: VCoi / Quản trị đại lý, tên admin, về website, đăng xuất.
- Sidebar: danh sách tất cả đơn và các hàng chờ xác nhận, phân công, đã phân công; link có chức năng thật.
- Trang danh sách: bốn chỉ số đếm từ totalElements của API, lọc trạng thái, bảng mã đơn/khách/giờ/địa chỉ/trạng thái và link xem xử lý, phân trang.
- Chi tiết: breadcrumb về danh sách, trạng thái, panel xác nhận/phân công đã xây, điểm thu gom và vật liệu. Không thay payload hoặc quy tắc backend.
- Màn hình nhỏ: menu chuyển thành nhóm link phía trên, số liệu 2 cột, bảng cuộn trong vùng riêng có nhãn và truy cập bàn phím. Màu sáng/tối theo hệ điều hành, định nghĩa riêng trong `.admin-shell` để không đổi trang giới thiệu.
- Tải/rỗng/lỗi/quyền/phiên hết hạn vẫn có nội dung và retry; không hiển thị số liệu giả hoặc phần quản lý chưa có UI.

Kiểm tra lại luồng xác nhận/phân công, URL lọc/phân trang, quyền, logout, cache thống kê, responsive 320/768/1024/1440, sáng/tối và axe; chạy lint/test/build. Kiểm tra API thật với dữ liệu thử tách biệt và dọn dữ liệu sau kiểm tra.

<a id="doc-frontend-vcoi-docs-admin-design-md--bổ-sung-theo-yêu-cầu-tách-trang-chức-năng"></a>
##### Bổ sung theo yêu cầu tách trang chức năng

Router đã tổ chức theo layout: `PublicLayout` cho trang chủ/bảng giá, `ServiceLayout account` cho đăng nhập/đăng ký, `ServiceLayout` dưới guard CUSTOMER/COLLECTOR cho các trang chức năng, `AdminLayout` dưới guard ADMIN cho quản trị. Các màn hình từ chối quyền/kiểm tra phiên dùng shell chức năng, có đường về khu vực đúng vai trò. Mỗi layout có một landmark main và cùng đích skip link. Trang chức năng thêm sau này phải đặt trong layout đúng vai trò, giữ link về website và không dùng footer quảng bá.

<!-- source-end:doc-frontend-vcoi-docs-admin-design-md -->

<a id="doc-frontend-vcoi-docs-admin-dispatch-spec-md"></a>
### Admin xác nhận và phân công trên frontend

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-dispatch-spec.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-dispatch-spec-md -->
<a id="doc-frontend-vcoi-docs-admin-dispatch-spec-md--admin-xác-nhận-và-phân-công-trên-frontend"></a>
#### Admin xác nhận và phân công trên frontend

<a id="doc-frontend-vcoi-docs-admin-dispatch-spec-md--phạm-vi-và-hợp-đồng"></a>
##### Phạm vi và hợp đồng

Mở rộng trang `/quan-tri/don/:id`, giữ thiết kế xanh lá/cam, panel và form hiện có. Chỉ ADMIN có thao tác; khách và nhân viên vẫn đọc đơn theo quyền. Không đổi backend, schema SQL hoặc dependency.

- PENDING, chưa có collector: form lý do tùy chọn (tối đa 500 ký tự), nút **Xác nhận đơn**. POST `/api/admin/orders/{id}/confirm` với `{version,reason}`.
- CONFIRMED, chưa có collector: chọn COLLECTOR ACTIVE, xem lại tên/số điện thoại cùng khung giờ đơn, nhập lý do rồi **Phân công nhân viên**. POST `/api/admin/orders/{id}/assign` với `{version,collectorId,reason}`.
- Danh sách nhân viên lấy toàn bộ các trang GET `/api/admin/users?page=...&size=100`, lọc role/status. Không giả định trang đầu chứa đủ nhân viên, không công bố dữ liệu người dùng khác. Backend quyết định lịch trống khi phân công; danh sách ACTIVE không đồng nghĩa rảnh.
- Thành công hiển thị trạng thái và version server trả về, cập nhật detail cache và vô hiệu hóa danh sách đơn của admin. Hiển thị nhân viên đã giao từ ID server, không suy diễn từ lựa chọn cũ.
- Dùng session cookie/CSRF hiện có, không tự gửi lại POST, khóa khi đang gửi, không tự chuyển trạng thái lạc quan. HTTP 409/404 hoặc kết quả không chắc chắn yêu cầu đọc lại đơn và danh sách nhân viên trước thao tác tiếp theo; lỗi tải lại giữ khóa. Không hiển thị detail lỗi thô từ server.
- Tải/rỗng/lỗi danh sách nhân viên có thông báo và thử lại. Các trạng thái khác không có nút xác nhận/phân công lần đầu. Giữ dữ liệu riêng tư trong cache theo ID và vai trò phiên.

<a id="doc-frontend-vcoi-docs-admin-dispatch-spec-md--tiêu-chí-kiểm-tra"></a>
##### Tiêu chí kiểm tra

Kiểm thử HTTP client và component: payload/version, lọc nhân viên qua nhiều trang, đầu vào, trạng thái hợp lệ, một POST khi nhấn liên tiếp, cache, 409/404/403/401, mất kết nối và phục hồi. Browser: toàn luồng và lỗi qua HTTP mô phỏng, bàn phím, responsive 320/768/1024/1440 sáng/tối, axe. Tích hợp thật: tạo dữ liệu riêng bằng script kiểm tra hiện có, xác nhận và phân công qua UI, kiểm tra SQL và nhân viên nhìn thấy đơn, xóa đúng dữ liệu thử. Chạy lint/test/build và format.

Nguồn chuẩn: `../../ecothugom-backend/docs/dispatch-orders-openapi.json`, `dispatch-orders.md`, `auth-openapi.json` và controller/service backend tương ứng.

<!-- source-end:doc-frontend-vcoi-docs-admin-dispatch-spec-md -->

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md"></a>
### Admin xử lý khiếu nại khách hàng

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-disputes-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-disputes-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--admin-xử-lý-khiếu-nại-khách-hàng"></a>
#### Admin xử lý khiếu nại khách hàng

Hoàn tất ngày 25/10/2026. Frontend React kết nối API Spring Boot và SQL Server hiện có; không đổi nghiệp vụ, schema, phân quyền hay dependency.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--sử-dụng"></a>
##### Sử dụng

Đăng nhập ADMIN, chọn **Khiếu nại** trong menu hoặc mở `http://127.0.0.1:5173/quan-tri/khieu-nai`.

1. Danh sách mặc định hiển thị **Chờ tiếp nhận (OPEN)**. Chọn Đang xem xét, Đã giải quyết, Đã từ chối hoặc Tất cả; trạng thái và trang được lưu trong URL.
2. Chọn **Xem** để tải chi tiết mới nhất cùng đơn: lý do, ảnh đã lưu ở backend, người gửi, thời điểm, thông tin liên hệ thu gom, trạng thái hiện tại và trạng thái trước khiếu nại. Có liên kết mở đơn.
3. **Tiếp nhận khiếu nại → Xác nhận tiếp nhận**: chuyển OPEN sang IN_REVIEW, đơn vẫn DISPUTED. Chọn **Tiếp tục xem xét** để mở lại dữ liệu mới và kết luận.
4. **Giải quyết khiếu nại** hoặc **Từ chối khiếu nại**: nhập kết luận không rỗng tối đa 1000 ký tự → **Xem lại kết luận** → xác nhận. Có thể sửa kết luận trước khi gửi. Backend cho kết luận trực tiếp từ OPEN hoặc từ IN_REVIEW.
5. Kết quả chính thức hiển thị kết luận, admin và thời điểm lưu theo giờ Việt Nam. Khiếu nại đã đóng chỉ đọc; khách xem kết luận trong **Hỗ trợ và khiếu nại → Lịch sử khiếu nại** tại chi tiết đơn của mình.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--quy-tắc-dữ-liệu"></a>
##### Quy tắc dữ liệu

| Thao tác           | Khiếu nại                 | Đơn thu gom                              |
| ------------------ | ------------------------- | ---------------------------------------- |
| Khách mở khiếu nại | OPEN                      | DISPUTED, lưu `previousOrderStatus`      |
| Admin tiếp nhận    | OPEN → IN_REVIEW          | Giữ DISPUTED                             |
| Admin giải quyết   | OPEN/IN_REVIEW → RESOLVED | Phục hồi chính xác `previousOrderStatus` |
| Admin từ chối      | OPEN/IN_REVIEW → REJECTED | Phục hồi chính xác `previousOrderStatus` |

Các trạng thái trước khiếu nại hợp lệ: EN_ROUTE, ARRIVED, AWAITING_SELLER_APPROVAL, AWAITING_PAYMENT, COMPLETED, CANCELLED. Mỗi thao tác admin tăng version đơn và thêm audit. Kết luận đã chốt không thể ghi đè.

Khiếu nại sau thanh toán giữ nguyên payment, số tiền, thời điểm hoàn tất, báo giá và phiếu cân. Đóng khiếu nại trả đơn về COMPLETED. Giao diện không tạo hoàn tiền hoặc gửi yêu cầu thay số tiền. Với lịch sử đã đóng, trạng thái đơn hiển thị là trạng thái hiện tại, có thể đã tiến thêm hoặc có khiếu nại mới.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--api-đang-sử-dụng"></a>
##### API đang sử dụng

Nguồn chuẩn: `ecothugom-backend/SPEC-disputes.md`, `DisputeController.java`, `DisputeService.java`, `DisputeRequests.java` và `docs/backend-completion-openapi.json` trong backend.

| API                                     | Dữ liệu                                                       |
| --------------------------------------- | ------------------------------------------------------------- |
| GET `/api/admin/disputes`               | `status` tùy chọn, `page`, `size`; UI dùng 20 dòng/trang      |
| GET `/api/admin/disputes/{id}`          | Chi tiết, trạng thái và version đơn hiện tại                  |
| GET `/api/admin/orders/{id}`            | Đọc đơn để đối chiếu ID/trạng thái/version                    |
| POST `/api/admin/disputes/{id}/review`  | `{ "version": 6 }`                                            |
| POST `/api/admin/disputes/{id}/resolve` | `{ "version": 7, "resolution": "Kết luận xử lý" }`            |
| POST `/api/admin/disputes/{id}/reject`  | `{ "version": 7, "resolution": "Lý do và kết luận từ chối" }` |

Version trong ví dụ phải thay bằng version thực tế đã đọc. API không có `disputeVersion` hoặc người/thời điểm tiếp nhận riêng; giao diện không tự dựng những trường đó. Backend lưu người và giờ chốt kết luận, còn thao tác tiếp nhận được ghi ở audit của đơn. Không có bộ lọc tìm kiếm/orderId hay thao tác xóa trong contract này.

Giữ cookie HttpOnly, lấy CSRF mới trước mỗi POST. Actor lấy từ session phía backend. Chỉ nhận các trường được cho phép; không gửi status, tiền hay resolvedBy do form nhập. URL ảnh chỉ chấp nhận dạng `/api/evidence/<32 ký tự hex>.png|jpg`, hiển thị qua cookie và quyền của backend. Không tải ảnh từ URL bên ngoài.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--xung-đột-lỗi-và-cache"></a>
##### Xung đột, lỗi và cache

- Trước khi mở form, đọc chi tiết khiếu nại cùng đơn rồi đối chiếu ID/trạng thái/version. Quyết định gửi đúng snapshot admin đã xem, không tự đổi version hoặc tự gửi lại POST.
- Khóa đồng bộ chống nhấp đúp trong lúc ghi. Kết luận bắt buộc, trim khoảng trắng, tối đa 1000 ký tự; React hiển thị nội dung như văn bản.
- 400/404/409 hoặc ghi mất phản hồi/5xx/kết quả sai: khóa quyết định cho đến khi **Tải lại danh sách** thành công. Sau đó mở lại khiếu nại để đọc kết quả thật trước khi xử lý tiếp. Tải lại thất bại vẫn giữ khóa.
- Phản hồi thành công phải đúng ID, nội dung gốc, trạng thái trước khiếu nại, kết luận/actor và version đơn tăng một. Phản hồi không khớp được xem là chưa xác định kết quả.
- Cache riêng theo ID tài khoản/ADMIN; làm mới danh sách khiếu nại, đơn, số lượng đơn và yêu cầu hủy/đổi lịch sau ghi. Không ghi đối tượng khiếu nại vào cache chi tiết đơn. Bỏ qua kết quả cũ nếu phiên đã thay đổi.
- Giữ kết quả chính thức khi danh sách tải lại lỗi. Phiên hết hạn đưa về đăng nhập. Có trạng thái tải/rỗng/lỗi/thử lại và thông báo ảnh không tải được.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--thiết-kế-và-kiểm-tra"></a>
##### Thiết kế và kiểm tra

Taste Skill: preserve, `DESIGN_VARIANCE=3`, `MOTION_INTENSITY=2`, `VISUAL_DENSITY=6`, tiếp nối hệ thống VCoi xanh rừng/xanh chanh, Be Vietnam Pro và Phosphor. Với bảng và form nghiệp vụ, dùng frontend-ui-engineering và các thành phần hiện có. Không thêm hero, thư viện hay hiệu ứng marketing. Trang nằm trong AdminLayout, tách khỏi trang giới thiệu.

| Kiểm tra thực tế                   | Kết quả                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                    | 400 test / 36 tệp; lint và production build thành công                                                              |
| Hai tệp test mới                   | 27 model/API + 9 component, đã chạy thất bại trước triển khai rồi chạy thành công                                   |
| `npm run test:disputes`            | 21 tình huống Chrome với HTTP fixture theo contract                                                                 |
| Responsive                         | 320/768/1024/1440 px, sáng/tối; không tràn ngang toàn trang; bảng cuộn ngang                                        |
| Accessibility                      | axe ở chi tiết/xác nhận 320 và 1440 px sáng/tối, không vi phạm; kiểm tra focus và Enter xác nhận                    |
| `scripts/verify-live-disputes.ps1` | 15 kiểm tra với backend và SQL thật; 6 POST qua UI, không lặp khi nhấp đúp                                          |
| SQL                                | 4 khiếu nại, 2 giải quyết/2 từ chối, đúng actor/kết luận; đơn ARRIVED v10 và COMPLETED v13, audit lần lượt 11 và 14 |
| Tiền và biên nhận                  | Payment ID/số tiền/giờ, completedAt, quote items và phiếu cân giữ nguyên trong và sau khiếu nại đã thanh toán       |
| Hồi quy                            | Khách hàng 27; admin hủy/đổi lịch 23, đều thành công                                                                |
| Độ nhạy test                       | Đảo điều kiện version trong bản sao làm test thất bại đúng dự kiến; SHA256 nguồn gốc giữ nguyên                     |

Lighthouse trên production preview, màn hình desktop và phiên admin HTTP fixture: Performance 100, Accessibility 100, Best Practices 100; không có cảnh báo. Đây là kết quả cục bộ với dữ liệu mô phỏng và không giới hạn tốc độ mạng, không phải đo hiệu năng backend/hosting thực tế. Báo cáo ở `.cache/admin-disputes/lighthouse.json`.

Bộ Chrome kiểm tra tiếp nhận rồi giải quyết, từ chối trực tiếp, kết luận bắt buộc/sửa trước xác nhận, lịch sử chỉ đọc, filter/phân trang/reload, xung đột admin, phản hồi 500 sau ghi, 200 sai dữ liệu, 404, ảnh lỗi, phiên hết hạn và chặn vai trò khác. Bằng chứng mô phỏng không thay thế kiểm tra SQL thật.

Bài live chạy production preview 5174 và backend thử 18080, kết nối EcoThuGomDB trên `localhost,1435` bằng Windows Authentication. Dùng ba tài khoản tổng hợp và hai đơn có marker riêng; đọc giá vật liệu hiện có, không thay giá/danh mục. Dữ liệu và ảnh thử được dọn trong `finally`; giữ server người dùng 5173/8080. Cần JDK, sqlcmd, JAR backend hiện có và ít nhất một vật liệu đang có giá. Không chạy đồng thời các script live dùng cùng cổng.

Postman CLI/tool không khả dụng trong phiên này. Đã dùng hợp đồng OpenAPI, bộ kiểm thử HTTP/Chrome và script live sẵn có của repo; không tạo hoặc đồng bộ workspace Postman/cloud.

Kết quả và ảnh: `.cache/admin-disputes/` và `.cache/live-disputes/`. Chạy Chrome fixture trên dev server 5173 hoặc đặt `FRONTEND_URL` trỏ tới production preview. Không dùng tài khoản thật để chạy script live.

<a id="doc-frontend-vcoi-docs-admin-disputes-ui-md--tệp-triển-khai-chính"></a>
##### Tệp triển khai chính

- `src/pages/AdminDisputesPage.jsx`: trang và bộ lọc/phân trang URL.
- `src/features/admin/disputes-model.js`, `disputes-api.js`, `useAdminDisputes.js`: hợp đồng, xử lý và cache.
- `DisputeTable`, `DisputeDetail`, `DisputeDecisionForm`, `DisputeDecisionResult`: các thành phần hiển thị.
- `src/styles/admin-disputes.css`, `src/App.jsx`, `AdminLayout.jsx`: bố cục, route và menu.
- `src/features/customer/DisputeHistory.jsx`: nhãn OPEN là chờ tiếp nhận, khớp trạng thái backend.
- Các test, HTTP fixture và script Chrome/live được lưu cùng frontend để chạy lại.

Workspace không có Git repository nên không tạo commit hoặc PR. Không chỉnh sửa dự án tham khảo WebPCMaker.

<!-- source-end:doc-frontend-vcoi-docs-admin-disputes-ui-md -->

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md"></a>
### Admin xử lý yêu cầu hủy và đổi lịch

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-order-changes-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-order-changes-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--admin-xử-lý-yêu-cầu-hủy-và-đổi-lịch"></a>
#### Admin xử lý yêu cầu hủy và đổi lịch

Trang `/quan-tri/yeu-cau` dùng API Spring Boot hiện có. Đăng nhập ADMIN rồi chọn **Yêu cầu hủy/đổi lịch** trên sidebar. Taste Skill theo hướng preserve 3/2/6: giữ AdminLayout, xanh rừng/xanh chanh, Be Vietnam Pro, Phosphor, bảng và form cùng hệ thống hiện tại.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--sử-dụng"></a>
##### Sử dụng

1. Trang mặc định hiển thị **Chờ xử lý**. Có bộ lọc tất cả/chờ/chấp thuận/từ chối/đã rút và phân trang 20 bản ghi; bộ lọc và trang nằm trên URL.
2. Chọn **Xem** để đọc lý do, người gửi, thông tin đơn mới nhất, lịch hiện đang lưu, lịch lúc khách gửi và lịch mới đề xuất. Có liên kết đến chi tiết đơn.
3. Chọn **Chấp thuận yêu cầu** hoặc **Từ chối yêu cầu**. Nhập phản hồi cho khách tối đa 500 ký tự, không bắt buộc.
4. Chọn **Xem lại quyết định**, đọc tác động, rồi **Xác nhận chấp thuận / Xác nhận từ chối**. Chưa xác nhận thì chưa gửi quyết định.
5. Kết quả chính thức có quyết định, người/thời gian xử lý, phản hồi và trạng thái đơn. Yêu cầu đã xử lý hoặc rút chỉ được xem. Có thể đổi bộ lọc để xem lại lịch sử.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--quy-tắc-nghiệp-vụ"></a>
##### Quy tắc nghiệp vụ

| Thao tác                              | Kết quả                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Chấp thuận CANCEL                     | Đơn chuyển CANCELLED; lưu thời điểm/lý do và audit. Chỉ cho đơn chưa COMPLETED/CANCELLED/DISPUTED.                |
| Chấp thuận RESCHEDULE trước khởi hành | Áp dụng lịch đề xuất, giữ trạng thái và nhân viên nếu có; backend kiểm tra hoạt động và trùng lịch của nhân viên. |
| Chấp thuận RESCHEDULE khi EN_ROUTE    | Áp dụng lịch mới, về CONFIRMED và bỏ collector. Nút **Mở đơn để phân công lại** dẫn đến trang điều phối hiện có.  |
| Từ chối                               | Giữ lịch, trạng thái và collector; lưu phản hồi và tăng version đơn/yêu cầu.                                      |
| Yêu cầu cuối hoặc đã rút              | APPROVED/REJECTED/WITHDRAWN chỉ xem.                                                                              |

Mọi yêu cầu hủy của khách cần admin, kể cả trước khởi hành. Đổi lịch chỉ được chấp thuận đến EN_ROUTE; từ ARRIVED không dời lịch nữa. Khung giờ đề xuất phải còn ở tương lai. Yêu cầu còn PENDING nhưng đơn đã kết thúc hoặc lịch đề xuất đã qua không được chấp thuận; admin có thể từ chối để ghi kết luận. Không sửa lịch đề xuất bằng form admin hoặc thay đổi snapshot tiền/báo giá đã chốt.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--api-và-nhất-quán-dữ-liệu"></a>
##### API và nhất quán dữ liệu

Nguồn chuẩn: `OrderChangeController`, `OrderChangeService`, `OrderChangeRequests`, `SPEC-order-changes.md` trong backend và schema customer hiện có.

| API                                                                  | Nội dung                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| GET `/api/admin/order-change-requests?status=PENDING&page=0&size=20` | Danh sách lọc trạng thái, request ID giảm dần; bỏ status để xem tất cả. |
| GET `/api/admin/orders/{id}`                                         | Đơn thực tế mới nhất trước khi quyết định.                              |
| POST `/api/admin/order-change-requests/{id}/approve`                 | `{version, requestVersion, responseNote}`                               |
| POST `/api/admin/order-change-requests/{id}/reject`                  | Cùng cấu trúc review, người xử lý lấy từ session.                       |

Không có GET một request theo ID trong contract hiện có. Khi mở, UI đọc lại trang đang xem và đơn song song, tìm đúng request ID rồi đối chiếu orderId/orderStatus/orderVersion. Nếu request bị đẩy khỏi trang, đổi trạng thái hoặc đơn thay đổi trong lúc đọc, yêu cầu tải lại thay vì đoán dữ liệu.

Quyết định dùng đúng **version đơn và version yêu cầu đã xem**. Không lấy version mới rồi tự gửi lại. Backend CAS và transaction là lớp bảo vệ cuối nếu dữ liệu đổi sau bước xem; phản hồi phải có request version +1, order version +1, trạng thái đích và processedBy đúng admin. Định danh, lý do và các khung giờ trong request phải khớp snapshot. ID/trạng thái/version/ghi chú phản hồi sai lệch được coi là kết quả chưa xác định.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--thao-tác-và-phục-hồi"></a>
##### Thao tác và phục hồi

- Cookie phiên, ADMIN route và CSRF mới mỗi POST; không lưu bí mật vào localStorage.
- Khóa đồng bộ chống nhấp đúp. Không retry POST tự động.
- 400/404/409 hoặc kết quả không rõ khóa quyết định; phải tải lại danh sách và mở yêu cầu để xem dữ liệu mới. Đọc lại thất bại giữ khóa.
- Không hiển thị SQL/raw server errors. Không cho form gửi actor, orderId hoặc version tự chọn.
- Query theo user ID và ADMIN; chỉ cập nhật state/cache khi còn đúng phiên. Khi phiên đổi, không khôi phục kết quả riêng tư từ request cũ.
- Sau ghi làm mới danh sách yêu cầu, chi tiết đơn, danh sách đơn và bộ đếm admin. Không ghi object request vào cache của full order.
- Kết quả POST hợp lệ vẫn hiển thị nếu lần tải danh sách sau đó thất bại; không khuyến khích gửi lại một quyết định đã có kết quả.
- Trạng thái được ghi bằng chữ; có form/chi tiết rõ nhãn, focus tiêu đề, sáng/tối và vùng cuộn bảng riêng trên màn hình nhỏ.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--tệp-chính"></a>
##### Tệp chính

`src/pages/AdminOrderChangesPage.jsx`; `src/features/admin/order-changes-model.js`, `order-changes-api.js`, `useAdminOrderChanges.js`; các component `ChangeRequestTable`, `ChangeRequestDetail`, `ChangeDecisionForm`, `ChangeDecisionResult`; `src/styles/admin-order-changes.css`; route/menu trong `src/App.jsx` và `AdminLayout.jsx`.

Kiểm tra: `npm run check`, `npm run format:check`, `npm run test:changes`. Chrome HTTP mô phỏng ở `scripts/verify-admin-order-changes.mjs`/`fixtures/admin-order-changes.mjs`, kết quả `.cache/admin-order-changes/`.

`scripts/verify-live-order-changes.ps1` chạy production preview 5174, backend riêng 18080 với SQL Server của đồ án ở `localhost,1435`. Script tạo ba tài khoản và hai đơn có marker riêng, thực hiện năm quyết định admin qua UI, đối chiếu request/order/audit/collector rồi dọn đúng dữ liệu thử trong `finally`. Không chạy đồng thời script live khác dùng cùng cổng. Không dừng backend 8080/frontend 5173 của người dùng.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--cổng-sql-trên-máy-này"></a>
##### Cổng SQL trên máy này

Ngày 25/10/2026 đã tách instance chứa EcoThuGomDB (MSSQLSERVER01) sang **1435**, theo mục tiêu tách cổng người dùng chấp thuận. MSSQLSERVER dùng 1433 và 1434 nên không dùng 1434 cho đồ án. Trong SSMS: **`localhost,1435` + Windows Authentication**. Cổng cũ được lưu ở `../ecothugom-backend/.local/sql-port-before-1435.json`; script có kiểm tra cổng, đúng instance và lưu backup trước khi đổi, không sửa database/schema.

Profile `windows` mặc định DB_PORT 1435 trong nguồn backend. Backend đang chạy dùng `DB_PORT=1435`; JAR đóng gói trước thay đổi vẫn cần biến môi trường này hoặc đóng gói lại. Các script live frontend đã cập nhật kết nối SQL và biến DB_PORT tương ứng. Profile SQL authentication chung vẫn mặc định 1433 và có thể ghi đè bằng DB_PORT/DB_URL.

<a id="doc-frontend-vcoi-docs-admin-order-changes-ui-md--kết-quả-xác-minh-ngày-25102026"></a>
##### Kết quả xác minh ngày 25/10/2026

| Phần kiểm tra              | Kết quả thực tế                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`            | Lint, 364 test / 34 tệp và Vite build qua; 32 test mới cho tính năng này                                                                       |
| Chrome HTTP mô phỏng       | 23 tình huống qua; không pageerror                                                                                                             |
| Responsive / accessibility | 320/768/1024/1440 px, sáng/tối, chi tiết và bước xác nhận không tràn trang; axe không có vi phạm tại 320/1440 px                               |
| Backend + SQL thật         | 13 bước qua; năm quyết định UI với đúng version, không ghi trùng khi nhấp đúp                                                                  |
| Bất biến SQL               | Đơn hủy CANCELLED version 4, 5 audit; đơn đổi lịch CONFIRMED version 9, 10 audit, collector null và slot khớp đề xuất cuối                     |
| Lịch sử quyết định         | Năm request: ba APPROVED, hai REJECTED, đều version 1; đúng admin xử lý, thời điểm/phản hồi được lưu; khách đọc được kết luận                  |
| Phân quyền                 | Nhân viên cũ nhận 404 khi xem đơn sau khi bị bỏ phân công; CUSTOMER/COLLECTOR nhận 403 khi đọc danh sách admin                                 |
| Hồi quy                    | Khu khách 27 tình huống Chrome; xác nhận/phân công 40 tình huống Chrome, đều qua                                                               |
| Độ nhạy test               | Đảo điều kiện kiểm tra orderVersion phản hồi trong bản sao biệt lập làm test thất bại đúng dự kiến; SHA256 nguồn gốc không đổi, bản sao đã dọn |
| Dọn dữ liệu và dịch vụ     | Tài khoản/đơn tổng hợp còn 0; server thử đã dừng, frontend 5173/backend 8080 trả HTTP 200; hai instance SQL đều đang chạy                      |

HTTP fixture kiểm chứng UI theo tình huống định sẵn, tách khỏi bằng chứng live. Bộ live dùng production preview và SQL thật trên 1435, không dùng fixture thay backend trong sản phẩm. Rà soát thực hiện trực tiếp trên các tệp vì workspace không có Git; không thay API nghiệp vụ/schema hoặc nội dung dự án WebPCMaker.

<!-- source-end:doc-frontend-vcoi-docs-admin-order-changes-ui-md -->

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md"></a>
### Admin quản lý bảng giá thu mua

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-prices-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-prices-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--admin-quản-lý-bảng-giá-thu-mua"></a>
#### Admin quản lý bảng giá thu mua

Trang `/quan-tri/bang-gia` kết nối API Spring Boot và SQL Server hiện có. Đăng nhập ADMIN rồi chọn **Bảng giá** trên sidebar. Không cần chạy thêm SQL, cài dependency hay thay cấu hình backend.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--thao-tác"></a>
##### Thao tác

1. **Tạo giá nháp**: chọn vật liệu, nhập VND/kg, thời điểm bắt đầu và kết thúc tùy chọn theo giờ Việt Nam (UTC+7), rồi **Lưu giá nháp**. Bản mới mang trạng thái DRAFT, số phiên bản do backend cấp.
2. **Sửa** trong bảng hoặc **Sửa bản nháp** ở chi tiết: chỉ thay đơn giá và khoảng hiệu lực; vật liệu và số phiên bản giữ nguyên. Có thể bỏ mốc kết thúc để lưu không giới hạn.
3. **Xem** → **Duyệt giá** hoặc **Từ chối giá** → kiểm tra thông tin → xác nhận. Giao diện đọc lại chi tiết khi mở bước duyệt và kiểm tra snapshot ngay trước khi gửi. Nếu có thay đổi, phải tải lại và xem lại.
4. **Lịch sử** trong bảng hoặc **Xem lịch sử vật liệu** ở chi tiết: xem mọi phiên bản của đúng vật liệu, mới nhất trước, gồm cả nháp và bị từ chối. Có phân trang riêng và nút đóng để trở về danh sách.
5. Lọc vật liệu/trạng thái và phân trang danh sách theo URL; mỗi trang 20 phiên bản. Chi tiết có người tạo, người duyệt, thời gian, mã bản giá và khoảng hiệu lực.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--quy-tắc-cần-biết"></a>
##### Quy tắc cần biết

- Chỉ DRAFT được sửa, duyệt hoặc từ chối. APPROVED và REJECTED chỉ đọc; muốn điều chỉnh phải tạo nháp mới. Không có thao tác xóa.
- Giá đã duyệt được dùng trong khoảng `[validFrom, validTo)`. `validTo = null` là không giới hạn.
- Nếu nhiều giá đã duyệt cùng hiệu lực, backend chọn số phiên bản cao nhất. Nháp, bản bị từ chối, giá tương lai hoặc hết hạn không che giá hợp lệ khác.
- Duyệt bản mới không tự kết thúc bản cũ. Bản cũ còn hiệu lực có thể trở thành giá hiện hành khi bản mới hết hạn. Quy tắc này có trong bước xác nhận và phần giải thích trên trang.
- Vẫn được chuẩn bị giá cho vật liệu ngừng nhận hoặc nhóm đang ẩn; form có thông báo và giá chưa hiển thị công khai khi vật liệu chưa đủ điều kiện.
- Số phiên bản tăng khi tạo nháp, kể cả sau bản bị từ chối; sửa cùng bản nháp không cấp phiên bản mới. Lịch sử lưu trạng thái cuối mỗi phiên bản, không lưu từng lần sửa nháp.
- Backend hiện không lưu lý do/người từ chối riêng. UI không thêm trường lý do ngoài hợp đồng.
- Tiền trên UI là số nguyên từ 1 đến `Number.MAX_SAFE_INTEGER` (9.007.199.254.740.991 VND), hẹp hơn miền decimal(18,0) của backend để tránh làm tròn sai trong JavaScript. Dữ liệu trả về vượt miền an toàn được báo lỗi, không làm tròn âm thầm.
- Chuyển UTC+7 sang UTC khi gửi; giữ giây và mili giây khi sửa. Chấp nhận lịch quá khứ/tương lai, yêu cầu kết thúc sau bắt đầu và trong miền năm hợp lệ của SQL Server.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--api-hiện-có"></a>
##### API hiện có

Nguồn chuẩn: `../ecothugom-backend/docs/admin-prices.md`, `admin-prices-openapi.json` và `AdminPriceController/Requests/Response/Service.java`.

| API                                         | Mục đích                                             |
| ------------------------------------------- | ---------------------------------------------------- |
| GET `/api/admin/price-rules`                | Danh sách, lọc materialId/approvalStatus, phân trang |
| GET `/api/admin/price-rules/{id}`           | Đọc chi tiết mới nhất                                |
| POST `/api/admin/price-rules`               | Tạo nháp: materialId, unitPrice, validFrom, validTo  |
| PUT `/api/admin/price-rules/{id}`           | Sửa nháp: unitPrice, validFrom, validTo              |
| POST `/api/admin/price-rules/{id}/approve`  | Duyệt, body `{}`                                     |
| POST `/api/admin/price-rules/{id}/reject`   | Từ chối, body `{}`                                   |
| GET `/api/admin/materials/{id}/price-rules` | Lịch sử phân trang theo vật liệu                     |
| GET `/api/admin/materials`                  | Tải đủ các trang vật liệu, kể cả ngừng nhận/nhóm ẩn  |

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--thiết-kế-bảo-vệ-và-giới-hạn"></a>
##### Thiết kế, bảo vệ và giới hạn

Taste Skill theo hướng preserve, dials 3/2/6: giữ AdminLayout, xanh rừng/xanh chanh, Be Vietnam Pro và icon hiện có; bảng dữ liệu gọn, form hai cột trên desktop và một cột trên điện thoại. Bảng cuộn ngang trong khung riêng. Có sáng/tối, nhãn trường, focus vào form/xác nhận, trạng thái không phụ thuộc riêng vào màu.

Sử dụng cookie phiên và CSRF mới cho mỗi lần ghi, route chỉ ADMIN. Khóa đồng bộ chặn nhấp đúp; không retry ghi tự động. 404, 409 hoặc kết quả không rõ khóa thao tác đến khi tải lại thành công. Đọc lại thất bại không mở khóa. Không hiển thị raw SQL/server errors. Response được kiểm tra ID, trạng thái, đơn giá, vật liệu, khoảng hiệu lực và thông tin phiên bản trước khi báo thành công.

Cache riêng theo ADMIN và user ID, kiểm tra phiên trước/sau công việc bất đồng bộ; không cập nhật thông báo/cache riêng nếu phiên đã đổi. Sau ghi làm mới danh sách và các query bảng giá công khai/vật liệu đặt lịch.

Mỗi phản hồi giá quản trị có `draftRevision` (SHA-256 snapshot). Giao diện gửi mã đang xem làm `expectedRevision` trong PUT/duyệt/từ chối. Backend kiểm tra mã dưới khóa bản ghi trong cùng transaction, nên thay đổi từ phiên admin khác trả 409 mà không ghi. Sau xung đột cần tải lại và xem bản mới trước khi tiếp tục. Không cần thêm cột hoặc migration SQL.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--tệp-chính"></a>
##### Tệp chính

- `src/pages/AdminPricesPage.jsx`: trang quản trị bảng giá.
- `src/features/admin/prices-model.js`, `prices-api.js`, `useAdminPrices.js`: dữ liệu, API và điều phối trạng thái.
- `PriceForm`, `PriceFilters`, `PriceTable`, `PriceDetail`, `PriceHistory`: các phần giao diện.
- `src/styles/admin-prices.css`: kiểu riêng theo tokens admin.
- `src/App.jsx`, `AdminLayout.jsx`: route, tiêu đề và sidebar.
- `scripts/verify-admin-prices.mjs`, `fixtures/admin-prices.mjs`: kiểm tra Chrome qua HTTP mô phỏng.
- `scripts/verify-live-prices.ps1`, `verify-live-prices.mjs`: kiểm tra Chrome + backend/SQL thật bằng dữ liệu tổng hợp; bản build production qua Vite preview để tránh xung đột dependency cache của môi trường phát triển.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--chạy-kiểm-tra"></a>
##### Chạy kiểm tra

`npm run check` chạy lint, toàn bộ unit/component/API tests và build. `npm run test:prices` cần frontend 5173 và Chrome, dùng HTTP fixture cục bộ nên không ghi SQL.

Trên Windows, `./scripts/verify-live-prices.ps1` cần JAR backend đã build, JDK, sqlcmd và SQL Server hiện có. Script mở backend 18080/frontend 5174 bằng bản build production, tạo admin/danh mục/vật liệu có marker `VCOI-PRICES-LIVE-…` và năm phiên bản giá; kiểm tra giá công khai, đối chiếu SQL rồi dọn đúng bản ghi thử trong `finally`. Không chạy đồng thời script khác dùng hai cổng thử này. Tài khoản thử ngẫu nhiên chỉ truyền qua môi trường, không lưu mật khẩu trong báo cáo.

Ảnh và kết quả HTTP mô phỏng ở `.cache/admin-prices/`; hệ thống thật ở `.cache/live-prices/`.

<a id="doc-frontend-vcoi-docs-admin-prices-ui-md--kết-quả-xác-minh-ngày-24102026"></a>
##### Kết quả xác minh ngày 24/10/2026

| Phần kiểm tra               | Kết quả thực tế                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/component/API          | 303 test, 30 tệp, tất cả qua; 35 test mới của module bảng giá                                                                                     |
| Chrome với HTTP mô phỏng    | 21 tình huống qua trên bản build production, không có pageerror                                                                                   |
| Màn hình và accessibility   | 320/768/1024/1440 px, sáng/tối; form, xác nhận và lịch sử không tràn trang; axe không có vi phạm ở 320/1440 px                                    |
| Chrome + backend + SQL thật | 14 bước UI qua, 11 request ghi giá; năm phiên bản, không ghi lặp khi nhấp đúp                                                                     |
| Bất biến SQL                | Năm phiên bản 1–5; v1 duyệt và không tự đóng, v2 sửa rồi từ chối, v3 hiện hành, v4 tương lai, v5 hết hạn; người tạo/duyệt đúng admin thử          |
| Quy tắc công khai           | Nháp và từ chối không thay giá hiện hành; bản tương lai/hết hạn không che bản hợp lệ; v3 giá 5.500 VND/kg được chọn                               |
| Dọn dữ liệu và server       | Users/categories/materials/prices tổng hợp còn 0; cổng thử 18080/5174 đã đóng; server của người dùng 5173/8080 trả HTTP 200                       |
| Hồi quy danh mục/vật liệu   | 20 tình huống Chrome qua trên bản build production                                                                                                |
| Độ nhạy kiểm thử            | Đảo điều kiện so sánh kết thúc/bắt đầu trong bản sao biệt lập làm test thời gian thất bại đúng dự kiến; SHA256 mã gốc không đổi; bản sao được dọn |

Hồi quy bổ sung: xác nhận/phân công **40** tình huống Chrome và website công khai **21** tình huống đều qua trên bản build production. Lint cuối cùng không lỗi/cảnh báo; Vite build thành công, không thêm dependency.

HTTP fixture chứng minh hành vi UI với các tình huống định sẵn; phần live chứng minh request đi qua Spring Boot và lưu/đọc SQL Server thực tế. Hai loại bằng chứng được lưu riêng, không dùng fixture thay cho kết nối backend trong sản phẩm.

Trong quá trình kiểm tra, Vite dev trên Windows có lỗi đổi tên thư mục dependency cache (EBUSY). Bộ live cuối cùng build frontend rồi dùng **Vite preview**; bộ Chrome mô phỏng cuối cùng cũng chạy trên bản production ở cổng thử 5175. Cách này loại bỏ HMR và dependency optimizer khỏi bài kiểm tra, giữ server phát triển của người dùng đang chạy. Các lần thử lỗi được dọn bằng cùng cơ chế `finally` trước khi chạy lại.

<!-- source-end:doc-frontend-vcoi-docs-admin-prices-ui-md -->

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md"></a>
### Thống kê thu mua theo kỳ

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-reports-ui.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-reports-ui-md -->
<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--thống-kê-thu-mua-theo-kỳ"></a>
#### Thống kê thu mua theo kỳ

Ngày hoàn tất: 25/10/2026. Frontend dùng API Spring Boot và EcoThuGomDB hiện tại; không đổi API, schema, xác thực hoặc dependency.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--cách-sử-dụng"></a>
##### Cách sử dụng

Đăng nhập ADMIN và chọn **Thống kê**, hoặc mở `http://127.0.0.1:5173/quan-tri/thong-ke`.

1. Mặc định là tháng hiện tại theo ngày Việt Nam. Có nút **Tháng này**, **Tháng trước**, **Quý này**, **Năm nay**.
2. Hoặc chọn **Từ ngày**, **Đến hết ngày** rồi bấm **Xem thống kê**. Khoảng chọn từ 1 đến 366 ngày, tính cả hai ngày trên giao diện.
3. Đọc bốn chỉ số chính và biểu đồ thanh phân bố trạng thái. Phần **Ngày tạo đơn** và **Ngày thanh toán** chỉ rõ mốc đo.
4. Chuyển **Theo vật liệu** / **Theo nhân viên** để xem chi tiết tiền và khối lượng đã thanh toán. Bảng có phân trang, cuộn ngang trên màn hình nhỏ; có thể dùng phím mũi tên/Home/End để chuyển tab.
5. **Tải lại số liệu** làm mới tổng quan và bảng đang mở. Khoảng ngày, tab và trang được giữ trong URL để mở lại hoặc tải lại trình duyệt.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--ý-nghĩa-số-liệu"></a>
##### Ý nghĩa số liệu

| Chỉ số             | Cách tính từ backend                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| Đơn tạo trong kỳ   | Đếm các đơn có `created_at` trong kỳ, gồm mọi trạng thái                              |
| Tỷ lệ hoàn tất     | Số đơn tạo trong kỳ có `completed_at` / tổng đơn tạo trong kỳ × 100; làm tròn 2 số lẻ |
| Khối lượng thu mua | Tổng `actual_qty` trong báo giá gắn với payment COMPLETED có `paid_at` trong kỳ       |
| Tiền chi thu mua   | Tổng payment COMPLETED có `paid_at` trong kỳ, đơn vị VND                              |
| Phân bố trạng thái | Trạng thái hiện tại của các đơn được tạo trong kỳ                                     |

Ví dụ: đơn tạo tháng 9 nhưng thanh toán tháng 10 nằm trong số đơn tháng 9 và tiền/khối lượng tháng 10. Tỷ lệ hoàn tất có thể thay đổi khi đơn tạo trong kỳ được hoàn tất sau đó. Đơn đã hoàn tất rồi chuyển DISPUTED vẫn có `completed_at`, nên vẫn được tính đã từng hoàn tất và giữ khoản tiền đã chi. Vì vậy số đơn ở trạng thái COMPLETED hiện tại có thể nhỏ hơn tử số tỷ lệ hoàn tất.

Tiền là khoản đại lý chi để thu mua. Khối lượng dùng snapshot trong báo giá đã thanh toán, không cộng lại mọi lần cân hoặc cân điều chỉnh. Đơn chưa thanh toán chỉ ảnh hưởng nhóm số đơn, không tự trở thành tiền hoặc khối lượng đã thu mua.

Kỳ không có đơn vẫn hiển thị số 0 và giải thích không có mẫu để tính tỷ lệ. Kỳ không có đơn tạo mới nhưng có thanh toán của đơn cũ vẫn có thể có tiền/khối lượng.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--ngày-và-hợp-đồng-api"></a>
##### Ngày và hợp đồng API

Backend nhận khoảng **[from, to)**: từ đầu ngày `from` bao gồm, đến đầu ngày `to` không bao gồm, theo `Asia/Ho_Chi_Minh`. UI chọn đến hết 31/10/2026 sẽ gửi `to=2026-11-01`, không tự cắt mất ngày cuối. Việc cộng/trừ ngày ở frontend dùng ngày lịch UTC để tránh phụ thuộc múi giờ máy; kỳ mặc định và kỳ nhanh lấy ngày Việt Nam.

Ví dụ:

```text
GET /api/admin/reports/overview?from=2026-10-01&to=2026-11-01
GET /api/admin/reports/materials?from=2026-10-01&to=2026-11-01&page=0&size=20
GET /api/admin/reports/collectors?from=2026-10-01&to=2026-11-01&page=0&size=20
```

Đường dẫn UI tương ứng: `/quan-tri/thong-ke?from=2026-10-01&to=2026-11-01&group=collectors&page=1`. Bỏ `group` dùng bảng vật liệu; bỏ `page` dùng trang đầu. Đổi kỳ hoặc tab đưa bảng về trang đầu. URL có kỳ không hợp lệ hiện thông báo và form sửa, không âm thầm tải một kỳ khác. Trang ngoài phạm vi có nút **Về trang đầu**.

Nguồn chuẩn: `ecothugom-backend/SPEC-admin-reports.md`, `AdminReportController.java`, `AdminReportService.java`, `ReportPeriod.java` và `docs/backend-completion-openapi.json`. Breakdown API còn hỗ trợ lọc ID phía server; màn hình này dùng toàn bộ vật liệu hoặc nhân viên trong kỳ.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--bảng-chi-tiết-và-bảo-vệ-dữ-liệu"></a>
##### Bảng chi tiết và bảo vệ dữ liệu

- Vật liệu giữ `materialId`, tên/hạng/đơn vị snapshot của giao dịch. Cùng một ID có thể có nhiều dòng vì tên hoặc hạng lịch sử khác nhau; không gộp lại theo danh mục hiện tại.
- Một đơn có nhiều vật liệu có thể xuất hiện trong nhiều dòng; không cộng các số đơn của từng dòng để thay tổng số đơn. Các dòng ở trang hiện tại cũng không được cộng để thay tổng tiền/khối lượng toàn kỳ.
- Nhân viên là `payments.recorded_by`, người ghi nhận chi tiền, cùng tên hiện tại trong hồ sơ. Mỗi payment được tính một lần.
- Chỉ ADMIN được xem. Frontend dùng cookie phiên HttpOnly và route có kiểm tra vai trò; backend tiếp tục kiểm tra quyền trên cả ba endpoint. Màn hình chỉ gửi GET, không lấy CSRF hoặc gọi POST để đọc thống kê.
- Cache riêng theo ID tài khoản, ADMIN, kỳ, nhóm và trang; chuyển kỳ không giữ số liệu kỳ cũ dưới nhãn kỳ mới. Hết phiên thì bỏ dữ liệu riêng và về đăng nhập theo cơ chế hiện có.
- Response được kiểm tra ngày/múi giờ/mốc nửa đêm, tiền VND, kg, số trong miền an toàn JavaScript, tỷ lệ, tổng trạng thái và các nhóm trùng. Kết quả sai kỳ hoặc sai cấu trúc không được trình bày như số liệu hợp lệ.
- Lỗi tổng quan và bảng được xử lý riêng, có nút thử lại. Lỗi không được thay bằng số 0. Không hiển thị thông báo SQL nội bộ và không tự động retry. Số 0 chỉ xuất hiện khi API trả dữ liệu rỗng hợp lệ.
- Tổng quan và breakdown là các GET độc lập theo contract; khi có giao dịch thay đổi trong lúc xem, dùng **Tải lại số liệu** để lấy dữ liệu mới.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--thiết-kế"></a>
##### Thiết kế

Taste Skill theo chế độ preserve, `DESIGN_VARIANCE=3`, `MOTION_INTENSITY=2`, `VISUAL_DENSITY=6`, tiếp nối AdminLayout, màu xanh, font Be Vietnam Pro và icon Phosphor. Đây là dashboard nghiệp vụ nên dùng thêm frontend-ui-engineering cho bộ lọc, bảng, trạng thái dữ liệu và accessibility. Không cài thư viện biểu đồ; thanh trạng thái biểu diễn tỷ trọng thật, có nhãn và số đọc được.

Layout sáng/tối, bảng cuộn ngang và các vùng chỉ số thu về một cột trên màn hình nhỏ. Trang nằm riêng trong khu quản trị; không thay trang giới thiệu hoặc dự án tham khảo WebPCMaker.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--kết-quả-kiểm-tra"></a>
##### Kết quả kiểm tra

| Kiểm tra đã chạy                  | Kết quả                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                   | 437 test / 38 tệp; lint và production build thành công                                                                                                       |
| Test mới                          | 27 model/API/ngày + 10 component; đã chạy thất bại trước triển khai rồi chạy thành công                                                                      |
| `npm run test:reports`            | 22 tình huống Chrome với HTTP fixture theo contract                                                                                                          |
| Responsive và accessibility       | 320/768/1024/1440 px sáng/tối; axe không vi phạm ở 320 và 1440 px cho cả hai bảng; kiểm tra bàn phím/tab, không tràn toàn trang                              |
| `scripts/verify-live-reports.ps1` | 15 kiểm tra với Chrome, production frontend, backend và SQL thật; đối chiếu độc lập trước/sau và kỳ trước                                                    |
| SQL và nghiệp vụ thật             | 3 đơn thử, 2 payment, 4 phiếu cân gồm cân sửa; báo giá đã thanh toán ghi đúng 7,5 kg, đơn unpaid không cộng tiền, đơn đã trả tiền rồi DISPUTED vẫn được tính |
| Nhóm chi tiết                     | Mọi trang vật liệu và nhân viên khớp SQL, gồm tên/hạng tiếng Việt và snapshot giao dịch; UI hiển thị đúng người ghi nhận 2 đơn / 7,5 kg                      |
| Độ nhạy test                      | Bỏ bước cộng một ngày cho mốc cuối trong bản sao làm test thất bại; SHA256 mã gốc giữ nguyên, bản sao đã dọn                                                 |

Lighthouse trên desktop production preview với HTTP fixture cục bộ: Performance 87, Accessibility 100, Best Practices 100; không có cảnh báo. LCP khoảng 0,62 giây, CLS 0,02. Đây là đo cục bộ, không giới hạn tốc độ mạng, không phải kết quả hiệu năng hosting hoặc SQL thực tế. Báo cáo ở `.cache/admin-reports/lighthouse.json`.

Chrome fixture kiểm tra GET-only, tháng/quý/năm và ngày nhuận, URL/reload/phân trang, bộ lọc sai, đổi kỳ đang tải, tách lỗi tổng quan/bảng, dữ liệu sai kỳ/tỷ lệ, rỗng, hết phiên và chặn CUSTOMER/COLLECTOR. Bộ live dùng ba phiên riêng và truy vấn SQL độc lập để so sánh toàn bộ tổng quan/nhóm, thay vì chỉ dựa dữ liệu fixture.

Hồi quy: `test:dispatch` qua 40 tình huống và `test:disputes` qua 21 tình huống, xác nhận các trang quản trị đã có vẫn hoạt động.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--chạy-lại"></a>
##### Chạy lại

```powershell
cd "D:\VCOI\Frontend VCoi"
npm run check
npm run test:reports
.\scripts\verify-live-reports.ps1
```

Chrome fixture dùng frontend 5173 hoặc biến `FRONTEND_URL` trỏ tới production preview. Không ghi SQL. Bộ live cần JDK, JAR backend hiện có, sqlcmd, SQL Server `localhost,1435` với Windows Authentication và ít nhất hai vật liệu đang có giá. Dùng backend thử 18080/frontend thử 5174; không chạy đồng thời các script live khác dùng hai cổng này.

Bộ live tạo tài khoản/đơn có marker riêng, dùng API nghiệp vụ để chuẩn bị payment/cân/khiếu nại, sau đó màn hình báo cáo chỉ đọc. Không đổi giá hoặc danh mục sẵn có. Dọn đúng bản ghi thử trong `finally`, giữ server người dùng 5173/8080. SQL JSON dùng `sqlcmd -u -o` và tệp Unicode tạm riêng để giữ nguyên dấu tiếng Việt; các tệp này được dọn sau khi đọc.

Ảnh/kết quả fixture ở `.cache/admin-reports/`; live ở `.cache/live-reports/`. Postman CLI/tool không khả dụng trong phiên; dùng OpenAPI và script kiểm tra trong repo, không tạo hoặc đồng bộ workspace cloud. Workspace không có Git repository nên không tạo commit hoặc PR.

<a id="doc-frontend-vcoi-docs-admin-reports-ui-md--tệp-chính"></a>
##### Tệp chính

- `src/pages/AdminReportsPage.jsx`: trang, kỳ/tab/trang qua URL.
- `src/features/admin/reports-period.js`, `reports-model.js`, `reports-api.js`, `useAdminReports.js`: ngày, hợp đồng, API và cache.
- `ReportPeriodForm.jsx`, `ReportMetrics.jsx`, `ReportStatusDistribution.jsx`, `ReportBreakdown.jsx`: bộ lọc, chỉ số, trạng thái và bảng.
- `src/styles/admin-reports.css`, `src/App.jsx`, `AdminLayout.jsx`: phong cách, route và menu.
- Test, HTTP fixture và script live lưu cùng frontend để chạy lại.

<!-- source-end:doc-frontend-vcoi-docs-admin-reports-ui-md -->

<a id="doc-frontend-vcoi-docs-auth-booking-spec-md"></a>
### Xác thực, điều hướng vai trò và đặt lịch

Nguồn trước khi gộp: `Frontend VCoi/docs/auth-booking-spec.md`.

<!-- source-begin:doc-frontend-vcoi-docs-auth-booking-spec-md -->
<a id="doc-frontend-vcoi-docs-auth-booking-spec-md--xác-thực-điều-hướng-vai-trò-và-đặt-lịch"></a>
#### Xác thực, điều hướng vai trò và đặt lịch

<a id="doc-frontend-vcoi-docs-auth-booking-spec-md--phạm-vi-đã-được-yêu-cầu"></a>
##### Phạm vi đã được yêu cầu

Mở rộng frontend hiện có với đăng ký khách hàng, đăng nhập/đăng xuất, khôi phục phiên, điều hướng CUSTOMER/COLLECTOR/ADMIN và đặt lịch khách hàng. Giữ giao diện xanh/cam, font và component nền hiện tại. Không thay đổi API, schema SQL hoặc cơ chế xác thực backend.

| Phần      | Trách nhiệm                                                  | Phụ thuộc             |
| --------- | ------------------------------------------------------------ | --------------------- |
| auth      | Cookie phiên, CSRF, đăng ký/đăng nhập/đăng xuất, route guard | Hợp đồng auth backend |
| workspace | Trang đầu theo vai trò, danh sách và chi tiết đơn chỉ đọc    | auth                  |
| booking   | Nhập lịch, vật liệu và địa chỉ; gửi và xem xác nhận          | auth, workspace       |

Thứ tự: auth → workspace → booking → kiểm tra tích hợp. Đăng ký không tự đăng nhập; tài khoản nhân viên/admin không được tạo qua form đăng ký công khai. Workspace nhân viên/admin ở bước này dùng để vào đúng vai trò và xem đơn, chưa bao gồm toàn bộ màn nghiệp vụ quản trị/thu gom.

<a id="doc-frontend-vcoi-docs-auth-booking-spec-md--hợp-đồng-và-ranh-giới"></a>
##### Hợp đồng và ranh giới

- Dùng các OpenAPI trong `../ecothugom-backend/docs/` làm nguồn chuẩn.
- Mọi fetch gửi cookie `credentials: include`. Trước mỗi thao tác ghi lấy CSRF mới, không giữ token cũ qua login/logout. Không lưu thông tin xác thực hoặc nội dung biểu mẫu trong localStorage/sessionStorage/URL/log.
- Kiểm tra phiên từ `/api/auth/me`, không suy ra quyền từ client storage. Frontend chặn sai vai trò để hỗ trợ UX, backend vẫn quyết định quyền.
- Trả về trang riêng đúng vai trò sau đăng nhập. Chỉ nhận đường quay lại nằm trong các route được cho phép của vai trò, chặn URL ngoài và vòng lặp đăng nhập.
- Khi đổi tài khoản/đăng xuất/401 từ API riêng tư: xóa dữ liệu riêng tư đã cache. Phiên lỗi mạng có trạng thái lỗi và thử lại, không coi là đăng nhập thành công.
- Chỉ gửi field đúng hợp đồng. Giá, chủ đơn, trạng thái và mã đơn do backend xác định.
- Giờ nhập đặt lịch là giờ Việt Nam UTC+7, chuyển sang ISO có offset/UTC; không phụ thuộc múi giờ máy khách.
- Một đơn có 1–50 vật liệu khác nhau; số kg có thể bỏ trống, nếu nhập phải dương và tối đa 3 chữ số thập phân. Nhận lịch với vật liệu cần liên hệ báo giá.
- Không tự gửi lại POST đặt lịch khi lỗi mạng/5xx hoặc không biết kết quả. Khóa gửi trong lúc chờ, hướng khách kiểm tra danh sách đơn trước khi thử lại.

<a id="doc-frontend-vcoi-docs-auth-booking-spec-md--tiêu-chí-nghiệm-thu"></a>
##### Tiêu chí nghiệm thu

- Các form có nhãn, lỗi cạnh trường, focus đến trường sai, autocomplete phù hợp, nút hiện mật khẩu và trạng thái đang gửi.
- Đăng ký đúng tạo CUSTOMER; sai dữ liệu/trùng thông tin/429 được xử lý, không lộ lỗi nội bộ.
- Đăng nhập ba vai trò vào đúng nơi; tải lại khôi phục phiên; sai vai trò không tải API của vai trò khác; đăng xuất làm mất quyền trang riêng.
- Khách chọn vật liệu từ API, nhập liên hệ/địa chỉ/giờ tương lai, xem lại và gửi lịch. Trang thành công hiển thị mã, PENDING, ước tính backend và lối xem chi tiết.
- Danh sách/chi tiết đơn có tải, rỗng, lỗi, phân trang và kiểm soát theo vai trò. 401 yêu cầu đăng nhập lại; 403/404 có thông báo phù hợp.
- Kiểm tra ở 320, 768, 1024, 1440 px, sáng/tối, bàn phím và axe.
- Chạy `npm run check`, test trình duyệt và audit. Tách bằng chứng mô phỏng khỏi kiểm tra SQL Server thật; không dùng tài khoản thật của người dùng để thử.

<!-- source-end:doc-frontend-vcoi-docs-auth-booking-spec-md -->

<a id="doc-frontend-vcoi-docs-collector-payment-md"></a>
### Nhân viên ghi nhận thanh toán mô phỏng

Nguồn trước khi gộp: `Frontend VCoi/docs/collector-payment.md`.

<!-- source-begin:doc-frontend-vcoi-docs-collector-payment-md -->
<a id="doc-frontend-vcoi-docs-collector-payment-md--nhân-viên-ghi-nhận-thanh-toán-mô-phỏng"></a>
#### Nhân viên ghi nhận thanh toán mô phỏng

Hoàn thiện ngày 24/10/2026. Frontend React JavaScript kết nối các API Spring Boot + SQL Server hiện có; không sửa backend/schema hoặc thêm dependency.

<a id="doc-frontend-vcoi-docs-collector-payment-md--cách-sử-dụng"></a>
##### Cách sử dụng

1. Đăng nhập **COLLECTOR**, vào **Đơn được phân công** rồi mở đơn của mình tại `/nhan-vien/don/:id`.
2. Khi khách đã chấp thuận báo giá và đơn ở **Chờ thanh toán**, panel **Thanh toán mô phỏng** xuất hiện trước thông tin thu gom. Kiểm tra số tiền rồi chọn **Xem lại thanh toán**.
3. Giao diện đọc lại đơn, báo giá và các khoản thanh toán. Chọn **Tiền mặt mô phỏng** hoặc **Chuyển khoản mô phỏng**. Số tiền lấy từ báo giá đã được khách chấp thuận, không được nhập/sửa trên form.
4. Chọn **Xác nhận thanh toán mô phỏng**. Backend ghi khoản chi và chuyển đơn **AWAITING_PAYMENT → COMPLETED**; trang hiển thị số tiền, phương thức, mã giao dịch và thời gian chính thức.
5. Tải lại trang hoặc quay về danh sách vẫn thấy kết quả hoàn tất. Khách hàng xem khoản chi và biên nhận tại trang chi tiết đơn của họ.

Đây là ghi nhận dữ liệu đồ án. Không kết nối ngân hàng, cổng thanh toán hoặc chuyển tiền thật. Nhân viên đại diện đại lý **chi tiền thu mua cho khách**, không thu tiền từ khách.

<a id="doc-frontend-vcoi-docs-collector-payment-md--thiết-kế-theo-taste-skill"></a>
##### Thiết kế theo Taste Skill

Design Read: màn hình nghiệp vụ cho nhân viên thu gom, rõ ràng và tin cậy, tiếp nối hệ thống VCoi xanh rừng/xanh chanh. Chế độ preserve; DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 5. Taste Skill áp dụng cho tính nhất quán thị giác/copy; biểu mẫu, dữ liệu và trạng thái tuân theo frontend-ui-engineering.

Audit trước triển khai: chi tiết đơn đã có di chuyển, cân và báo giá; thiếu bước chi trả sau khi khách duyệt. Giữ nguyên ServiceLayout, URL, font Be Vietnam Pro, Phosphor, tokens sáng/tối và các nút hiện có. Panel ưu tiên khoản tiền đã duyệt và hành động tiếp theo; không thêm hero, ảnh trang trí hoặc hiệu ứng. Phương thức là select có nhãn, số tiền dùng số tabular, mã giao dịch dài được xuống dòng; mobile gom một cột.

Đã kiểm tra nhãn/copy, nút không xuống dòng ở desktop, tương phản bằng axe tại 320/1440 px cả sáng/tối, bàn phím và ảnh thực tế. Trang tính năng giữ tách website giới thiệu. Các quy tắc marketing của Taste không được áp máy móc vào dữ liệu nghiệp vụ.

<a id="doc-frontend-vcoi-docs-collector-payment-md--api-và-dữ-liệu"></a>
##### API và dữ liệu

Nguồn chuẩn: `../ecothugom-backend/src/main/java/com/ecothugom/orders/SimulatedPaymentController.java`, `SimulatedPaymentRequest.java`, `PaymentResponse.java`, `SimulatedPaymentService.java` và `docs/collection-workflow-openapi.json` của backend.

| API                                                 | Vai trò trong giao diện                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| GET `/api/collector/orders/{id}`                    | Đọc đơn mới nhất trước xem lại và khi phục hồi lỗi                       |
| GET `/api/collector/orders/{id}/quotes`             | Lấy báo giá hiện hành đã ACCEPTED và snapshot tiền                       |
| GET `/api/collector/orders/{id}/payments`           | Đọc các khoản đã ghi nhận, kiểm tra phạm vi/version và đối chiếu báo giá |
| POST `/api/collector/orders/{id}/payments/simulate` | Ghi nhận khoản chi, nhận PaymentResponse 201                             |

Body POST chỉ có:

```json
{
  "version": 10,
  "quoteId": 801,
  "method": "CASH_SIMULATED",
  "requestKey": "<UUID tạo một lần cho lựa chọn đang xác nhận>"
}
```

`version` và `quoteId` lấy từ dữ liệu server lúc xem lại. Backend lấy amount từ báo giá ACCEPTED hiện hành và thực hiện cập nhật đơn, insert payment, audit trong cùng transaction. Các ràng buộc version, request key duy nhất và một khoản hoàn tất cho mỗi đơn ngăn ghi trùng.

**Request key không phải cơ chế replay response của backend.** Gửi lại một yêu cầu đã hoàn tất có thể nhận 409. Frontend không tự retry POST; sau lỗi chưa rõ kết quả phải đọc lại. Với 403 xác định chưa ghi, nhân viên có thể chủ động thử lại cùng lựa chọn/request key với CSRF mới. Đổi phương thức hoặc mở lại bước xem lại tạo lựa chọn mới.

<a id="doc-frontend-vcoi-docs-collector-payment-md--điều-kiện-và-phục-hồi-lỗi"></a>
##### Điều kiện và phục hồi lỗi

- Chỉ nhân viên ACTIVE được phân công cho đơn mới có thể ghi. CUSTOMER/ADMIN và nhân viên khác không thấy panel ghi nhận.
- Đơn phải AWAITING_PAYMENT, version còn tăng được, báo giá hiện hành ACCEPTED khớp đơn/status/version, có người/thời gian khách phản hồi, tiền dương hợp lệ và chưa có payment COMPLETED.
- Không xét hết hạn phản hồi của báo giá đã ACCEPTED để chặn thanh toán. Khách đã quyết định trước đó; tiền tiếp tục dùng snapshot đã duyệt.
- Form có bước xem lại. Version hoặc báo giá thay đổi sau khi mở form sẽ khóa xác nhận. Không hiển thị nút ghi cho COMPLETED, DISPUTED, ARRIVED hoặc giai đoạn khác chưa đủ điều kiện.
- Khóa đồng bộ chống nhấp đúp. Mỗi write lấy CSRF mới và giữ cookie phiên; không đưa bí mật hoặc dữ liệu phiên vào localStorage.
- 404/409, lỗi mạng hoặc phản hồi chưa xác định khóa gửi và yêu cầu tải lại đầy đủ đơn/báo giá/payments. Tải lại thất bại tiếp tục khóa; đọc thành công yêu cầu xem lại trước khi gửi mới.
- Nếu server đã ghi nhưng phản hồi bị mất, tải lại hiển thị đúng một khoản chi và không gửi lại. Khoản chi đã xác nhận vẫn hiển thị nếu lần tải context tiếp theo lỗi.
- Kiểm tra response: đơn, báo giá, amount, VND, phương thức, request key, actor, trạng thái COMPLETED, version tăng một và các timestamp/mã giao dịch. Sai lệch được coi là chưa xác định, không cập nhật trạng thái thành công.
- Cập nhật cache chi tiết và danh sách sau response hợp lệ; không ghi đè version mới hơn hoặc khôi phục dữ liệu riêng sau khi phiên đổi.

<a id="doc-frontend-vcoi-docs-collector-payment-md--kiểm-tra-thực-tế"></a>
##### Kiểm tra thực tế

| Lệnh/nhóm                              | Kết quả                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                        | Lint đạt; **247 test / 26 file** đạt; build thành công                                                                                                                |
| Test tập trung mới                     | **12 test model/API + 9 test component**: điều kiện, body, tiền/version/actor, review, double click, 403/409/unknown, stale và đổi phiên                              |
| `npm run test:payment`                 | **25 kịch bản Chrome** với HTTP mô phỏng theo contract: tiền mặt/chuyển khoản, lỗi/đọc lại, dữ liệu thiếu, quyền/trạng thái, reload/list, responsive và accessibility |
| `npm run test:quotation`               | **23 kịch bản hồi quy báo giá nhân viên** đạt                                                                                                                         |
| `npm run test:customer`                | **27 kịch bản hồi quy khách hàng/biên nhận** đạt                                                                                                                      |
| `scripts/verify-live-auth-booking.ps1` | **60 bước với backend/SQL thật** đạt; bước thanh toán dùng UI nhân viên, không còn gọi POST payment trực tiếp trong script                                            |
| Kiểm tra độ nhạy test                  | Đảo điều kiện AWAITING_PAYMENT trong bản sao tạm: test phát hiện lỗi; SHA-256 mã chính giữ nguyên, bản sao đã dọn                                                     |

Chrome thử tại **320, 768, 1024, 1440 px**, cả sáng/tối. Kiểm tra hai trạng thái xem lại và hoàn tất, không tràn ngang, một main, xác nhận bằng bàn phím. Axe không có violation tại 320/1440 px của cả hai trạng thái ở cả hai chế độ. Đây là phạm vi quét tự động, không phải chứng nhận accessibility toàn sản phẩm.

Luồng thật dùng tài khoản/đơn tổng hợp có marker riêng. Khách từ chối báo giá đầu rồi đồng ý bản thứ hai; nhân viên chọn tiền mặt mô phỏng trên UI và nhận COMPLETED version 11. Reload vẫn có đúng mã giao dịch và không còn nút ghi. Khách mở biên nhận; sau đó luồng khiếu nại/giải quyết khôi phục COMPLETED version 14. SQL đối chiếu **một payment COMPLETED, amount bằng báo giá ACCEPTED thứ hai, đúng actor/method/phiếu cân, 15 audit**. Dữ liệu/ảnh thử đã được dọn, server thử 18080/5174 đã dừng; server người dùng 8080/5173 được giữ nguyên.

Postman CLI chưa có trên máy. Kiểm tra dùng Vitest và Playwright hiện có theo contract local; tách rõ bằng chứng HTTP mô phỏng ở trên với luồng backend/SQL thật. Không tạo hoặc đồng bộ workspace Postman.

<a id="doc-frontend-vcoi-docs-collector-payment-md--tệp-và-bằng-chứng"></a>
##### Tệp và bằng chứng

- `src/features/orders/CollectorPayment.jsx`, `PaymentReview.jsx`, `PaymentRecords.jsx`: panel, form và các khoản ghi nhận.
- `payment-model.js`, `payment-api.js`: schema/điều kiện, read theo vai trò và write theo contract.
- `useCollectorPayment.js`, `usePaymentCache.js`: trạng thái, khóa/đọc lại và cache theo phiên/version.
- `src/pages/OrderDetailPage.jsx`, `src/styles/payment.css`: ghép UI vào trang và bố cục responsive.
- `src/features/customer/order-read-api.js`: dùng chung payment schema/reader, giữ phạm vi CUSTOMER và biên nhận.
- `scripts/verify-collector-payment.mjs`, `scripts/fixtures/collector-payment.mjs`: Chrome và HTTP fixture.
- `scripts/live-customer-workspace.mjs`: bước thanh toán UI trong luồng thật.
- `.cache/collector-payment/results.json`, ảnh `review/completed-320/1440-light/dark.png`, `mutation.json`.
- `.cache/live-auth/result.json`, `.cache/live-auth/collector-payment.png`: bằng chứng luồng thật.

Các bản ghi lịch sử chỉ đọc. Đợt này không bổ sung hoàn tiền, xóa/sửa payment hoặc màn hình quản trị mới.

<!-- source-end:doc-frontend-vcoi-docs-collector-payment-md -->

<a id="doc-frontend-vcoi-docs-collector-progress-md"></a>
### Nhân viên khởi hành và đến điểm thu gom

Nguồn trước khi gộp: `Frontend VCoi/docs/collector-progress.md`.

<!-- source-begin:doc-frontend-vcoi-docs-collector-progress-md -->
<a id="doc-frontend-vcoi-docs-collector-progress-md--nhân-viên-khởi-hành-và-đến-điểm-thu-gom"></a>
#### Nhân viên khởi hành và đến điểm thu gom

Phạm vi: chi tiết đơn `/nhan-vien/don/:id`, giữ ServiceLayout và phong cách VCoi xanh rừng/xanh chanh. Nguồn chuẩn: backend `docs/collection-workflow.md`, `collection-workflow-openapi.json`, `CollectorProgressController` và `CollectorProgressService`.

- COLLECTOR được giao đơn: ASSIGNED → nút Khởi hành → POST `/api/collector/orders/{id}/start-trip` → EN_ROUTE → nút Đã đến điểm thu gom → POST `/api/collector/orders/{id}/arrive` → ARRIVED.
- Body chỉ `{version, reason}`; ghi chú tùy chọn tối đa 500 ký tự, trim và chuỗi trắng thành null. Version hiện tại 0..2147483646. Backend tăng version một đơn vị, giữ collector và ghi audit. Không chặn theo giờ hẹn.
- Chỉ hiển thị thao tác cho đúng nhân viên và đúng trạng thái. ARRIVED hiển thị kết quả; chưa bổ sung nhập cân trong đợt này. Không có nút trên trang khách/admin hoặc đơn của người khác.
- Giữ cookie phiên, lấy CSRF mới cho mỗi POST. Không lạc quan cập nhật trạng thái, không tự gửi lại POST. Chặn nhấp lặp ngay khi bắt đầu gửi.
- Thành công phải khớp id, collector, trạng thái đích và version +1; cập nhật cache chi tiết từ server, làm mới danh sách của nhân viên. Không khôi phục cache riêng khi phiên đã thay đổi.
- 409/404 hoặc mất kết nối/5xx/phản hồi thành công sai định dạng: khóa thao tác cho đến khi đọc lại đơn thành công. Đọc lại thất bại tiếp tục khóa. 401 quay lại đăng nhập theo xử lý chung; 403 có thông báo an toàn và cho thử lại với CSRF mới.
- Kiểm tra unit cho ranh giới request/response và UI; browser theo hợp đồng cho thứ tự, reload, lỗi, quyền, bàn phím, responsive/sáng/tối/axe. Kiểm tra luồng thật bằng server thử và dữ liệu SQL có marker riêng, dọn đúng dữ liệu thử.

<a id="doc-frontend-vcoi-docs-collector-progress-md--sử-dụng"></a>
##### Sử dụng

1. Đăng nhập bằng tài khoản nhân viên COLLECTOR, vào **Đơn được phân công**, mở đơn ASSIGNED của mình.
2. Kiểm tra địa chỉ, giờ hẹn; nhập ghi chú nếu cần rồi bấm **Khởi hành**. Chờ thông báo thành công; đơn chuyển sang **Đang đến**.
3. Khi có mặt tại điểm thu gom, bấm **Đã đến điểm thu gom**. Thành công sẽ hiển thị ARRIVED và bỏ hai nút di chuyển.
4. Nếu hiện xung đột hoặc chưa xác định kết quả, dùng **Tải lại tiến độ**. Nếu không còn tìm thấy đơn trong phân công, quay về danh sách hoặc liên hệ admin. Không nhập version thủ công.

Tải lại trình duyệt vẫn đọc trạng thái từ backend. Danh sách nhân viên được làm mới sau mỗi thao tác. Đơn ở các bước khác không có nút di chuyển; nhân viên không có đơn thì danh sách tiếp tục dùng trạng thái rỗng hiện có.

<a id="doc-frontend-vcoi-docs-collector-progress-md--kiểm-tra-ngày-24102026"></a>
##### Kiểm tra ngày 24/10/2026

- `npm run check`: lint, **109 test trong 13 file** và production build đạt. Riêng chức năng mới có 21 test API và 12 test UI: request/response, CSRF/cookie, nhấp lặp, đúng thứ tự, đọc lại sau lỗi, quyền và cache khi đổi phiên.
- `npm run test:progress`: **35 bước trình duyệt đạt**, fixture HTTP dựa trên OpenAPI. Bao gồm bàn phím, khởi hành/đã đến, reload/danh sách, 401/403/404/409/5xx, ghi thành công nhưng trả 500, sai nhân viên/trạng thái; 3 trạng thái × 4 kích thước × 2 màu. Axe đạt ở 320/1440 px. Ảnh màn hình tối 320 px được chụp lại và kiểm tra riêng sau khi chờ tải đầy đủ; 0 vi phạm.
- `scripts/verify-live-auth-booking.ps1`: **25 bước trình duyệt thật đạt** trên backend 18080, frontend 5174 và EcoThuGomDB. Khách đăng ký/đặt lịch, admin xác nhận/phân công, collector start-trip (EN_ROUTE/version 3), reload, arrive (ARRIVED/version 4), khách đọc trạng thái thực. Sai khu vực theo vai trò bị từ chối.
- Đối chiếu SQL đạt: đúng người phụ trách, version 4, một mặt hàng, năm log trạng thái; hai log di chuyển ghi đúng actor COLLECTOR, ghi chú khởi hành và lý do mặc định của arrive. Dữ liệu thử có marker riêng được xóa thành công trong finally; hai server thử đã dừng.
- Kiểm tra chất lượng test trong bản sao tách biệt: bỏ kiểm tra collectorId của phản hồi; test phát hiện và thất bại đúng trường hợp. Mã nguồn gốc giữ nguyên, bản sao được dọn.

Postman CLI không có trên máy; dùng hợp đồng OpenAPI và công cụ kiểm thử hiện có, không đẩy thay đổi vào workspace Postman. Browser fixture kiểm tra frontend và phục hồi lỗi; luồng thật/SQL cung cấp bằng chứng kết nối backend thực. Không thay backend, schema, thư viện hoặc cấu hình xác thực.

Tệp chính: `src/features/orders/CollectorProgress.jsx`, `CollectorProgressForm.jsx`, `useCollectorProgress.js`, `progress-api.js`, `src/styles/collector-progress.css`; gắn panel tại `src/pages/OrderDetailPage.jsx`. Test browser: `scripts/verify-collector-progress.mjs`. Kết quả/ảnh: `.cache/collector-progress/`, `.cache/live-auth/`.

<!-- source-end:doc-frontend-vcoi-docs-collector-progress-md -->

<a id="doc-frontend-vcoi-docs-collector-quotation-md"></a>
### Nhân viên gửi báo giá sau cân

Nguồn trước khi gộp: `Frontend VCoi/docs/collector-quotation.md`.

<!-- source-begin:doc-frontend-vcoi-docs-collector-quotation-md -->
<a id="doc-frontend-vcoi-docs-collector-quotation-md--nhân-viên-gửi-báo-giá-sau-cân"></a>
#### Nhân viên gửi báo giá sau cân

Nguồn chuẩn: backend collection-workflow.md/OpenAPI, QuotationService, QuoteResponse và QuoteRequests.Send. Giữ giao diện VCoi và ServiceLayout; chỉ frontend, không đổi API/schema, chưa làm màn hình khách duyệt trong đợt này.

- Nhân viên được giao đơn ARRIVED có thể xem trước và gửi báo giá khi mọi vật liệu có phiếu cân net > 0 và giá hiện hành. Bản xem trước đọc lại đơn, cân, báo giá và giá; không dùng kg/giá ước tính lúc đặt lịch.
- Xem trước là tham khảo: giá có thể thay đổi trước lúc gửi. Làm tròn từng dòng HALF_UP sang VND rồi cộng; tính bằng phần nghìn kg và BigInt, từ chối giá trị vượt giới hạn số nguyên an toàn của JavaScript.
- POST /api/collector/orders/{id}/quotes chỉ gửi {version}. Backend chọn phiếu cân/giá, tạo SENT/current, hạn 24 giờ, tăng version đơn và chuyển AWAITING_SELLER_APPROVAL. Hiển thị kết quả chính thức từ response, giữ lịch sử.
- Đang chờ khách thì không gửi tiếp; SENT hiện hành hết hạn mới được tạo bản thay thế. validUntil null của dữ liệu cũ không coi là hết hạn. Khi khách từ chối và đơn về ARRIVED, cho xem trước/gửi lần tiếp theo.
- Phiên cookie, CSRF mới, khóa nhấp lặp; không retry POST hoặc cập nhật trạng thái trước thành công. Kiểm tra response id/version/actor, item/phiếu cân, tiền và thời hạn. Không ép giá response phải bằng giá tham khảo.
- 404/409 hoặc kết quả chưa xác định: khóa ghi, tải lại đơn/báo giá rồi xem trước lại. Không phục hồi cache khi đổi phiên và không ghi đè version mới hơn nếu cân và xem trước chạy đồng thời.
- Unit/model/API/UI; browser fixture cho thiếu cân/giá, gửi/reload, lỗi, hết hạn và giao diện responsive/axe; luồng SQL thật bằng dữ liệu có marker, dọn đúng dữ liệu thử.

<a id="doc-frontend-vcoi-docs-collector-quotation-md--cách-thử-trên-giao-diện"></a>
##### Cách thử trên giao diện

1. Đăng nhập nhân viên COLLECTOR; vào `/nhan-vien` và mở đơn được phân công.
2. Khởi hành → đến điểm thu gom. Khi ARRIVED, lưu đủ kết quả cân cho mọi vật liệu.
3. Ở mục **Gửi báo giá**, chọn **Xem trước báo giá**. Kiểm tra phiếu cân, kg thực nhận, đơn giá và tổng tham khảo; thiếu cân hoặc giá sẽ có thông báo, nút gửi bị khóa.
4. Chọn **Gửi báo giá cho khách**. Thành công sẽ hiện báo giá chính thức, thời hạn, lịch sử và trạng thái **Chờ khách duyệt báo giá**. Form cân và nút gửi tiếp không còn ở bước này.
5. Nếu báo xung đột hoặc chưa xác định đã lưu, chọn **Tải lại đơn và báo giá**. Nếu chưa có báo giá và đơn vẫn đủ điều kiện, xem trước lại trước khi gửi. Nếu đã gửi thì chỉ đọc kết quả.

Khi báo giá SENT hiện hành hết hạn, xem trước lại để gửi phiên bản mới; bản cũ được giữ trong lịch sử. Đồng hồ frontend chỉ hỗ trợ hiển thị thời hạn; backend quyết định điều kiện gửi. Khi khách từ chối qua API và đơn quay về ARRIVED, có thể cân lại/xem trước để lập báo giá mới. Giao diện khách chấp thuận/từ chối nằm ở phần việc tiếp theo.

<a id="doc-frontend-vcoi-docs-collector-quotation-md--các-tệp-chính"></a>
##### Các tệp chính

- `src/features/orders/CollectorQuotation.jsx`, `QuotePreview.jsx`, `QuoteCard.jsx`: panel, bản xem trước, báo giá và lịch sử.
- `useQuotation.js`: đọc lại dữ liệu, khóa thao tác và cập nhật cache sau kết quả xác nhận.
- `quotation-api.js`, `quotation-model.js`: hợp đồng HTTP, kiểm tra dữ liệu, điều kiện gửi và làm tròn VND.
- `src/styles/quotation.css`, `src/pages/OrderDetailPage.jsx`: kiểu VCoi và tích hợp vào chi tiết đơn.

Giữ cookie/CSRF, phân quyền backend, bố cục chức năng riêng, màu xanh rừng/xanh chanh và dependency hiện có. Không sửa backend, SQL hay dự án tham khảo WebPCMaker. Dùng hợp đồng OpenAPI trong repo và hướng dẫn Postman API Engineer/Testing; máy hiện tại không có Postman CLI nên kiểm tra bằng Vitest, Playwright và Spring Boot/SQL thật, không đồng bộ tài nguyên Postman bên ngoài.

<a id="doc-frontend-vcoi-docs-collector-quotation-md--kết-quả-kiểm-tra-ngày-24102026"></a>
##### Kết quả kiểm tra ngày 24/10/2026

| Kiểm tra                               | Kết quả                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                        | Lint đạt, 186 test/17 tệp đạt, build đạt                                                                                  |
| `npm run test:quotation`               | 23 tình huống HTTP mô phỏng trên Chrome đạt                                                                               |
| Responsive/axe                         | 320/768/1024/1440 px sáng/tối; không tràn ngang; axe ở 320/1440 px không phát hiện vi phạm trong bản xem trước và lịch sử |
| `scripts/verify-live-auth-booking.ps1` | 34 bước trình duyệt thật đạt; bất biến SQL và dọn dữ liệu thử đạt                                                         |
| Kiểm tra độ nhạy test                  | Bỏ HALF_UP trên bản sao tạm làm test thất bại như dự kiến; hash mã nguồn gốc không đổi                                    |

Hồi quy trên giao diện cuối cùng: `npm run test:progress` đạt 35 tình huống; `npm run test:weighing` đạt 20 tình huống. `npm run format:check` đạt. Hai server hiện tại trả HTTP 200; cổng thử đã dừng và không còn tài khoản có marker live-test trong SQL.

Các ca lỗi gồm 401/403/404/409, lịch sử tải lỗi, thiếu cân/giá, lỗi 500 sau khi server đã lưu, nhấp đúp, hết hạn, báo giá cũ không thời hạn, nhầm nhân viên và trạng thái không cho gửi. Unit test thêm các trường hợp tiền không nhất quán, response lệch id/version/actor/phiếu cân, cập nhật cân đồng thời với xem trước, đổi phiên trong lúc gửi và lịch sử tải lỗi sau khi đã gửi thành công.

Luồng thật tạo dữ liệu tổng hợp có marker riêng, chạy Spring Boot cổng 18080 và Vite 5174: PENDING → CONFIRMED → ASSIGNED → EN_ROUTE → ARRIVED → lưu cân 5 kg → điều chỉnh 6 kg → gửi báo giá. SQL xác minh order version 7, 8 audit, hai phiếu cân giữ lịch sử, một báo giá SENT/current phiên bản 1 với dòng hàng tham chiếu phiếu cân điều chỉnh, đơn giá, tổng và hạn 24 giờ. Script dọn quote_items/order_quotes trước phiếu cân, rồi đơn/tài khoản thử; các server 8080/5173 tiếp tục hoạt động.

Ảnh và kết quả cục bộ: `.cache/collector-quotation/`, `.cache/live-auth/`. Đây là bằng chứng kiểm tra đồ án; giá SQL mẫu không phải giá thị trường. Các báo cáo ở các đợt trước giữ số liệu kiểm tra lịch sử tại thời điểm hoàn thành.

<!-- source-end:doc-frontend-vcoi-docs-collector-quotation-md -->

<a id="doc-frontend-vcoi-docs-collector-weighing-md"></a>
### Nhân viên nhập cân thực tế

Nguồn trước khi gộp: `Frontend VCoi/docs/collector-weighing.md`.

<!-- source-begin:doc-frontend-vcoi-docs-collector-weighing-md -->
<a id="doc-frontend-vcoi-docs-collector-weighing-md--nhân-viên-nhập-cân-thực-tế"></a>
#### Nhân viên nhập cân thực tế

Phạm vi: COLLECTOR được giao đơn, `/nhan-vien/don/:id`, trạng thái ARRIVED. Giữ ServiceLayout, màu xanh rừng/xanh chanh và các trạng thái tải/rỗng/lỗi. Không sửa backend/schema hay bổ sung gửi báo giá trong đợt này.

Nguồn chuẩn: backend `docs/collection-workflow.md`, `collection-workflow-openapi.json`, `WeighingRequest`, `WeighingService`, `WeighingController`.

- GET `/api/collector/orders/{id}/weighings` trả `{orderId,orderVersion,records}`. Đọc đủ lịch sử; lấy bản ghi id lớn nhất của từng item làm lần cân hiện tại. Chỉ mở form khi version lịch sử khớp version chi tiết.
- POST cùng URL với `{version,items:[{itemId,grossWeight,tareWeight,correctionOf,correctionReason}]}`; 1..50 item khác nhau thuộc đơn. Tổng > bì >= 0, tối đa 9 số nguyên/3 số lẻ. Form nhận dấu phẩy/chấm, không nhận ký hiệu khoa học hay phân tách hàng nghìn. Tính bằng số nguyên phần nghìn kg để tránh sai số hiển thị.
- Có thể chọn một hoặc nhiều vật liệu để cân trong một lô. Vật liệu chưa cân được chọn mặc định; khi cân điều chỉnh, tự tham chiếu phiếu mới nhất và bắt buộc lý do tối đa 500 ký tự. Không sửa/xóa phiếu cũ. Không gửi netWeight/giá/người thực hiện từ client.
- Thành công 201: vẫn ARRIVED, version +1; kiểm tra id/version/lịch sử/khối lượng server trả về trước khi cập nhật cache. Giữ cookie và CSRF mới, khóa nhấp lặp, không tự gửi lại POST.
- 404/409, 5xx, mất kết nối hoặc phản hồi sai: khóa ghi và yêu cầu tải lại cả đơn/lịch sử; tải lại lỗi tiếp tục khóa. 401 xử lý phiên chung; 403 cho thử lại. Không khôi phục cache riêng sau khi đổi phiên.
- Kiểm tra unit, UI, HTTP fixture, responsive/sáng/tối/axe và luồng trình duyệt + SQL thật bằng dữ liệu có marker, dọn đúng dữ liệu thử.

<a id="doc-frontend-vcoi-docs-collector-weighing-md--sử-dụng"></a>
##### Sử dụng

1. Đăng nhập nhân viên, mở đơn của mình, thực hiện **Khởi hành → Đã đến điểm thu gom** nếu đơn chưa ARRIVED.
2. Trong **Cân thực tế**, vật liệu chưa cân được chọn sẵn. Chọn/bỏ chọn các vật liệu cần lưu, nhập tổng và bì. Ví dụ tổng `5,250`, bì `0,250` sẽ hiển thị `5 kg`.
3. Bấm **Lưu kết quả cân**. Thành công vẫn ARRIVED; phần **Kết quả cân đã lưu** và **Lịch sử các lần cân** hiển thị dữ liệu server.
4. Muốn cân lại, chọn vật liệu đã có phiếu, sửa khối lượng và điền **Lý do cân điều chỉnh**. Hệ thống tham chiếu phiếu mới nhất và thêm phiếu mới, giữ phiếu trước.
5. Nếu báo xung đột, lịch sử chưa đồng bộ hoặc chưa rõ đã lưu chưa, chọn **Tải lại đơn và lịch sử cân** rồi kiểm tra dữ liệu. Không tự gửi lại POST hoặc nhập version/phiếu tham chiếu thủ công.

Tổng hiện tại chỉ cộng lần cân mới nhất của mỗi vật liệu, không cộng lặp các phiếu điều chỉnh. Đây là khối lượng thực tế, tách khỏi kg và tiền ước tính lúc khách đặt lịch. Lưu cân chưa gửi báo giá và chưa hoàn tất đơn.

<a id="doc-frontend-vcoi-docs-collector-weighing-md--kết-quả-kiểm-tra-24102026"></a>
##### Kết quả kiểm tra 24/10/2026

- `npm run check`: lint, **154 test trong 15 file** và production build đạt. Riêng phần cân có 33 test model/API và 12 test UI; gồm số thập phân, tổng/bì, giới hạn lô 50, lựa chọn vật liệu, tham chiếu/lý do điều chỉnh, xác thực phản hồi, cache và phiên.
- `npm run test:weighing`: **20 bước trình duyệt đạt**, HTTP fixture theo contract. Cân hai vật liệu, preview chính xác, một POST khi nhấp lặp, cân điều chỉnh/giữ lịch sử, reload, 401/403/404/409/5xx, lưu thành công nhưng trả 500, đồng bộ version, không có form ngoài trạng thái/phân công. Responsive 320/768/1024/1440 ở sáng/tối; axe kiểm tra cả form và lịch sử mở ở 320/1440, không vi phạm.
- `npm run test:progress`: **35 bước hồi quy đạt** sau khi tích hợp panel cân, xác nhận luồng khởi hành/đến nơi và giao diện cũ tiếp tục hoạt động.
- `scripts/verify-live-auth-booking.ps1`: **29 bước trình duyệt thật đạt** với Spring Boot 18080, Vite 5174 và SQL Server EcoThuGomDB. Cả chuỗi đăng ký, đặt lịch, admin xác nhận/phân công, nhân viên di chuyển, cân lần đầu và điều chỉnh, khách đọc trạng thái hoạt động qua API thật.
- SQL xác nhận: vẫn ARRIVED, version 6, đúng collector, một mặt hàng, bảy log trạng thái. Phiếu đầu tổng 5.250/bì 0.250/net 5.000; phiếu điều chỉnh tổng 6.250/bì 0.250/net 6.000, tham chiếu phiếu đầu, đúng lý do và actor. Dọn dữ liệu thử thành công và dừng hai server thử.
- Mutation trong bản sao tách biệt: cho phép nhầm tổng bằng bì; test phát hiện lỗi. File gốc không đổi và bản sao đã được dọn.
- Đã sửa khóa React riêng cho các panel trên chi tiết đơn; browser kiểm tra mỗi panel chỉ có một bản sau lưu. Không sửa nhãn accessibility để che lỗi trùng DOM.

Postman CLI chưa có trên máy. Dùng contract OpenAPI và bộ kiểm thử hiện có; không đẩy lên workspace Postman. Fixture xác minh frontend/xử lý lỗi; luồng thật và SQL xác minh tích hợp thực tế. Không thay backend/schema, phân quyền hoặc dependency.

Tệp chính: `src/features/orders/CollectorWeighing.jsx`, `WeighingForm.jsx`, `WeighingRow.jsx`, `WeighingHistory.jsx`, `useWeighing.js`, `weighing-model.js`, `weighing-form.js`, `weighing-api.js`; gắn tại `src/pages/OrderDetailPage.jsx`, CSS `src/styles/weighing.css`. Ảnh/kết quả: `.cache/collector-weighing/`, `.cache/live-auth/`.

<!-- source-end:doc-frontend-vcoi-docs-collector-weighing-md -->

<a id="doc-frontend-vcoi-docs-customer-workspace-md"></a>
### Hoàn thiện khu khách hàng VCoi

Nguồn trước khi gộp: `Frontend VCoi/docs/customer-workspace.md`.

<!-- source-begin:doc-frontend-vcoi-docs-customer-workspace-md -->
<a id="doc-frontend-vcoi-docs-customer-workspace-md--hoàn-thiện-khu-khách-hàng-vcoi"></a>
#### Hoàn thiện khu khách hàng VCoi

<a id="doc-frontend-vcoi-docs-customer-workspace-md--hướng-thiết-kế-chung"></a>
##### Hướng thiết kế chung

Theo yêu cầu ngày 24/10/2026, Taste Skill áp dụng cho toàn bộ frontend: website giới thiệu, tài khoản, khách hàng, nhân viên và quản trị, cả phần hiện có và phần mở rộng. Không thay nhận diện hoặc thư viện chỉ để đổi giao diện.

Design Read: khu dịch vụ thu mua cho người bán phế liệu, rõ ràng và tin cậy, tiếp nối ngôn ngữ VCoi xanh rừng/xanh chanh. Chế độ preserve, DESIGN_VARIANCE 3 / MOTION_INTENSITY 2 / VISUAL_DENSITY 5 cho khu chức năng. Dùng Be Vietnam Pro, Phosphor, tokens và CSS/React hiện có. Trang giới thiệu giữ bố cục/ảnh riêng đã thiết kế.

Audit: đã có header VCoi, ServiceLayout riêng, AdminLayout riêng; font tự lưu, tokens sáng/tối, bo góc và nút thống nhất. Khách mới có đặt lịch/danh sách/chi tiết, chưa xem hoặc phản hồi báo giá, chưa quản lý tài khoản/địa chỉ hay vòng đời đơn. Cần đưa quyết định báo giá lên trước thông tin tham khảo, dùng phân nhóm và nội dung thu gọn cho lịch sử, giữ các trang tài khoản riêng. Không thêm hero, số liệu giả, animation trang trí hoặc thay logo/URL cũ.

Taste Skill tập trung vào ngôn ngữ thị giác, bố cục, tương phản, nhịp chữ, copy và tính nhất quán; phần biểu mẫu nhiều bước, dữ liệu và phân quyền theo frontend-ui-engineering và contract backend. Không áp các mẫu hero/marketing vào form dịch vụ, bảng đơn hoặc quản trị. Điện thoại gom một cột; mọi hành động có nhãn, loading/empty/error/success và bàn phím.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--phạm-vi-và-quy-tắc"></a>
##### Phạm vi và quy tắc

- Báo giá hiện hành và lịch sử, chấp thuận/từ chối qua bước xem lại, ghi chú tối đa 500 ký tự; hết hạn không cho phản hồi. Đồng ý -> AWAITING_PAYMENT; từ chối -> ARRIVED, nhân viên xử lý lại. Backend giữ tiền/snapshot và kiểm tra version đơn + version báo giá.
- Hồ sơ tên/email, đổi mật khẩu qua API rồi đăng nhập lại; địa chỉ lưu sẵn, mặc định và dùng lúc đặt lịch.
- Timeline, cân và ảnh, trạng thái thanh toán, biên nhận từ giao dịch hoàn tất. Khách không ghi nhận thanh toán.
- Đổi lịch trực tiếp trước khởi hành; EN_ROUTE gửi admin; từ ARRIVED không đổi lịch. Mọi hủy là yêu cầu admin duyệt. Có lịch sử/rút yêu cầu PENDING.
- Ảnh vật liệu trước EN_ROUTE, JPEG/PNG tối đa 5 MiB, cookie/CSRF và quyền đơn. Khiếu nại từ các trạng thái backend cho phép, chỉ chọn ảnh đã gắn đúng đơn, xem kết luận.
- Không tự retry write, không cập nhật trạng thái trước response xác nhận; 404/409/kết quả chưa xác định khóa và đọc lại. Không khôi phục cache riêng khi phiên thay đổi, không ghi đè version mới hơn.

Nguồn: backend docs/collection-workflow-openapi.json, backend-completion-openapi.json, profile-addresses.md, SPEC-order-changes.md, SPEC-disputes.md, SPEC-evidence.md và mã DTO/service tương ứng. Giữ mọi thay đổi cũ; không sửa WebPCMaker.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--các-trang-và-cách-sử-dụng"></a>
##### Các trang và cách sử dụng

| Trang                           | Chức năng                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/khach-hang`                   | Các đơn thuộc tài khoản đang đăng nhập, lọc và phân trang                                             |
| `/khach-hang/don/:id`           | Báo giá ở đầu trang; quyết định, yêu cầu thay đổi và hỗ trợ; ảnh/cân/timeline/thanh toán được thu gọn |
| `/khach-hang/tai-khoan`         | Sửa tên/email, đổi mật khẩu; số điện thoại đăng nhập chỉ đọc                                          |
| `/khach-hang/dia-chi`           | Thêm/sửa/xóa và đặt mặc định, tối đa 100 địa chỉ                                                      |
| `/dat-lich`                     | Chọn địa chỉ đã lưu hoặc nhập mới, xem lại rồi gửi                                                    |
| `/khach-hang/don/:id/bien-nhan` | Khối lượng, đơn giá đã duyệt, khoản chi hoàn tất và in/lưu PDF                                        |

Đăng nhập CUSTOMER rồi mở đơn **Chờ khách duyệt báo giá**. Đối chiếu vật liệu, phiếu cân, đơn giá và tổng tiền. Chọn **Chấp thuận báo giá** hoặc **Từ chối báo giá**, nhập ghi chú nếu cần và xác nhận. Chỉ gửi ID, version và phản hồi; backend quyết định trạng thái và giữ giá đã chốt. Nếu từ chối, nhân viên có thể kiểm tra cân và gửi báo giá mới; lịch sử giữ cả bản cũ.

Sau khi đại lý ghi nhận thanh toán mô phỏng, mở **Thanh toán và biên nhận** → **Xem biên nhận thu mua**. Khách là người nhận tiền bán phế liệu. Biên nhận dùng dữ liệu giao dịch đã lưu; không dùng giá hiện hành để tính lại.

Muốn hủy đơn, vào **Hủy hoặc đổi lịch** → **Yêu cầu hủy đơn**, ghi lý do và xác nhận. Đơn giữ trạng thái cho đến khi admin xử lý. Có thể rút yêu cầu PENDING; không tạo yêu cầu mới khi đang chờ. Theo dõi kết luận tại lịch sử yêu cầu.

Muốn khiếu nại, vào **Hỗ trợ và khiếu nại** ở trạng thái được phép, mô tả vấn đề, chọn ảnh đã lưu của chính đơn nếu cần rồi xác nhận. Đơn chuyển DISPUTED trong khi admin xử lý. Kết luận được hiển thị tại lịch sử; khoản đã thanh toán được giữ nguyên.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--rà-soát-api-khách-hàng"></a>
##### Rà soát API khách hàng

Ký hiệu `{order}` là `/api/customer/orders/{id}`. Các URL dưới đây đều là API có sẵn trong backend, không tạo endpoint hoặc sửa schema trong đợt frontend này.

| Nhóm         | API đã nối vào giao diện                                                                                                       | Kết quả                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Xác thực/đơn | Đăng ký, đăng nhập, đăng xuất, `/api/auth/me`; GET/POST `/api/customer/orders`, GET `{order}`                                  | Giữ chức năng trước đây, thêm địa chỉ lưu sẵn khi đặt lịch       |
| Hồ sơ        | PUT `/api/auth/profile`, POST `/api/auth/password`                                                                             | Tên/email; mật khẩu mới hợp lệ, xóa phiên riêng và đăng nhập lại |
| Địa chỉ      | GET/POST `/api/customer/addresses`; PUT/DELETE `/{id}`; PUT `/{id}/default`                                                    | Quản lý từ danh sách đã tải, không gửi owner/role trong body     |
| Báo giá      | GET `{order}/quotes`; POST `/{quoteId}/accept` hoặc `/reject` dưới `{order}/quotes`                                            | Xem hiện hành/lịch sử, xác nhận với cả hai version               |
| Đổi lịch/hủy | POST `{order}/reschedule`, `/cancel`, `/change-requests`; GET `/change-requests`; POST `/change-requests/{requestId}/withdraw` | Đổi trực tiếp hoặc chờ admin theo trạng thái, hủy luôn cần admin |
| Minh chứng   | POST multipart `{order}/items/{itemId}/photo`; GET `/api/evidence/{name}`                                                      | Ảnh thật lưu backend, không chuyển thành URL bên ngoài           |
| Lịch sử/cân  | GET `{order}/timeline`, `/weighings`                                                                                           | Phân trang timeline; cân mới nhất và lịch sử điều chỉnh          |
| Thanh toán   | GET `{order}/payments`, `/receipt`                                                                                             | Chỉ đọc; biên nhận kiểm tra liên kết báo giá/phiếu cân/khoản chi |
| Khiếu nại    | GET/POST `{order}/disputes`                                                                                                    | Gửi nội dung và ảnh cùng đơn, xem trạng thái/kết luận            |

GET chi tiết địa chỉ `/{id}` không cần một trang riêng: form sửa dùng bản ghi trong danh sách API. Quyền sở hữu vẫn được backend kiểm tra khi sửa/xóa/đặt mặc định/đặt lịch. Không có chức năng khách hàng còn thiếu màn hình trong các nhóm API liệt kê trên.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--bảo-vệ-dữ-liệu-và-phục-hồi-lỗi"></a>
##### Bảo vệ dữ liệu và phục hồi lỗi

- Mỗi thao tác ghi lấy CSRF mới, giữ cookie HttpOnly; không lưu mật khẩu/token vào localStorage. Upload dùng FormData, để trình duyệt tự đặt multipart boundary.
- Phân quyền route và cache theo user/role. Khi phiên đổi hoặc hết hạn, dữ liệu riêng bị xóa. Hồ sơ trả về muộn sau đăng xuất/đổi tài khoản không được khôi phục phiên cũ.
- Nút ghi có khóa đồng bộ chống nhấp đúp; quyết định báo giá và yêu cầu đổi lịch gắn version lúc xem lại. Nếu dữ liệu đổi phải xem lại trước khi gửi.
- Sau 404/409 hoặc kết quả ghi chưa rõ, khóa thao tác và đọc lại. Không tự gửi lại POST. Đọc lại thất bại tiếp tục khóa. Phản hồi báo giá đã xác nhận vẫn được giữ khi tải lịch sử lỗi.
- Dữ liệu response được kiểm tra schema, phạm vi đơn, version, người phản hồi, liên kết và tổng tiền. Không hiển thị nội dung lỗi SQL/raw HTML từ server.
- Chỉ hiển thị ảnh với đường dẫn UUID hợp lệ cùng nguồn `/api/evidence/`; backend kiểm tra quyền, định dạng và kích thước. Không nhận URL ảnh bên ngoài từ form khiếu nại.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--kiểm-tra-và-bằng-chứng"></a>
##### Kiểm tra và bằng chứng

Đây là bản nghiệm thu khu khách trước đợt thanh toán nhân viên (226 test, 59 bước thật). Phần thanh toán sau đó đã có UI và luồng thật được nâng lên 60 bước; xem kết quả mới nhất tại [collector-payment.md](#doc-frontend-vcoi-docs-collector-payment-md).

Đợt kiểm tra ngày **24/10/2026**, Chrome trên Windows. Bộ API mô phỏng dựa trên OpenAPI/DTO/service trong repo; Postman CLI chưa có trên máy nên dùng Vitest và các script Playwright hiện có, không tạo hoặc đồng bộ workspace Postman.

| Kiểm tra                               | Kết quả                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                        | Lint không cảnh báo; **226 test / 24 file** đạt; build thành công                                                                       |
| `npm run test:customer`                | **27 kịch bản** qua ranh giới HTTP mô phỏng: quyết định, lỗi, tài khoản, địa chỉ, ảnh, thay đổi đơn, khiếu nại, biên nhận và responsive |
| `scripts/verify-live-auth-booking.ps1` | **59 bước với backend và SQL Server thật**, bao gồm thao tác UI khách hàng; bất biến SQL và dọn dữ liệu/ảnh thử đều PASS                |
| Kiểm tra độ nhạy test                  | Đảo điều kiện hết hạn trong bản sao tạm: test phát hiện lỗi; SHA-256 mã chính không đổi; đã xóa bản sao                                 |

Kiểm tra responsive ở **320, 768, 1024, 1440 px**, cả sáng/tối; quote/account/address/receipt không tràn ngang, có bàn phím và axe không có violation tại các màn hình được quét 320/1440. Đã xem ảnh desktop sáng và mobile tối để kiểm tra bố cục, khoảng cách, chữ và nút thực tế. Có tải/rỗng/lỗi/thành công và giới hạn ảnh rõ ràng. Phần tính năng dùng cùng font, màu và bo góc; không thêm chuyển động trang trí hoặc dependency.

Luồng thật dùng hai đơn tổng hợp và ba tài khoản tổng hợp có marker riêng. Đơn chính đi qua cân 5 kg → điều chỉnh 6 kg, báo giá đầu bị từ chối → bản thứ hai được chấp thuận → chi trả mô phỏng → khiếu nại → giải quyết. SQL xác nhận **COMPLETED version 14, 15 audit, hai phiếu cân, hai báo giá, một payment hoàn tất**; người tạo/phản hồi, giá chốt, hạn 24 giờ và liên kết phiếu cân khớp nhau. Đơn phụ dùng ảnh PNG tổng hợp, đổi lịch, rút yêu cầu và được admin duyệt hủy ở version 6. Xóa địa chỉ không sửa snapshot của các đơn. Mật khẩu chỉ đổi cho tài khoản thử, sau đó đăng nhập lại thành công.

Các bước admin duyệt hủy/xử lý khiếu nại và nhân viên ghi khoản chi trong kiểm tra thật gọi **API hiện có bằng session đúng vai trò**, chưa phải màn hình mới. Dùng một phiên thử cho mỗi vai trò để tuân thủ giới hạn đăng nhập của backend; không giảm hoặc tắt bảo vệ. Server thử 18080/5174 đã dừng, các server của người dùng 8080/5173 được giữ nguyên.

Tệp bằng chứng tại máy:

- `.cache/customer-workspace/results.json` và các ảnh `order/account/address/receipt-320/1440-light/dark.png`.
- `.cache/live-auth/result.json`, `.cache/live-auth/customer-receipt.png` và log kiểm tra; dữ liệu SQL/ảnh thử đã được dọn.
- `.cache/customer-review/mutation.json`.

Hồi quy các khu hiện có cũng đạt: `test:flows` **55**, `test:dispatch` **40**, `test:progress` **35**, `test:weighing` **20**, `test:quotation` **23**, `test:browser` **21** kịch bản. Các kiểm tra bao gồm lỗi/khôi phục, phân quyền, layout chức năng tách khỏi giới thiệu, màn hình nhỏ và sáng/tối. Trang chủ và bảng giá dùng API thật cho bước kiểm tra dữ liệu; các lỗi/rỗng được mô phỏng. Đã xem lại ảnh trang chủ và admin để kiểm tra tính nhất quán với khu khách.

Rà soát cuối đã sửa các trường hợp báo giá đã phản hồi bị che khi tải lịch sử lỗi, thông báo 404 địa chỉ bị nhầm với đơn, và dữ liệu hồ sơ/lịch sử đến muộn sau khi phiên đổi. Các trường hợp cạnh tranh có kiểm thử riêng; điều kiện bình thường vẫn cho tải và lưu dữ liệu mới.

<a id="doc-frontend-vcoi-docs-customer-workspace-md--tệp-triển-khai-chính"></a>
##### Tệp triển khai chính

| Nhóm tệp                                                                                                  | Vai trò                                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/features/customer/`                                                                                  | API/schema, quyết định báo giá, tài khoản/địa chỉ, yêu cầu thay đổi, ảnh, khiếu nại, lịch sử và hook xử lý phiên/version |
| `src/pages/CustomerAccountPage.jsx`, `CustomerAddressesPage.jsx`, `CustomerReceiptPage.jsx`               | Các trang khách mới                                                                                                      |
| `src/pages/OrderDetailPage.jsx`, `BookingPage.jsx`; `src/App.jsx`, `src/components/ServiceLayout.jsx`     | Ghép tính năng, chọn địa chỉ và điều hướng đúng khu                                                                      |
| `src/lib/api.js`, `validation.js`; `src/components/EvidenceImage.jsx`                                     | Cookie/CSRF, multipart và ảnh cùng nguồn; helper dùng chung                                                              |
| `src/features/orders/quotation-api.js`, `weighing-api.js`, `WeighingHistory.jsx`                          | Dùng lại API đọc theo vai trò và hiển thị ảnh; mặc định COLLECTOR được giữ                                               |
| `src/styles/customer.css`, `evidence.css`                                                                 | Bố cục responsive, sáng/tối và in biên nhận theo tokens VCoi                                                             |
| `scripts/verify-customer-workspace.mjs`, `fixtures/customer-workspace.mjs`, `live-customer-workspace.mjs` | Tình huống HTTP mô phỏng và phần khách của luồng thật                                                                    |

<a id="doc-frontend-vcoi-docs-customer-workspace-md--giới-hạn-và-phần-tiếp-theo"></a>
##### Giới hạn và phần tiếp theo

Đã hoàn thiện các nhóm chức năng **khách hàng** trên backend hiện có. Nhân viên đã được bổ sung màn hình [ghi nhận thanh toán mô phỏng](#doc-frontend-vcoi-docs-collector-payment-md); admin đã có [quản lý danh mục/vật liệu](#doc-frontend-vcoi-docs-admin-catalog-ui-md) trong các đợt tiếp theo. Admin còn cần các màn hình bảng giá, tài khoản, duyệt yêu cầu thay đổi, xử lý khiếu nại và thống kê. Không cần tạo lại API khách hàng vừa nối.

Các báo cáo đợt trước trong `docs/` là bằng chứng lịch sử với số test và trạng thái đơn tại thời điểm đó. Báo cáo này mô tả phạm vi khách hàng mới nhất. Không thay backend/schema, không có thanh toán tiền thật và không sửa dự án tham khảo `D:\WebPCMaker\frontend`.

<!-- source-end:doc-frontend-vcoi-docs-customer-workspace-md -->

<a id="doc-frontend-vcoi-docs-design-direction-md"></a>
### Hướng giao diện VCoi

Nguồn trước khi gộp: `Frontend VCoi/docs/design-direction.md`.

<!-- source-begin:doc-frontend-vcoi-docs-design-direction-md -->
<a id="doc-frontend-vcoi-docs-design-direction-md--hướng-giao-diện-vcoi"></a>
#### Hướng giao diện VCoi

Yêu cầu cập nhật 24/10/2026: áp dụng **Taste Skill** cho toàn bộ frontend VCoi, gồm trang giới thiệu, tài khoản, khách hàng, nhân viên và quản trị, cả phần đã có và phần bổ sung. Giữ nhận diện xanh rừng/xanh chanh, font Be Vietnam Pro, Phosphor, các URL cũ và bố cục chức năng tách website giới thiệu. Rà tổng thể theo cùng tokens và nhịp chữ/khoảng cách, nhưng dùng mức mật độ phù hợp từng khu; không đưa mẫu hero hoặc animation marketing vào form dịch vụ/bảng quản trị. Xem audit và hướng nghiệm thu khu khách tại `customer-workspace.md`.

Thiết kế mới cho đại lý thu mua phế liệu. Tham khảo ảnh công nghiệp khổ lớn và lời kêu gọi dịch vụ rõ ràng của [Radius Recycling](https://www.radiusrecycling.com/) và [SA Recycling](https://www.sarecycling.com/). Không sao chép logo, nội dung hay ảnh của hai doanh nghiệp.

<a id="doc-frontend-vcoi-docs-design-direction-md--phạm-vi-bản-nền"></a>
##### Phạm vi bản nền

- Trang chủ: giới thiệu dịch vụ, các nhóm vật liệu, quy trình thu gom và câu hỏi thường gặp.
- Trang bảng giá: đọc API thật, lọc nhóm vật liệu, phân trang, làm mới; có trạng thái tải, rỗng và lỗi.
- Điều hướng, trang 404, giao diện sáng/tối theo hệ điều hành, bàn phím và màn hình nhỏ.
- Đợt khởi tạo chỉ gồm các trang công khai. Đợt tiếp theo đã thêm xác thực, đặt lịch và trang danh sách/chi tiết theo vai trò; xem `auth-booking-spec.md`.

<a id="doc-frontend-vcoi-docs-design-direction-md--quyết-định-thiết-kế"></a>
##### Quyết định thiết kế

- Tính cách: công nghiệp hiện đại, gần gũi với hộ gia đình Việt Nam. Thiết kế riêng bằng CSS tokens và Tailwind v4; chưa cần một thư viện component lớn.
- Design variance 6/10: ảnh khổ lớn, các vùng có nhịp bố cục khác nhau; giữ điều hướng và bảng giá quen thuộc.
- Motion 3/10: chỉ phản hồi hover/focus và xuất hiện nhẹ; tôn trọng reduced motion.
- Density 4/10: nội dung ngắn, không dùng số liệu doanh nghiệp, khách hàng hoặc cam kết dịch vụ chưa được xác nhận.
- Xanh rừng là màu thương hiệu; xanh chanh là màu hành động trong bản thiết kế mới. Font Be Vietnam Pro tự lưu trữ, có dấu tiếng Việt.
- Một hệ góc bo nhỏ, khoảng cách nhất quán; ảnh minh họa tạo bằng AI, không đại diện cơ sở thực tế.
- Trang chủ có hành động xem giá và đặt lịch; đặt lịch đi qua xác thực đúng vai trò.

<a id="doc-frontend-vcoi-docs-design-direction-md--ranh-giới-dữ-liệu-và-tiêu-chí-nghiệm-thu"></a>
##### Ranh giới dữ liệu và tiêu chí nghiệm thu

- Chỉ gọi GET `/api/material-categories` và `/api/prices/current` theo hợp đồng backend. Không ghi hoặc seed SQL Server.
- Dữ liệu API đi qua React auto-escaping; không render HTML trực tiếp. Không ghi token vào localStorage.
- API dùng URL tương đối; Vite proxy `/api` đến backend. Khi triển khai thật cần reverse proxy, HTTPS và SPA fallback.
- Giá chưa có hiệu lực hiển thị “Liên hệ báo giá”, không biến thành 0 đồng. Backend lỗi phải báo lỗi, không thay bằng dữ liệu giả.
- Giá VND/kg; thời gian cập nhật hiển thị theo Việt Nam. Dữ liệu SQL mẫu hiện tại vẫn chỉ phục vụ đồ án.
- Kiểm tra desktop, 320 px, 768 px, 1024 px và 1440 px; không tràn ngang; menu dùng được bằng bàn phím; trạng thái lỗi có nút thử lại.

<!-- source-end:doc-frontend-vcoi-docs-design-direction-md -->

<a id="doc-frontend-vcoi-docs-frontend-redesign-md"></a>
### Thiết kế lại VCoi

Nguồn trước khi gộp: `Frontend VCoi/docs/frontend-redesign.md`.

<!-- source-begin:doc-frontend-vcoi-docs-frontend-redesign-md -->
<a id="doc-frontend-vcoi-docs-frontend-redesign-md--thiết-kế-lại-vcoi"></a>
#### Thiết kế lại VCoi

Phạm vi: các màn hình frontend đã có, giữ nghiệp vụ và hợp đồng API. PublicLayout, ServiceLayout và AdminLayout tiếp tục tách biệt. Không chỉnh sửa WebPCMaker.

Hướng thiết kế: xanh rừng, nền ngà, điểm nhấn xanh chanh; Be Vietnam Pro và ảnh minh họa WebP hiện có. Biến tấu 7/10, chuyển động 3/10, mật độ 4/10. Không thêm dependency, số liệu giả hoặc đánh giá khách hàng tự bịa.

Audit: hero phủ tối, các phần giới thiệu nhịp đều, cam chưa đồng bộ admin xanh chanh, biểu mẫu thiếu phân cấp bề mặt. Bản sao src và ảnh trước sửa lưu trong .cache vì workspace không có Git.

Tiêu chí: CTA đặt lịch nổi bật, nội dung và FAQ đầy đủ; bảng giá/form/dashboard đồng bộ; giữ tải/rỗng/lỗi, quyền và các thao tác thật. Kiểm tra 320/768/1024/1440 px, sáng/tối, bàn phím, reduced motion, axe; unit/lint/build và browser hiện có. Browser fixture không thay cho kiểm tra backend thật.

<a id="doc-frontend-vcoi-docs-frontend-redesign-md--kết-quả-kiểm-tra"></a>
##### Kết quả kiểm tra

- `npm run check`: lint, 76 test trong 11 file và production build thành công.
- `npm run test:browser`: 21 bước thành công; trang chủ/bảng giá ở 4 kích thước, sáng/tối, menu bàn phím, FAQ, lỗi/rỗng/retry; đọc bảng giá thật qua Vite proxy. Không ghi SQL.
- `npm run test:flows`: 55 bước thành công; đăng ký/đăng nhập, đặt lịch/xem lại, phiên, phân quyền, đăng xuất; responsive và axe. HTTP fixture theo hợp đồng hiện có.
- `npm run test:dispatch`: 40 bước thành công; xác nhận/phân công, chống gửi lặp, version/CSRF, lỗi, hết phiên, lọc/phân trang, responsive và axe. HTTP fixture, không phải kiểm tra ghi trên backend thật.
- Đã xem ảnh trang chủ, đăng nhập, đặt lịch và admin; giữ nhãn và focus cho bàn phím. Chuyển động vào trang chỉ chạy khi người dùng không bật reduced motion.
- Không có thay đổi logic API/session/query/payload. Không cần kiểm tra ghi SQL lại cho đợt thay markup/CSS này; đợt live SQL trước được ghi riêng trong báo cáo admin.

Ảnh kiểm tra: `.cache/verification/`, `.cache/auth-booking/`, `.cache/admin-dispatch/`. Bản sao trước sửa: `.cache/redesign-before.zip` (chỉ src). Có một lần Vitest đọc nhầm test trong thư mục bản sao; đã đóng gói bản sao và chạy lại toàn bộ thành công, không đổi cấu hình test để né lỗi.

Tệp chính: `src/pages/HomePage.jsx`, `src/features/home/`, `src/pages/PricesPage.jsx`, `src/features/auth/AuthLayout.jsx`, hai layout chức năng và `src/styles/`. `index.html` đồng bộ theme-color và kích thước preload ảnh với hero mới. Giữ nguyên đường dẫn chức năng và yêu cầu hủy lịch qua admin.

<!-- source-end:doc-frontend-vcoi-docs-frontend-redesign-md -->

---

<a id="group-xac-minh"></a>
## Các đợt kiểm thử và rà soát

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md"></a>
### Rà soát hoàn thiện đồ án VCoi

Nguồn trước khi gộp: `BAO_CAO_RA_SOAT_VCOI_2026-10-25.md`.

<!-- source-begin:doc-bao-cao-ra-soat-vcoi-2026-10-25-md -->
<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--rà-soát-hoàn-thiện-đồ-án-vcoi"></a>
#### Rà soát hoàn thiện đồ án VCoi

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--bổ-sung-sau-triển-khai--25102026"></a>
##### Bổ sung sau triển khai — 25/10/2026

Mục 1 trong bảng việc tiếp theo (sửa cạnh tranh sửa/duyệt/từ chối giá nháp giữa nhiều phiên admin) đã hoàn tất. Hợp đồng backend yêu cầu revision snapshot trong cùng transaction; frontend gửi revision đã tải và chặn thao tác tiếp sau 409. Hai phiên Chrome độc lập đã kiểm thử xen kẽ edit/approve/reject với SQL Server thật: 31 kiểm tra đạt, dữ liệu thử đã được dọn. Chi tiết ở `ecothugom-backend/docs/admin-prices-verification.md`. Các việc giao diện khác trong bảng bên dưới vẫn còn.

Backend chính tại cổng 8080 đã khởi động lại bằng bản sửa và API bảng giá trả HTTP 200; JAR mặc định đã đóng gói thành công. Kiểm thử tập trung backend đạt 18/18; toàn bộ frontend đạt 440/440 và build thành công.

Ngày rà soát: 25/10/2026. Phạm vi: `D:\VCOI\Frontend VCoi` và `D:\VCOI\ecothugom-backend`, đối chiếu tài liệu TH4 Hướng 1 và bản phân tích EcoThuGom đã cung cấp.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--1-kết-luận"></a>
##### 1. Kết luận

Luồng thu mua chính đã có ở cả frontend và backend, gồm đặt lịch, xác nhận, phân công, di chuyển, cân và hiệu chỉnh, gửi báo giá, khách duyệt, thanh toán mô phỏng và biên nhận. Các nhóm quản trị danh mục, vật liệu, giá, tài khoản, yêu cầu thay đổi, khiếu nại và thống kê cũng đã được triển khai.

Phát hiện đáng chú ý nhất là **lỗi duyệt giá khi hai phiên cùng thao tác**, đã tái hiện với Chrome, Spring Boot và SQL Server thật. Một số chức năng backend đã có nhưng giao diện chưa hỗ trợ: phân công lại nhân viên; hồ sơ thu mua đầy đủ cho admin; tải ảnh phiếu cân; quản lý hồ sơ và đổi mật khẩu cho nhân viên/admin.

Phạm vi chuẩn vẫn là **một đại lý thu mua, React JavaScript, Spring Boot, SQL Server, thanh toán mô phỏng**. Mọi yêu cầu hủy cần admin xử lý theo lựa chọn của chủ đồ án. Không xem thiếu nhiều đại lý, thanh toán ngân hàng thật hoặc AI nhận dạng ảnh là lỗi của MVP hiện tại.

Lượt này chỉ rà soát, chạy kiểm tra và tạo báo cáo/probe trong thư mục kiểm thử; không sửa mã nguồn chức năng. Không thao tác dự án WebPCMaker.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--2-đối-chiếu-chức-năng-đã-có"></a>
##### 2. Đối chiếu chức năng đã có

| Nhóm | Backend | Frontend | Phần còn lại |
|---|---|---|---|
| Đăng ký, đăng nhập, đăng xuất, ba vai trò | Có, session/cookie/CSRF và kiểm tra tài khoản bị khóa | Có điều hướng theo vai trò và bảo vệ trang | Hồ sơ/đổi mật khẩu trên UI mới dành cho khách hàng |
| Danh mục, vật liệu, giá công khai | Có lọc/phân trang, ẩn nhóm, ngừng thu mua, giá theo hiệu lực | Có trang công khai và quản trị | Cần xử lý cạnh tranh sửa/duyệt giá như mục 3 |
| Khách đặt lịch | Có nhiều vật liệu, ước tính, địa chỉ lưu sẵn và snapshot liên hệ | Có đặt lịch, danh sách, chi tiết | Chưa kiểm tra vùng phục vụ/giờ mở cửa của đại lý |
| Admin xác nhận, phân công | Có xác nhận, phân công, chống trùng lịch và phân công lại | Có xác nhận/phân công lần đầu | Chưa có thao tác đổi nhân viên trên đơn ASSIGNED |
| Nhân viên di chuyển, cân, báo giá | Có chuyển trạng thái, cân thực tế, hiệu chỉnh giữ lịch sử và báo giá | Có các màn hình thao tác | Chưa có tải ảnh phiếu cân; cần mở rộng đọc chứng cứ theo vai trò |
| Khách duyệt và thanh toán mô phỏng | Có chấp thuận/từ chối, thanh toán từ báo giá đã chấp thuận, chống ghi lặp | Có khách duyệt/từ chối và nhân viên ghi nhận thanh toán | Không cần tích hợp thanh toán thật cho phạm vi này |
| Hồ sơ, địa chỉ | Có sửa tên/email, đổi mật khẩu thu hồi phiên, quản lý địa chỉ | Có ở khu khách hàng | Thiếu trang hồ sơ riêng cho nhân viên và quản trị viên |
| Hủy và đổi lịch | Có yêu cầu, quyết định admin, rút yêu cầu và xử lý phiên bản đơn | Có các màn hình khách/admin tương ứng | Phân công lại trước khởi hành chưa có UI |
| Lịch sử, biên nhận | Có timeline và biên nhận theo quyền của ba vai trò | Có ở khu khách hàng | Admin chưa có trang hồ sơ đầy đủ; nhân viên chưa có màn hình timeline/biên nhận riêng |
| Ảnh minh chứng | Có tải ảnh vật liệu, ảnh cân, lưu backend, đọc theo quyền | Khách tải ảnh vật liệu; có thành phần đọc ảnh | Nhân viên chưa tải ảnh cân từ UI |
| Khiếu nại | Có khách mở; admin tiếp nhận, giải quyết/từ chối, lưu kết luận | Có các màn hình tương ứng | Admin xem được ảnh gắn vào khiếu nại nhưng còn thiếu toàn bộ chứng cứ/hồ sơ của đơn |
| Thống kê | Có số đơn, tỷ lệ hoàn tất, khối lượng, tiền thu mua theo kỳ | Có bộ lọc, các chỉ số và phân tích vật liệu/nhân viên | Xuất Excel/PDF là bổ sung tùy chọn |

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--3-lỗi-đã-tái-hiện-duyệt-giá-khác-với-giá-đang-xác-nhận"></a>
##### 3. Lỗi đã tái hiện: duyệt giá khác với giá đang xác nhận

**Ưu tiên cao.** Hai phiên quản trị cùng thao tác có thể làm công bố một đơn giá mà người duyệt chưa xác nhận trên màn hình.

Kịch bản đã chạy:

1. Tạo vật liệu và bản nháp giá riêng cho kiểm thử, đơn giá 1.000đ.
2. Phiên A mở xác nhận duyệt giá 1.000đ. Frontend thực hiện GET kiểm tra bản nháp trước khi gửi quyết định.
3. Sau GET đó nhưng trước khi POST duyệt đến backend, phiên B sửa bản nháp thành 2.000đ.
4. Phiên A gửi POST duyệt với body `{}`. Backend trả `200`, bản giá trở thành `APPROVED` với đơn giá 2.000đ.
5. API bảng giá công khai trả 2.000đ. Frontend A phát hiện kết quả khác dự kiến và báo lỗi sau khi giao dịch đã được lưu.

Nguồn gốc: backend khóa bản ghi và kiểm tra trạng thái DRAFT, nhưng không đối chiếu phiên bản chỉnh sửa mà người duyệt đã xem. `versionNumber` hiện là số phiên bản giá, không tăng khi sửa cùng bản nháp. GET kiểm tra ở frontend không bảo vệ được khoảng thời gian giữa đọc và ghi. Tài liệu frontend bảng giá cũng đã ghi nhận giới hạn này; lượt rà soát hiện tại bổ sung bằng chứng tái hiện thực tế.

- [AdminPriceService.java](<ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminPriceService.java:46>): update/approve chỉ kiểm tra nháp hiện tại.
- [AdminPriceRequests.java](<ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminPriceRequests.java:13>): Update/Review chưa có revision mong đợi.
- [prices-api.js](<Frontend VCoi/src/features/admin/prices-api.js:97>): GET kiểm tra rồi gửi thao tác ghi riêng.
- [Kết quả tái hiện](<D:/Vcoi1/Cleanup-20261025-104757/Frontend VCoi/.cache/audit-price-race/result.json>).

Việc nên làm: bổ sung revision cho bản nháp hoặc cơ chế đối chiếu snapshot tương đương **trong cùng giao dịch ghi ở backend**; áp dụng cho sửa, duyệt và từ chối. Yêu cầu cũ phải trả `409` mà không thay đổi giá. Giữ nguyên ý nghĩa số phiên bản giá. Bổ sung kiểm thử hai phiên xen kẽ và cập nhật hợp đồng API/UI.

Tiêu chí xong: A xác nhận 1.000đ, B đã sửa 2.000đ thì quyết định cũ của A bị từ chối; không tự công bố giá 2.000đ. Các luồng duyệt một phiên và lịch sử giá vẫn hoạt động.

Dữ liệu thử được tạo bằng marker ngẫu nhiên, không dùng tài khoản người dùng; đã xóa đúng bản ghi thử và đóng tiến trình thử.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--4-những-màn-hình-cần-hoàn-thiện"></a>
##### 4. Những màn hình cần hoàn thiện

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--41-admin-phân-công-lại-nhân-viên"></a>
###### 4.1. Admin phân công lại nhân viên

Backend đã có `POST /api/admin/orders/{id}/reassign`, cho đơn ASSIGNED trước khi khởi hành, kiểm tra version và lịch nhân viên. [OrderChangeController.java](<ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeController.java:19>).

Frontend [AdminDispatch.jsx](<Frontend VCoi/src/features/orders/AdminDispatch.jsx:17>) chỉ mở hành động cho PENDING/CONFIRMED chưa có nhân viên. Đơn ASSIGNED hiện chỉ hiển thị thông tin phân công. Khi đổi nhân viên hoặc người đang được giao bị khóa, admin phải gọi API ngoài giao diện.

Cần thêm chọn nhân viên thay thế, lý do, bước xác nhận, xử lý đơn cũ/trùng lịch/tài khoản bị khóa và tải lại dữ liệu sau thành công. Đơn EN_ROUTE không được đổi trực tiếp bằng nghiệp vụ này.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--42-admin-xem-đầy-đủ-hồ-sơ-thu-mua"></a>
###### 4.2. Admin xem đầy đủ hồ sơ thu mua

[OrderDetailPage.jsx](<Frontend VCoi/src/pages/OrderDetailPage.jsx:61>) ở vai trò ADMIN hiện gồm phân công, thông tin liên hệ và vật liệu/tiền ước tính. Các khối cân, báo giá, thanh toán và tiện ích lịch sử/ảnh được đặt điều kiện dành cho CUSTOMER hoặc COLLECTOR.

Cần bổ sung khu chỉ đọc gồm ảnh vật liệu, lịch sử cân/hiệu chỉnh, ảnh phiếu cân, báo giá và phản hồi khách, tiền đã chi, timeline và biên nhận. Dùng API admin hiện có; không cấp quyền ghi cân/thanh toán cho admin chỉ để đọc dữ liệu. Khiếu nại hiện đã hiển thị ảnh khách chọn gắn vào vụ việc, nhưng admin chưa duyệt được trọn bộ hồ sơ của đơn ngay trên web.

API timeline/receipt/weighings theo quyền đã có trong [OrderHistoryController.java](<ecothugom-backend/src/main/java/com/ecothugom/orders/OrderHistoryController.java:14>).

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--43-nhân-viên-tải-ảnh-phiếu-cân"></a>
###### 4.3. Nhân viên tải ảnh phiếu cân

Backend đã có `POST /api/collector/orders/{id}/weighings/{weighingId}/photo`. [EvidenceController.java](<ecothugom-backend/src/main/java/com/ecothugom/orders/EvidenceController.java:17>).

Frontend có hiển thị `photoUrl` trong lịch sử cân khi có ảnh, nhưng chưa gọi API tải ảnh cân. Cần thêm chọn/xem trước ảnh JPEG/PNG tối đa 5 MiB, tải cho lần cân hợp lệ, cập nhật version mới và xử lý lỗi/ghi chưa rõ kết quả. Giữ quy tắc backend: đúng nhân viên được giao, đơn ARRIVED, lần cân mới nhất chưa được báo giá tham chiếu, không ghi đè chứng cứ cũ.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--44-hồ-sơ-và-mật-khẩu-cho-nhân-viênadmin"></a>
###### 4.4. Hồ sơ và mật khẩu cho nhân viên/admin

Backend `/api/auth/profile` và `/api/auth/password` áp dụng cho người đã xác thực; [ProfileController.java](<ecothugom-backend/src/main/java/com/ecothugom/auth/ProfileController.java:12>). Frontend chỉ có `/khach-hang/tai-khoan`; xử lý phản hồi hồ sơ hiện còn yêu cầu role CUSTOMER.

Cần trang tài khoản cá nhân riêng hoặc component dùng chung theo vai trò, không nhầm với trang admin quản lý tài khoản người khác. Sau đổi mật khẩu phải đăng nhập lại theo cơ chế thu hồi phiên hiện có. Quên mật khẩu là chức năng khác, hiện chưa có luồng khôi phục; chỉ bổ sung nếu đưa vào phạm vi.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--45-cải-thiện-thao-tác-trên-giao-diện"></a>
###### 4.5. Cải thiện thao tác trên giao diện

Đối chiếu thêm [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Hai điểm này có mức ưu tiên thấp hơn lỗi giá và các màn hình nghiệp vụ còn thiếu:

- `D:\VCOI\Frontend VCoi\src\pages\BookingPage.jsx:33` — biểu mẫu đặt lịch chưa có bảo vệ nội dung chưa gửi khi rời trang. Đã tái hiện bằng Chrome/API giả lập: nhập ghi chú, mở Lịch thu gom của tôi, chờ trang danh sách hiển thị rồi Back; ghi chú trở thành rỗng và không có cảnh báo. Nên hỏi trước khi rời biểu mẫu đã thay đổi hoặc giữ bản nháp trong phiên làm việc, có xóa khi đăng xuất. [Kết quả probe](<D:/Vcoi1/Cleanup-20261025-104757/Frontend VCoi/.cache/audit-unsaved-form.json>).
- `D:\VCOI\Frontend VCoi\src\pages\WorkspacePage.jsx:15` — số trang danh sách khách/nhân viên chỉ lưu bằng state trong component, chưa đưa vào URL. Nên giữ số trang khi tải lại hoặc trở về từ chi tiết. Phát hiện này dựa trên mã nguồn, chưa có probe trình duyệt riêng cho phân trang.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--5-khoảng-trống-nghiệp-vụ-cần-chốt-với-tài-liệu-nộp-bài"></a>
##### 5. Khoảng trống nghiệp vụ cần chốt với tài liệu nộp bài

| Nội dung | Hiện trạng và hướng xử lý |
|---|---|
| Vùng phục vụ và giờ làm việc — FR05 | Hiện kiểm tra thời gian tương lai, thứ tự đầu/cuối và trùng lịch khi giao nhân viên. Chưa có kiểm tra địa bàn phục vụ hoặc giờ mở cửa/ngày nghỉ. Với một đại lý, cấu hình địa bàn và giờ làm đơn giản là đủ; chưa cần bản đồ/lộ trình tối ưu. Tham chiếu PickupWindow.java:9 và CustomerOrderService.java:40. |
| Thông báo — FR07 | Khách xem được trạng thái/timeline bằng tải lại; chưa có module thông báo và đánh dấu đã đọc. Nếu giữ yêu cầu thông báo trong bản đặc tả, cần bổ sung thông báo trong ứng dụng cho xác nhận, báo giá, thay đổi lịch và kết luận khiếu nại. Email/SMS có thể để sau. |
| Vật liệu thực tế khác khai báo — BR02/BR09 | Chưa có nghiệp vụ loại bỏ riêng từng dòng không đủ điều kiện hoặc đổi phân hạng khi kiểm tra. Gửi báo giá hiện yêu cầu mọi dòng có cân dương và có giá hiện hành. Cần xác định rõ MVP chỉ nhận đúng dòng đã đăng ký hay bổ sung điều chỉnh dòng hàng có lý do và khách duyệt. Không nhập cân giả để vượt điều kiện gửi báo giá. |
| Đánh giá sau thu gom | Bản mô tả cũ có nhắc đánh giá nhưng chưa có module riêng. Đây là phần bổ sung theo phạm vi báo cáo, không thay thế khiếu nại đã có. |
| Giá giữ trong 24 giờ | Bản thiết kế cũ có chính sách đề xuất giữ giá khi đặt lịch. Mã hiện tại lấy giá hiện hành lúc gửi báo giá, báo giá gửi có hiệu lực 24 giờ. Hai quy tắc khác nhau; cần sửa tài liệu theo lựa chọn hiện tại hoặc chủ động thiết kế lại nếu muốn giữ giá lúc đặt. |

Bản Word cũ còn nhắc nhiều đại lý, PostgreSQL/object storage và cách tự hủy trước khởi hành. Cần cập nhật báo cáo/ERD/sơ đồ/use case theo hệ thống đã thống nhất: một đại lý, SQL Server, ảnh lưu backend, mọi hủy qua admin và thanh toán mô phỏng. Không tự khôi phục các yêu cầu cũ đã được thay đổi trong trao đổi.

TH4 Hướng 1 yêu cầu chọn một chức năng bổ sung có vai trò, luồng nghiệp vụ, ít nhất bốn quy tắc, một hiện vật thiết kế và liên hệ phân hệ. Không bắt buộc triển khai mọi chủ đề gợi ý như voucher, giỏ hàng hoặc AI. Có thể dùng luồng báo giá–khách duyệt–thanh toán hoặc dashboard hiện có để hoàn thiện phần thiết kế này.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--6-chuẩn-bị-chạy-và-bàn-giao-trên-máy-mới"></a>
##### 6. Chuẩn bị chạy và bàn giao trên máy mới

Trong D:\VCOI chưa tìm thấy script tạo đầy đủ database/bảng/khóa/ràng buộc/index cho **SQL Server**. Có seed/verify dữ liệu và schema **H2 phục vụ kiểm thử**. README gốc nói database đã được tạo trước, backend dùng `ddl-auto=validate` và không tự khởi tạo schema.

Cần gom hoặc xuất lại script SQL đã dùng trước đây vào dự án, kèm phiên bản schema và thứ tự chạy. Không dùng nguyên fixture H2 làm script SQL Server. Sau đó thử trên database kiểm thử mới, không xóa database đang dùng.

Bộ bàn giao nên có: hướng dẫn cài/chạy; cấu hình DB_PORT/SQL instance; tạo admin; tạo dữ liệu demo cho ba vai trò mà không ghi mật khẩu thật vào tài liệu; sao lưu DB cùng thư mục ảnh; kịch bản trình diễn thành công và ngoại lệ. Có thể gộp chỉ mục tài liệu/API để người chấm tìm đúng hợp đồng. Git và tự động hóa kiểm tra là cải tiến vận hành nên thêm sau các việc chức năng ưu tiên.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--7-kiểm-tra-thực-tế-trong-lượt-rà-soát"></a>
##### 7. Kiểm tra thực tế trong lượt rà soát

| Kiểm tra | Kết quả |
|---|---|
| Frontend `npm run check` | Đạt: ESLint, 38 file/437 bài kiểm thử Vitest, Vite build |
| Frontend `npm run format:check` | Đạt |
| Frontend `npm audit --json` | 0 lỗ hổng được báo trong lần quét này |
| Backend `.\mvnw.cmd -B -ntp test` | 211 test, 0 lỗi, 0 thất bại, 0 bỏ qua; dùng H2 riêng của test |
| Luồng thật `verify-live-auth-booking.ps1` | 60 kiểm tra trình duyệt + HTTP thật đạt; đối chiếu SQL đạt; dữ liệu/ảnh/tiến trình thử đã dọn |
| Probe hai phiên duyệt giá | Tái hiện lỗi như mục 3; có cảnh báo UI sau commit; không có pageerror |
| Probe nội dung biểu mẫu chưa gửi | Tái hiện mất ghi chú sau khi rời trang và quay lại; API giả lập, không tạo đơn thật |
| SQL Server chỉ đọc | 14 bảng nghiệp vụ, 32 khóa ngoại; năm nhóm kiểm tra nhất quán đều không phát hiện vi phạm |
| Đối chiếu JAR thử và mã đã biên dịch | 156 application class trùng hash; cấu hình cổng thử được truyền riêng |
| Kiểm tra hồi quy Chrome các nhóm giao diện | Đạt: 14 bộ kiểm tra, 376 kiểm tra giao diện; gồm công khai, tài khoản, đặt lịch và toàn bộ các nhóm quản trị/nhân viên/khách |

Năm nhóm kiểm tra dữ liệu: đơn COMPLETED thiếu payment COMPLETED; nhiều địa chỉ mặc định cùng tài khoản; nhiều báo giá current cùng đơn; cân tịnh không dương; nhiều payment COMPLETED cùng đơn. Mỗi nhóm đều trả số vi phạm bằng 0 trên dữ liệu hiện tại. Đây là các kiểm tra chọn lọc, không phải chứng minh mọi quy tắc dữ liệu đều đúng.

Các bộ Chrome có dữ liệu giả kiểm tra UI, quyền truy cập trang, lỗi, retry, ghi lặp, màn hình nhỏ và accessibility theo các kịch bản đã viết; không được coi mọi kiểm tra đó là tích hợp SQL thật. Bộ live 60 kiểm tra và probe giá dùng backend/SQL Server thật. Chưa quét lỗ hổng dependency backend bằng công cụ chuyên biệt, chưa kiểm thử tải, chưa kiểm thử xâm nhập hoặc triển khai hosting thực tế.

Chi tiết 14 bộ Chrome: công khai 21; tài khoản/đặt lịch 55; xác nhận/phân công 40; di chuyển 35; cân 20; báo giá nhân viên 23; khu khách hàng 27; thanh toán mô phỏng 25; danh mục/vật liệu 20; bảng giá 21; tài khoản quản trị 23; yêu cầu hủy/đổi lịch 23; khiếu nại 21; thống kê 22. Tất cả kết thúc với mã thành công. Các bộ đã có không chứa tình huống duyệt giá xen kẽ sau GET; probe bổ sung phát hiện lỗi này nên không thể lấy việc toàn bộ test cũ đạt làm kết luận hệ thống hết lỗi.

Log/kết quả: `.cache/audit-frontend-check.log`, `.cache/audit-format.log`, `.cache/audit-dependencies.json`, `.cache/audit-browser-summary.json`, `.cache/audit-live-workflow.log`, `.cache/live-auth/result.json`, `.cache/audit-price-race/result.json`, `.cache/audit-unsaved-form.json` trong frontend; `.local/audit-backend-test.log` trong backend. Các thư mục cache/local chỉ phục vụ kiểm chứng tại máy này. Thư mục hiện chưa là Git repository; việc rà soát dựa trên mã/cấu hình hiện có, không dựa trên diff hay commit.

<a id="doc-bao-cao-ra-soat-vcoi-2026-10-25-md--8-thứ-tự-công-việc-đề-xuất"></a>
##### 8. Thứ tự công việc đề xuất

| Thứ tự | Việc | Tiêu chí hoàn thành |
|---|---|---|
| 1 | Sửa cạnh tranh sửa/duyệt/từ chối giá nháp | Backend từ chối revision cũ bằng 409 trước khi ghi; UI yêu cầu xem lại; test hai phiên đạt |
| 2 | Hoàn thiện hồ sơ đơn cho admin và phân công lại | Admin đọc đủ cân/ảnh/giá/tiền/timeline/biên nhận; đổi đúng nhân viên ở ASSIGNED, chặn sau khởi hành/trùng lịch |
| 3 | Tải ảnh phiếu cân trên giao diện nhân viên | Upload đúng API/quyền/version/giới hạn ảnh; khách/admin xem được chứng cứ |
| 4 | Hồ sơ, đổi mật khẩu cho nhân viên và admin | Từng vai trò tự cập nhật đúng tài khoản; đổi mật khẩu thu hồi phiên; điều hướng đúng |
| 5 | Đóng gói schema SQL Server và bộ chạy demo | Tạo được DB sạch trên máy thử, seed hợp lệ, chạy đủ ba vai trò và sao lưu được ảnh |
| 6 | Chốt và hoàn thiện phạm vi nghiệp vụ/tài liệu | Vùng/giờ phục vụ, thông báo, vật liệu không đủ điều kiện và chính sách giá được triển khai hoặc ghi rõ giới hạn MVP; sơ đồ/Word khớp mã |
| 7 | Hoàn thiện thao tác biểu mẫu và danh sách | Không mất nội dung chưa gửi ngoài ý muốn; giữ trang danh sách khi quay lại; kiểm tra bàn phím và màn hình nhỏ |
| 8 | Nghiệm thu cuối | Chạy lại kiểm tra liên quan sau sửa; diễn tập một đơn hoàn tất, một đơn đổi/hủy, một báo giá bị từ chối và một khiếu nại |

Nên bắt đầu bằng việc 1 rồi việc 2. Các phần xuất báo cáo Excel/PDF, khôi phục mật khẩu, lọc lịch làm việc nâng cao, đánh giá dịch vụ và thông báo email/SMS có thể xếp sau khi chốt phạm vi nộp bài.

<!-- source-end:doc-bao-cao-ra-soat-vcoi-2026-10-25-md -->

<a id="doc-ecothugom-backend-docs-admin-catalog-verification-md"></a>
### Xác minh API admin danh mục/vật liệu – 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/docs/admin-catalog-verification.md`.

<!-- source-begin:doc-ecothugom-backend-docs-admin-catalog-verification-md -->
<a id="doc-ecothugom-backend-docs-admin-catalog-verification-md--xác-minh-api-admin-danh-mụcvật-liệu--23102026"></a>
#### Xác minh API admin danh mục/vật liệu – 23/10/2026

<a id="doc-ecothugom-backend-docs-admin-catalog-verification-md--phạm-vi-và-triển-khai"></a>
##### Phạm vi và triển khai

Đã bổ sung 10 endpoint: GET list/detail, POST thêm, PUT thay thông tin và PATCH /status cho material-categories và materials dưới /api/admin. Chỉ ADMIN, mọi lệnh ghi cần CSRF. POST mặc định isActive/accepted=true; PUT giữ cờ trạng thái; PATCH đổi riêng cờ. Các row và ID lịch sử không bị xóa. Không thêm dependency hoặc sửa schema production, chưa làm API quản trị bảng giá.

Mở rộng entity/repository JPA hiện có, truy vấn admin gồm dữ liệu ẩn với phân trang và filter; khóa dòng khi PUT/PATCH. Kiểm tra tên nhóm duy nhất và tổ hợp category/name/grade không phân biệt hoa thường; unique SQL là chốt cuối khi tạo đồng thời. Category name 100, material name 150, grade 50, unit KG và giới hạn mô tả theo metadata SQL Server. URL ảnh chỉ HTTP/HTTPS hợp lệ có host, không userinfo, không được backend tải về.

<a id="doc-ecothugom-backend-docs-admin-catalog-verification-md--kết-quả-thực-tế"></a>
##### Kết quả thực tế

- RED trước triển khai: 5 ca danh mục thất bại do 404; sau thêm danh mục, 33 test danh mục admin/công khai/bảng giá đạt. Thêm 7 ca vật liệu, thấy 7 thất bại do chưa có endpoint trước khi code.
- Cuối cùng `.\mvnw.cmd -B -ntp verify` đạt **152 test**, 0 thất bại/lỗi/bỏ qua; BUILD SUCCESS và đóng gói JAR. Có **13 ca tích hợp admin catalog** mới bên cạnh 139 ca cũ, chạy MockMvc/H2 qua session/CSRF thực. Fixture catalog nằm trong context test riêng, không tác động seed của các context khác.
- Bao phủ: Unicode/trim/null, create/update/status, danh mục ẩn/vật liệu ngừng, các filter và phân trang, role/CSRF, tên/tổ hợp trùng kể cả dữ liệu ẩn và khác case, thiếu tham chiếu, độ dài/unit/URL không hợp lệ, unknown fields, đặt lịch trước/sau ngừng thu mua, lịch sử cũ vẫn đọc được, snapshot báo giá cũ/tiền thanh toán giữ nguyên, thanh toán ACCEPTED sau khi ẩn, hai create trùng đồng thời, PUT info đồng thời PATCH trạng thái và rollback khi constraint của database từ chối ghi.
- Mutation: tạm làm changeStatus của Material luôn nhận true; ca `AdminCatalogApiTests#createsUpdatesStopsAndResumesMaterialsWithPublicBookingRules` bắt được việc không ngừng thu mua (expected false, actual true). Khôi phục nguồn nguyên byte và đối chiếu SHA-256 trước verify cuối.
- JAR cổng 18080 với SQL Server `EcoThuGomDB`: **123 kiểm tra HTTP đạt**, exit 0. Tạo danh mục/vật liệu giả định riêng qua API, chỉ chèn quy tắc giá APPROVED cho vật liệu giả định vì API quản trị giá chưa có. Không sửa vật liệu/danh mục/giá có sẵn của người dùng.
- SQL Server đã xác minh Unicode, duplicate case-insensitive, admin/CSRF, tạo/sửa/ẩn/hiện/ngừng/nhận lại, PUT giữ trạng thái và xóa optional fields, GET admin vẫn thấy dữ liệu ẩn, public catalog/price list ẩn đúng, đặt lịch mới bị chặn sau ngừng. Biến thể trùng khi PUT trả 409, dữ liệu ban đầu không đổi. Không có DELETE route (405).
- Chạy cả luồng ba đơn giả định tới hai đơn COMPLETED bằng hai kiểu thanh toán mô phỏng; sau đó sửa danh mục/vật liệu và đối chiếu snapshot vật liệu/phân hạng/số tiền trong báo giá, payment và trạng thái đơn vẫn đúng. Đối chiếu SQL giữ 23 audit log, hai payment COMPLETED, số tiền khớp quote_items tính trong SQL và FK quote/order/amount.
- Đã xóa riêng dữ liệu giả định theo marker/phone/role, kể cả catalog và price fixture; có guard từ chối dọn nếu vật liệu/danh mục/giá thử được dữ liệu ngoài phiên thử tham chiếu. JVM thử đã dừng, không tác động cổng 8080. Mật khẩu thử ngẫu nhiên chỉ trong RAM.
- OpenAPI JSON parse được, **10 paths/14 operations** (10 catalog + 4 auth), operationId không trùng, **96 `$ref` nội bộ** giải được. Đây không phải lint bằng Postman CLI; CLI/MCP Postman không khả dụng trong phiên, không đẩy workspace.

<a id="doc-ecothugom-backend-docs-admin-catalog-verification-md--tệp-chính"></a>
##### Tệp chính

- `catalog/AdminCatalogController.java`, `AdminCatalogService.java`, `AdminCatalogRequests.java`, `AdminCatalogResponse.java`, `AdminCatalogAdvice.java`.
- `catalog/MaterialCategory.java`, `Material.java`, hai repository: bổ sung ghi dữ liệu, truy vấn admin và khóa dòng, giữ truy vấn công khai cũ.
- `orders/AdminCatalogApiTests.java`: integration test kết hợp catalog và luồng đơn/báo giá/thanh toán.
- `docs/admin-catalog.md`, `.http`, `-openapi.json`, README và `.postman/resources.yaml`.

Log nội bộ: `.local/admin-catalog-final-verify.log`, `.local/admin-catalog-live.log`, `.local/admin-catalog-mutation.log`. Khởi động lại backend bằng `.\scripts\start-local.ps1` trước khi gọi API mới. Cần SELECT/INSERT/UPDATE hai bảng catalog; không cần chạy lại SQL.

Lưu ý hợp đồng: tên/phân hạng trong chi tiết ước tính đơn cũ hiện lấy từ catalog nên có thể hiển thị tên mới sau PUT; các snapshot báo giá và tiền đã chốt giữ nguyên. Các bảng danh mục chưa có version, PUT được xử lý lần lượt theo khóa dòng. Chi tiết ở admin-catalog.md.

<!-- source-end:doc-ecothugom-backend-docs-admin-catalog-verification-md -->

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md"></a>
### Bổ sung xác minh — 25/10/2026

Nguồn trước khi gộp: `ecothugom-backend/docs/admin-prices-verification.md`.

<!-- source-begin:doc-ecothugom-backend-docs-admin-prices-verification-md -->
<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--bổ-sung-xác-minh--25102026"></a>
#### Bổ sung xác minh — 25/10/2026

Khắc phục cạnh tranh nhiều phiên quản trị được yêu cầu sau báo cáo ban đầu ngày 23/10. Các kết luận cũ bên dưới về việc chưa có revision mô tả trạng thái trước lần cập nhật này và đã được thay thế.

- Mỗi response quản trị có `draftRevision` SHA-256 từ snapshot đã lưu; PUT, approve và reject yêu cầu `expectedRevision`. Backend so sánh mã khi đã khóa dòng trong transaction. Mã cũ nhận 409, không ghi thay đổi; không thêm cột hoặc migration.
- 18/18 `AdminPriceApiTests` đạt trên H2; gồm hai phiên đăng nhập riêng và các thao tác đồng thời/stale edit/approve/reject.
- Chrome + Spring Boot + SQL Server thật: 31/31 kiểm tra đạt trên hai browser context độc lập. Với từng thao tác edit/approve/reject, phiên A giữ yêu cầu cũ đang chờ, phiên B cập nhật bản nháp, rồi backend trả 409 cho A. SQL xác nhận giá của B vẫn là DRAFT và không bị duyệt/từ chối. Kiểm tra SQL invariants đạt; dữ liệu tổng hợp được dọn sau lượt chạy.
- Frontend: kiểm thử riêng `prices.test.js` đạt 29/29; `npm run build` thành công; toàn bộ frontend suite đạt 440/440 test (38 file). Lượt chạy song song build/test trước đó gây timeout 3 test ngoài phạm vi; chạy riêng 17/17 test của hai file đó và chạy lại toàn suite đều đạt.
- Kịch bản tái sử dụng: `Frontend VCoi/scripts/verify-live-prices.ps1` và `.mjs`. Server thử dùng cổng 18080/5174; server chính 8080/5173 không bị khởi động lại trong lúc chạy kiểm thử.
- Sau kiểm thử, backend chính đã khởi động lại bằng bản sửa tại `target/admin-price-fix/ecothugom-backend-admin-price-fix.jar`, profile `windows`, SQL Server cổng 1435. Log xác nhận khởi động thành công; `GET /api/prices/current` tại 8080 trả 200 và 9 vật liệu. Khởi chạy từ phiên bị giới hạn không có thông tin xác thực Windows đã thất bại; chạy lại bằng phiên có quyền truy cập SQL Server đã thành công.
- Đã đóng gói lại JAR mặc định bằng `.\mvnw.cmd -B -ntp -o -DskipTests package`: BUILD SUCCESS. `target/ecothugom-backend-0.0.1-SNAPSHOT.jar` có thể dùng cho những lần chạy tiếp theo; lượt đóng gói cuối bỏ qua test vì bộ kiểm thử trên đã đạt.

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--báo-cáo-ban-đầu--23102026"></a>
##### Báo cáo ban đầu — 23/10/2026

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--xác-minh-api-admin-bảng-giá--23102026"></a>
#### Xác minh API ADMIN bảng giá — 23/10/2026

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--kết-quả"></a>
##### Kết quả

- `.\mvnw.cmd -B -ntp verify`: **169 test đạt**, 0 thất bại/lỗi/bỏ qua; BUILD SUCCESS và đóng gói JAR. Thêm 17 integration test `AdminPriceApiTests`, giữ 152 test cũ. MockMvc/H2 dùng session, CSRF và Clock UTC thực của cấu hình test, JVM Asia/Ho_Chi_Minh.
- Test RED trước triển khai thấy POST tạo nháp trả 404 thay vì 201. Sau triển khai 31 test quản trị giá/bảng giá hiện hành đạt; thêm một test biên chuyển UTC rồi full verify 169 test.
- Mutation: tạm bỏ điều kiện chỉ DRAFT được ghi, chạy test `approvedVersionsCannotBeEditedOrReReviewedAndRemainOpen`; test thất bại vì trả 200 thay cho 409. Mã nguồn được khôi phục nguyên byte và xác nhận SHA256 trước khi chạy verify cuối.
- JAR mới chạy trên cổng riêng 18080, profile windows, SQL Server `localhost:1433`, database EcoThuGomDB. **169 kiểm tra luồng API/SQL đạt**, bao gồm hồi quy danh mục, đặt lịch, điều phối, cân, báo giá và thanh toán mô phỏng. Mọi bản giá thử được tạo/sửa/duyệt bằng API, không INSERT giá thủ công.
- SQL Server xác nhận: hai lệnh tạo nháp đồng thời đều 201, tạo các phiên bản liên tiếp khác nhau; duyệt/từ chối đồng thời đúng một 200 và một 409. Lịch sử có đủ 7 phiên bản của vật liệu thử, sắp xếp/phân trang và bộ lọc đúng.
- Giá nháp/từ chối chưa xuất hiện công khai; duyệt giá 3500 rồi 4200 thay giá hiện hành đúng; bản cao hơn có hiệu lực tương lai/hết hạn không che giá 4200. Bản APPROVED cũ và validTo của nó không bị sửa tự động.
- Sau thay giá và tên vật liệu, báo giá và payment cũ giữ số tiền, material/grade snapshot; SELECT SQL xác nhận collection_items và quote_items vẫn tham chiếu quy tắc giá cũ 3500. Hai đơn COMPLETED giữ 23 audit log tổng cộng trong luồng thử, payment khớp quote và cột tính tiền SQL Server.
- Kiểm tra lỗi: vai trò, CSRF, tài khoản khóa, số tiền không hợp lệ, metadata ngoài hợp đồng, thời gian/offset, giới hạn phân trang, tài nguyên thiếu, ràng buộc và rollback. Không có DELETE; bản APPROVED/REJECTED bất biến.
- OpenAPI JSON parse được, mọi `$ref` nội bộ giải được, **11 operationId duy nhất** (7 nghiệp vụ giá + 4 auth). Chưa chạy validator OpenAPI/Postman CLI vì công cụ đó không khả dụng trong phiên; đây không phải kết quả chạy collection trên Postman. Chưa push workspace.
- JVM thử đã dừng; dữ liệu thử được dọn theo marker/phone/role chính xác, có guard chống xóa dữ liệu ngoài phiên thử. Không sửa schema, dependency hoặc dữ liệu nghiệp vụ sẵn có; mật khẩu thử ngẫu nhiên chỉ nằm trong RAM.

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--tệp-và-triển-khai"></a>
##### Tệp và triển khai

`catalog/AdminPriceController.java`, `AdminPriceService.java`, `AdminPriceRequests.java`, `AdminPriceResponse.java`, `AdminPriceAdvice.java`; mở rộng entity/repository PriceRule có sẵn. Giữ nguyên truy vấn canonical `findCurrent` và CurrentPriceService dùng chung cho public/booking/quote.

Tài liệu gọi API: `admin-prices.md`, `admin-prices.http`, `admin-prices-openapi.json`; spec được đăng ký trong `.postman/resources.yaml`. Log kiểm tra cục bộ: `.local/admin-prices-verify.log`, `admin-prices-mutation.log`, `admin-prices-live-check.log`; script thử SQL Server: `.local/admin-prices-sql-smoke.ps1`.

<a id="doc-ecothugom-backend-docs-admin-prices-verification-md--giới-hạn-đã-ghi-trong-hợp-đồng"></a>
##### Giới hạn đã ghi trong hợp đồng

versionNumber tăng khi tạo bản giá mới, không phải revision mỗi lần sửa DRAFT. Sửa nháp tuần tự áp dụng giá trị ghi sau cùng; admin tải lại chi tiết trước khi duyệt. Lịch sử gồm bản giá và trạng thái cuối, chưa có log từng lần sửa hoặc lý do/người từ chối vì schema hiện tại không có các cột đó. Giá cũ còn hiệu lực có thể được chọn lại khi bản cao hơn hết hạn, đúng quy tắc giá hiện hành có sẵn.

<!-- source-end:doc-ecothugom-backend-docs-admin-prices-verification-md -->

<a id="doc-ecothugom-backend-docs-backend-completion-verification-md"></a>
### Báo cáo rà soát và hoàn thiện backend — 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/docs/backend-completion-verification.md`.

<!-- source-begin:doc-ecothugom-backend-docs-backend-completion-verification-md -->
<a id="doc-ecothugom-backend-docs-backend-completion-verification-md--báo-cáo-rà-soát-và-hoàn-thiện-backend--23102026"></a>
#### Báo cáo rà soát và hoàn thiện backend — 23/10/2026

<a id="doc-ecothugom-backend-docs-backend-completion-verification-md--đối-chiếu-bảng-yêu-cầu"></a>
##### Đối chiếu bảng yêu cầu

| Nhóm API | Trạng thái | Kết quả |
|---|---|---|
| Quản lý danh mục, vật liệu | Hoàn tất | Thêm/sửa/ẩn nhóm, thêm/sửa/ngừng thu mua vật liệu, GET admin gồm cả dữ liệu ẩn |
| Quản lý bảng giá | Hoàn tất | Nháp, sửa nháp, duyệt/từ chối, lịch sử phiên bản; không sửa giá đã xử lý |
| Hồ sơ và địa chỉ | Hoàn tất | Sửa tên/email riêng, đổi mật khẩu thu hồi phiên, CRUD/mặc định địa chỉ, booking bằng addressId giữ snapshot |
| Hủy và đổi lịch | Hoàn tất | Mọi hủy gửi PENDING cho ADMIN duyệt; đổi lịch trước khởi hành, yêu cầu sau khởi hành, admin xử lý/phân công lại |
| Lịch sử, biên nhận | Hoàn tất | Timeline phân trang theo vai trò, biên nhận JSON từ payment/quote/cân đã chốt, đọc cân cho khách/admin |
| Ảnh minh chứng | Hoàn tất | Multipart JPEG/PNG riêng tư, lưu file tại backend, kiểm tra nội dung/dung lượng/pixel/quyền và rollback |
| Khiếu nại | Hoàn tất | Mở, tiếp nhận, kết luận/từ chối, lưu trạng thái trước tranh chấp và phục hồi; giữ nguyên tiền |
| Thống kê quản trị | Hoàn tất | Cohort đơn/tỉ lệ, tiền và khối lượng đã thanh toán, theo kỳ lịch Việt Nam/vật liệu/collector |

Quy tắc mới nhất đã áp dụng theo trả lời của người dùng: ảnh lưu tại backend; **khách không được hủy trực tiếp ở bất kỳ bước nào**, mọi yêu cầu hủy cần admin duyệt. POST /cancel trả 201 và trạng thái yêu cầu PENDING, không trả đơn CANCELLED ngay. Đơn hoàn tất chỉ xử lý khiếu nại. Đây là phạm vi API của đồ án một đại lý; React và các đề xuất ngoài bảng chưa triển khai trong lượt này.

<a id="doc-ecothugom-backend-docs-backend-completion-verification-md--kiểm-chứng-thực-tế"></a>
##### Kiểm chứng thực tế

- `.\mvnw.cmd -B -ntp verify`: **211 test đạt**, 0 failure/error/skipped; BUILD SUCCESS và JAR được đóng gói. Có 42 test mới cho bảy lớp ProfileApiTests, AddressApiTests, OrderChangeApiTests, OrderHistoryApiTests, EvidenceApiTests, DisputeApiTests, AdminReportApiTests bên cạnh 169 test đã có sau phần bảng giá. Chạy qua MockMvc, cookie/session, CSRF và H2 riêng, JVM Asia/Ho_Chi_Minh.
- Test trước triển khai phát hiện thiếu route hồ sơ, địa chỉ, hủy/đổi lịch, timeline/receipt, khiếu nại và báo cáo. Khi người dùng đổi chính sách hủy, ba test thất bại theo hành vi cũ; đổi POST /cancel thành yêu cầu chờ admin rồi toàn bộ test đạt. Không bỏ/disable test để làm xanh.
- Test ảnh ban đầu cần điều chỉnh helper multipart của Spring 7; không tính lỗi compile này là một ca RED nghiệp vụ. Sau sửa helper, test ảnh và hồi quy cân/biên nhận đạt. Test địa chỉ xác định H2 trả cả address_id và created_at trong generated keys; chỉ định rõ cột identity, rồi xác minh trên cả H2 và JDBC SQL Server.
- Kiểm tra an toàn: vai trò/ownership/CSRF/khóa tài khoản, thu hồi mọi phiên cũ sau đổi mật khẩu, unknown fields, giới hạn dữ liệu, version/CAS, pending request duy nhất, tranh chấp đồng thời, chặn lịch trùng, rollback audit/data, snapshot cân/báo giá/payment. Thống kê kiểm tra đơn nhiều item, cân điều chỉnh, khoản đã trả trong DISPUTED và biên ngày Việt Nam dạng [from,to).
- Mutation bảng giá: bỏ guard DRAFT-only làm test phát hiện 200 thay cho 409. Mutation ảnh: bỏ kiểm tra quyền sở hữu làm test phát hiện 200 thay cho 404. Cả hai file được khôi phục nguyên byte và xác nhận SHA256; full verify chạy sau lần khôi phục cuối.
- JAR mới chạy riêng tại `127.0.0.1:18080`, profile windows, SQL Server `localhost:1433`, EcoThuGomDB: **250 kiểm tra HTTP/SQL đạt**. Bao gồm 169 kiểm tra hồi quy danh mục/giá/luồng thu gom đã có, và các kiểm tra mở rộng. Một lượt thử đầu bị dừng vì fixture nhân viên dự phòng vẫn bị khóa bởi ca hồi quy trước; đã kích hoạt/đăng nhập lại đúng tài khoản giả định đó rồi chạy thành công. Không sửa quyền tài khoản thật hoặc thay API để bỏ qua lỗi quyền.
- Luồng thật: đặt lịch bằng địa chỉ lưu sẵn → ảnh item → sửa/xóa địa chỉ vẫn giữ snapshot → đổi lịch → xác nhận/phân công → phân công lại (nhân viên cũ mất quyền ảnh) → di chuyển → admin duyệt đổi lịch và điều phối lại → khách xin hủy → admin duyệt mới CANCELLED.
- Thêm đơn cân: cân thực tế → upload ảnh cân → khách xem ảnh → mở khiếu nại kèm đúng ảnh → admin từ chối và phục hồi ARRIVED → khách xin hủy → admin duyệt. Ảnh giả 400, multipart quá 5 MiB thực qua embedded server 413, URL riêng tư không đăng nhập 401.
- Đơn đã thanh toán: mở DISPUTED → receipt vẫn giữ tiền chốt → admin tiếp nhận/kết luận → COMPLETED; không được ghi đè kết luận hoặc xin hủy đơn đã trả tiền. Đối chiếu SQL giữ payment và completedAt, có đúng 5 đơn, 5 yêu cầu thay đổi và 2 kết luận khiếu nại trong bộ dữ liệu thử.
- SQL Server xác nhận computed columns, composite FK, unique/filtered indexes, Unicode, timestamp UTC, giá/quote/payment snapshot và audit. Báo cáo theo vật liệu giữ nhãn snapshot sau đổi tên, chỉ cộng quote đã thanh toán; báo cáo collector khớp tổng hai payment thử, không cộng quote bị từ chối hoặc cân sửa.
- OpenAPI tổng hợp: **49 path, 60 operationId duy nhất, 510 tham chiếu nội bộ giải được**; kiểm tra required fields thuộc properties. JSON parse và generator đạt. Không có Postman CLI/MCP trong phiên nên chưa chạy collection hoặc validator OpenAPI bên ngoài, chưa push lên workspace/cloud. Không trình bày kiểm tra nội bộ này thành một kết quả lint chính thức.
- Sau test: đã dừng JVM cổng 18080, xóa riêng dữ liệu theo marker/phone/role, có guard chống xóa tham chiếu của người khác; xóa hai ảnh riêng của lượt thử và thư mục test. Mật khẩu thử ngẫu nhiên chỉ nằm trong RAM.

<a id="doc-ecothugom-backend-docs-backend-completion-verification-md--tệp-bàn-giao-và-vận-hành"></a>
##### Tệp bàn giao và vận hành

- Hướng dẫn: `docs/backend-completion.md`, `docs/profile-addresses.md`, `docs/backend-completion.http`.
- Import Postman: `docs/backend-completion-openapi.json`; catalog/giá vẫn có spec chuyên biệt. Generator có thể chạy lại bằng Python tiêu chuẩn: `scripts/generate-completion-openapi.py`.
- Nguồn: auth bổ sung hồ sơ/credential stamp; orders bổ sung địa chỉ, khung giờ/lịch nhân viên dùng chung, request thay đổi, đọc timeline/receipt, ảnh và khiếu nại; package reports cho thống kê.
- Log cục bộ: `.local/backend-completion-verify.log`, `.local/backend-completion-live-check.log`, `.local/evidence-privacy-mutation.log`; kịch bản thử `.local/backend-completion-sql-smoke.ps1`.
- Không đổi schema production, dependency, CORS hoặc kết nối dịch vụ ngoài. Fixture H2 được mở rộng khớp các bảng/cột SQL Server vốn có. Người dùng không cần chạy lại script tạo DB. Các quyền SQL và cấu hình thư mục ảnh được liệt kê trong hướng dẫn.

Giới hạn phạm vi đã công bố: mỗi item/lần cân một ảnh; biên nhận là JSON; hồ sơ không đổi phone/role/status; báo cáo dùng hai mốc created_at và paid_at theo định nghĩa trong hướng dẫn; tiền mô phỏng không gọi ngân hàng. Các phần thông báo/đánh giá/vùng phục vụ và frontend nằm ngoài bảng tám nhóm của lượt này.

<!-- source-end:doc-ecothugom-backend-docs-backend-completion-verification-md -->

<a id="doc-ecothugom-backend-docs-simulated-payments-verification-md"></a>
### Xác minh thanh toán mô phỏng – 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/docs/simulated-payments-verification.md`.

<!-- source-begin:doc-ecothugom-backend-docs-simulated-payments-verification-md -->
<a id="doc-ecothugom-backend-docs-simulated-payments-verification-md--xác-minh-thanh-toán-mô-phỏng--23102026"></a>
#### Xác minh thanh toán mô phỏng – 23/10/2026

Phạm vi: POST ghi thanh toán CASH_SIMULATED/TRANSFER_SIMULATED cho nhân viên được giao đơn và GET lịch sử thanh toán theo vai trò. Số tiền lấy từ báo giá ACCEPTED hiện hành; đơn chuyển AWAITING_PAYMENT -> COMPLETED, tăng version, đặt completed_at và ghi audit cùng transaction. Không sửa schema SQL Server production, không thêm dependency, không gọi cổng thanh toán.

<a id="doc-ecothugom-backend-docs-simulated-payments-verification-md--kết-quả"></a>
##### Kết quả

- `.\mvnw.cmd -B -ntp verify`: **139 test**, 0 thất bại/lỗi/bỏ qua, BUILD SUCCESS và JAR được đóng gói. Có **22 ca thanh toán** mới với MockMvc/H2, đi qua session và CSRF thực; giữ 117 ca trước đó.
- Các ca mới kiểm tra hai phương thức, tiền theo báo giá đã chốt dù giá danh mục thay đổi, paidAt/completedAt UTC trùng nhau, actor/audit/version, quyền đọc/ghi, phiên bị khóa, body sai, GUID, trường server quản lý, mọi trạng thái không phù hợp, quote chưa ACCEPTED, gửi lại cùng key/đổi key, PENDING/FAILED cũ, lịch sử giới hạn 100 và sắp xếp, hai request đồng thời và rollback khi payment hoặc audit lỗi. Một quote đã ACCEPTED vẫn thanh toán được sau hạn phản hồi cũ.
- Gửi lại cùng GUID sang một đơn khác trả 409 và rollback trạng thái/version/completed_at của đơn thứ hai. Không replay response cũ; khách kiểm tra bằng GET payments theo requestKey.
- Mutation chất lượng test: tạm bỏ kiểm tra status ACCEPTED; ca `SimulatedPaymentApiTests#rejectsStaleVersionWrongQuoteAndQuoteThatIsNotAccepted` phát hiện thanh toán SENT sai (mong 409, nhận 201). Đã khôi phục nguồn nguyên byte và đối chiếu SHA-256 trước lần verify cuối.
- JAR chạy riêng cổng 18080 với SQL Server `EcoThuGomDB`: **91 kiểm tra HTTP đạt**, exit 0. Gồm luồng từ đăng ký/đặt lịch qua điều phối/di chuyển/cân/duyệt đến hai đơn COMPLETED bằng hai phương thức mô phỏng. Hai POST cạnh tranh với hai GUID khác nhau cho một 201 và một 409. Trùng GUID ở đơn khác trả 409, đơn vẫn version 7, chưa có payment; đổi sang GUID mới hoàn tất bình thường.
- Đối chiếu trực tiếp SQL đạt: ba đơn tạm gồm hai COMPLETED và một CONFIRMED; đơn thứ nhất version 11, đơn thứ hai version 8; đúng hai payment COMPLETED, paid_at bằng order.completed_at và recorded_by đúng collector; có 23 log cho toàn bộ luồng. Tiền thanh toán lấy đúng báo giá và FK composite SQL Server giữ quan hệ quote/order/amount.
- Dữ liệu tạm (tài khoản, đơn, item, cân, báo giá, thanh toán, audit) đã được xóa riêng theo marker/phone/role. Server thử đã dừng, không tác động cổng 8080. Mật khẩu tổng hợp chỉ dùng trong RAM, không dùng mật khẩu tài khoản của người dùng.
- OpenAPI parse JSON và giải được **45 `$ref` nội bộ**, 8 paths, operationId không trùng. Chưa chạy lint/collection bằng Postman CLI vì CLI/MCP Postman không khả dụng trong phiên. Không đẩy tài liệu lên workspace.

<a id="doc-ecothugom-backend-docs-simulated-payments-verification-md--tệp-chính"></a>
##### Tệp chính

- `orders/SimulatedPaymentController.java`, `SimulatedPaymentService.java`, `SimulatedPaymentRequest.java`, `PaymentResponse.java`: hợp đồng và triển khai endpoint.
- `orders/OrderValidationAdvice.java`: thêm controller vào phạm vi lỗi 400/500 chung, không lộ SQL.
- `src/test/.../SimulatedPaymentApiTests.java`, `WorkflowApiSupport.java`, `src/test/resources/catalog-schema.sql`: test và ràng buộc H2 mô phỏng unique requestKey, một payment COMPLETED và FK quote/order/amount. Schema H2 không phải migration production.
- `docs/simulated-payments.md`, `.http`, `-openapi.json`, README và `.postman/resources.yaml`: tài liệu sử dụng và spec import cục bộ.

Log nội bộ: `.local/payment-final-verify.log`, `.local/payment-live.log`, `.local/payment-accepted-mutation.log`. Khởi động lại backend cổng 8080 bằng `.\scripts\start-local.ps1` trước khi thử API mới; không cần chạy lại SQL.

<!-- source-end:doc-ecothugom-backend-docs-simulated-payments-verification-md -->

<a id="doc-ecothugom-backend-docs-workflow-verification-md"></a>
### Kết quả kiểm tra ba bước thu gom – 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/docs/workflow-verification.md`.

<!-- source-begin:doc-ecothugom-backend-docs-workflow-verification-md -->
<a id="doc-ecothugom-backend-docs-workflow-verification-md--kết-quả-kiểm-tra-ba-bước-thu-gom--23102026"></a>
#### Kết quả kiểm tra ba bước thu gom – 23/10/2026

Phạm vi: di chuyển ASSIGNED -> EN_ROUTE -> ARRIVED, ghi cân/điều chỉnh và gửi báo giá, khách đồng ý/từ chối. Không tạo thanh toán và không sửa schema SQL Server production.

<a id="doc-ecothugom-backend-docs-workflow-verification-md--kết-quả-thực-tế"></a>
##### Kết quả thực tế

- Trước phần cân: 48 kiểm thử đặt lịch/điều phối/di chuyển đạt; JAR chạy SQL Server thật đạt 40 kiểm tra HTTP đến ARRIVED.
- Bản cuối: `.\mvnw.cmd -B -ntp verify` đạt **117 kiểm thử**, 0 thất bại/lỗi/bỏ qua; JAR đóng gói thành công. Gồm 82 kiểm thử trước đó và 35 kiểm thử bổ sung. H2 dùng profile test riêng, timezone JVM Asia/Ho_Chi_Minh và đồng hồ nghiệp vụ UTC cố định.
- SQL Server thật `EcoThuGomDB`, JAR cổng 18080: **65 kiểm tra HTTP đạt**, exit 0. Đi qua đăng ký/đăng nhập, đặt lịch, xác nhận, phân công, di chuyển, cân đầu, cân điều chỉnh, gửi báo giá, khách từ chối, gửi lại và đồng ý. Kiểm tra role, CSRF, khóa tài khoản, version cũ, trùng lịch, không sửa cân khi chờ duyệt, không chấp nhận báo giá cũ và không gửi lại báo giá đã ACCEPTED.
- Đối chiếu SQL đạt: đơn AWAITING_PAYMENT/version 10, đúng 16 log cho ba đơn thử, actor tương ứng; một báo giá ACCEPTED hiện hành, khách phản hồi đúng chủ đơn, tổng báo giá bằng SUM(line_total) tính trong SQL. Không có bản ghi payments cho đơn thử.
- Tài khoản, đơn, item, log, cân và báo giá tổng hợp phục vụ thử nghiệm đã được xóa riêng theo marker/phone/role. Server thử đã dừng; không tác động server người dùng cổng 8080. Mật khẩu thử ngẫu nhiên chỉ trong RAM, không dùng tài khoản của người dùng.
- Kiểm thử H2 có ca làm tròn từng dòng rồi cộng tổng, đủ tất cả vật liệu, thiếu giá, tràn tiền; hết hạn đúng ranh giới và trước 1 ms; correction phải nối phiếu mới nhất và có lý do; concurrency xác nhận/phân công/di chuyển/cân/gửi báo giá/accept so với reject; rollback khi audit lỗi. Cân so với gửi báo giá cùng version chỉ một thao tác thắng.
- Mutation kiểm tra chất lượng test: đổi điều kiện hết hạn để chấp nhận ngay lúc hết hạn; test `QuoteReviewApiTests#expiryBoundaryPreventsAcceptanceAndAllowsReplacementWithoutLosingHistory` bắt được lỗi (mong 409, nhận 200). Khôi phục nguồn nguyên byte và kiểm tra SHA-256 trước lần verify cuối.
- `collection-workflow-openapi.json` parse JSON được và giải được mọi `$ref` nội bộ; schema Order/OrderItem/Problem sao chép nguyên từ contract đặt lịch thông qua contract điều phối. Đây không phải kết quả lint bằng Postman CLI: CLI/MCP Postman không khả dụng trong phiên; không đẩy tài liệu lên workspace.
- Báo cáo Word 4 trang đã được tạo và kiểm tra ảnh của cả 4 trang. `render_docx.py` không chạy được vì thiếu LibreOffice; dùng ảnh từng trang do Word COM xuất qua Page.EnhMetaFileBits. Không dùng bộ xuất PDF bị kẹt. Các ảnh QA giữ ở `.local/`, chỉ giao DOCX.

<a id="doc-ecothugom-backend-docs-workflow-verification-md--tệp-chính"></a>
##### Tệp chính

- `orders/CollectorProgressController`, `CollectorProgressService`: hai lệnh di chuyển.
- `orders/WeighingController`, `WeighingService`, `WeighingRequest`: lịch sử và lô cân/điều chỉnh.
- `orders/QuotationController`, `QuotationService`, `QuoteReviewService`, `QuoteReader`, DTO/request: gửi, xem và phản hồi báo giá.
- `orders/OrderWorkflow`: phạm vi truy cập và CAS/version/audit dùng trong các transaction mới.
- `src/test/.../CollectorProgressApiTests`, `WeighingApiTests`, `QuotationApiTests`, `QuoteReviewApiTests`: ca thử bổ sung. `catalog-schema.sql` chỉ mở rộng schema H2 để mô phỏng các ràng buộc sẵn có của SQL Server; không phải migration production.
- `docs/collection-workflow.md`, `.http`, `-openapi.json`: hợp đồng, request và cách dùng Postman; `.postman/resources.yaml` thêm spec cục bộ.

Log nội bộ: `.local/workflow-final-verify.log`, `.local/workflow-final-live.log`, `.local/workflow-expiry-mutation.log`. Backend cổng 8080 cần khởi động lại bằng `.\scripts\start-local.ps1` để nạp mã mới.

<!-- source-end:doc-ecothugom-backend-docs-workflow-verification-md -->

<a id="doc-frontend-vcoi-docs-admin-dispatch-verification-md"></a>
### Kết quả quản trị và tách bố cục chức năng

Nguồn trước khi gộp: `Frontend VCoi/docs/admin-dispatch-verification.md`.

<!-- source-begin:doc-frontend-vcoi-docs-admin-dispatch-verification-md -->
<a id="doc-frontend-vcoi-docs-admin-dispatch-verification-md--kết-quả-quản-trị-và-tách-bố-cục-chức-năng"></a>
#### Kết quả quản trị và tách bố cục chức năng

<a id="doc-frontend-vcoi-docs-admin-dispatch-verification-md--đã-hoàn-tất"></a>
##### Đã hoàn tất

- ADMIN xác nhận PENDING → CONFIRMED, chọn nhân viên ACTIVE và phân công CONFIRMED → ASSIGNED qua API hiện có. Lý do tùy chọn tối đa 500 ký tự; session cookie và CSRF mới trước mỗi POST.
- Chỉ hiện thao tác đúng trạng thái, lấy version mới từ phản hồi server. Chống gửi liên tiếp, không tự retry POST, tải lại đơn và nhân viên sau 409/404 hoặc kết quả không chắc chắn. Không đưa lỗi nội bộ ra giao diện.
- `/quan-tri`: topbar/sidebar theo phong cách PCMaker, bảng đơn, trạng thái, phân trang và bốn số lượng thật từ `totalElements` của backend. Lọc và trang nằm trên URL, thay bộ lọc về trang đầu. Cache danh sách và số lượng hết hiệu lực sau thao tác thành công.
- `PublicLayout` dành cho giới thiệu/bảng giá. `ServiceLayout` dành cho đăng nhập/đăng ký, khách và nhân viên; `AdminLayout` dành cho admin. Mỗi khu chức năng có đường về website, không dùng menu/footer giới thiệu; giữ nguyên guard vai trò.
- Chỉ sửa dự án VCoi. Đối chiếu SHA256 của 51 tệp mã nguồn đã tham khảo trong `D:\WebPCMaker\frontend\src`: không đổi. Không build/cài dependency/chỉnh sửa dự án tham khảo.

<a id="doc-frontend-vcoi-docs-admin-dispatch-verification-md--kiểm-chứng-đã-chạy"></a>
##### Kiểm chứng đã chạy

| Kiểm tra                               | Kết quả và phạm vi                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                        | Lint đạt, 76/76 unit/component test trên 11 tệp đạt, build đạt                                                                                                                                     |
| `npm run test:dispatch`                | 40 kiểm tra Chrome đạt: confirm/assign, nhiều trang nhân viên, cookie/CSRF, payload/version, một POST, 409/404/403/401, đọc lại sau lỗi 500 đã ghi, rỗng/lỗi/retry, bộ lọc/phân trang và giao diện |
| `npm run test:flows`                   | 55 kiểm tra đạt: đăng ký, đăng nhập, đặt lịch, phiên/role/logout, không lưu bí mật phía client, 6 trang chức năng × 4 chiều rộng × sáng/tối; xác nhận không còn header/footer giới thiệu           |
| `npm run test:browser`                 | 21 kiểm tra đạt: trang chủ/bảng giá, menu/bàn phím, responsive, dữ liệu SQL qua proxy và lỗi/rỗng/retry                                                                                            |
| `scripts/verify-live-auth-booking.ps1` | 19 kiểm tra trình duyệt với Spring Boot + SQL Server thật đạt; admin xác nhận và phân công bằng UI, nhân viên thấy đơn được giao                                                                   |
| Invariant SQL                          | Đơn thử ASSIGNED, version 2, đúng collector, 1 item, 3 status logs, đúng admin và ghi chú xác nhận/phân công                                                                                       |
| Dọn dữ liệu                            | Xóa đúng tài khoản/đơn thử riêng; số tài khoản `VCOI-FRONTEND-LIVE-*` còn lại: 0; server thử 5174/18080 đã dừng, server chính được giữ                                                             |
| Mutation                               | Đảo điều kiện lọc COLLECTOR trong bản sao tách biệt: test phát hiện lỗi. SHA256 mã gốc không đổi; đã xóa đúng bản sao thử                                                                          |

Ảnh và kết quả máy đọc nằm trong `.cache/admin-dispatch/`, `.cache/auth-booking/`, `.cache/verification/`, `.cache/live-auth/` (không đưa vào mã nguồn). Kiểm tra axe tại 320 và 1440 px, cả sáng/tối, không còn violation trong các ca đã chạy. Nhãn link “Xem và xử lý” đã được chỉnh để khớp tên truy cập. Kiểm tra thêm bố cục điện thoại sau khi bỏ đường viền menu cũ ở nút đăng xuất.

Lượt kiểm tra mô phỏng dùng HTTP fixture được suy ra từ OpenAPI/backend; không chứng minh backend. Lượt live tách biệt dùng Spring Boot cổng 18080 và Vite 5174 với SQL Server EcoThuGomDB hiện có, rồi dọn dữ liệu. Không có Postman CLI khả dụng; không tạo hoặc đẩy workspace Postman dùng chung.

<a id="doc-frontend-vcoi-docs-admin-dispatch-verification-md--giới-hạn-hiện-tại"></a>
##### Giới hạn hiện tại

Chưa thêm UI đổi nhân viên sau phân công, khởi hành/đến nơi, cân, duyệt báo giá, thanh toán, quản lý danh mục/giá và các module còn lại. Nhân viên ACTIVE trong danh sách chưa chắc rảnh; backend quyết định trùng giờ lúc phân công. Bốn số lượng theo trạng thái chưa phải dashboard tài chính hay tổng khối lượng. Phiên backend vẫn ở RAM và mất khi backend khởi động lại.

Quy tắc bố cục cho trang thêm sau đã ghi trong README và `admin-design.md`. Hợp đồng backend và SQL schema không đổi.

<!-- source-end:doc-frontend-vcoi-docs-admin-dispatch-verification-md -->

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md"></a>
### Kết quả xác thực và đặt lịch frontend

Nguồn trước khi gộp: `Frontend VCoi/docs/auth-booking-verification.md`.

<!-- source-begin:doc-frontend-vcoi-docs-auth-booking-verification-md -->
<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--kết-quả-xác-thực-và-đặt-lịch-frontend"></a>
#### Kết quả xác thực và đặt lịch frontend

Đợt triển khai 23/10/2026, tiếp nối bản frontend công khai. Các thay đổi nằm trong `Frontend VCoi`; backend không đổi mã nguồn, schema hay hợp đồng API.

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--hành-vi-đã-hoàn-thành"></a>
##### Hành vi đã hoàn thành

- Đăng ký CUSTOMER, nhập email tùy chọn, kiểm tra mật khẩu/nhập lại, thông báo lỗi và chuyển sang đăng nhập.
- Đăng nhập bằng điện thoại/email, giữ phiên khi tải lại, đăng xuất, đưa tài khoản về đúng khu vực CUSTOMER/COLLECTOR/ADMIN.
- Route riêng chờ xác minh `/api/auth/me`, chặn sai vai trò; lỗi kiểm tra phiên có thử lại. Chuyển tài khoản/hết phiên xóa cache dữ liệu cũ.
- Mỗi lần ghi lấy CSRF mới; cookie giữ trong trình duyệt. Không lưu mật khẩu/token hay nội dung biểu mẫu vào localStorage, sessionStorage hoặc URL. Form xác thực dùng submit trực tiếp, không giữ mật khẩu trong mutation cache.
- Danh sách và chi tiết đơn theo quyền, phân trang, trạng thái tải/rỗng/lỗi, hiển thị ngày giờ Việt Nam và ước tính server.
- Đặt lịch bằng địa chỉ nhập trực tiếp, 1–50 vật liệu khác nhau, kg tùy chọn, dấu phẩy thập phân, ghi chú và khung giờ tương lai. Bước xem lại cho sửa thông tin trước khi gửi.
- Khóa gửi trùng, không tự thử lại khi chưa biết kết quả. Trang xác nhận hiển thị mã và PENDING; lấy giá, trạng thái và chủ đơn từ backend.

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--kiểm-chứng"></a>
##### Kiểm chứng

| Loại kiểm tra             | Bằng chứng                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest                    | 53 ca trong bộ test frontend, gồm phiên, guard, CSRF, redirect, dữ liệu form, giờ Việt Nam và hồi quy bảng giá/menu                       |
| Trình duyệt cho luồng mới | 55 kiểm tra: luồng đăng ký → đăng nhập → đặt lịch, ba vai trò, gửi một lần, hết phiên, 5xx không tự gửi lại, 4 cỡ màn hình × 2 chế độ màu |
| Accessibility             | Axe trên 6 trang mới ở 320/1440 px, sáng/tối; kiểm tra không tràn ngang và nhãn biểu mẫu                                                  |
| Trình duyệt công khai     | Bộ 21 kiểm tra trang chủ/bảng giá được giữ lại, bổ sung nhận diện 401 dự kiến của kiểm tra phiên ẩn danh                                  |
| Hệ thống thật             | 16 kiểm tra trình duyệt với Spring Boot và SQL Server; đối chiếu SQL bên dưới                                                             |
| Audit                     | npm không ghi nhận lỗ hổng đã biết ở thời điểm kiểm tra                                                                                   |

HTTP mô phỏng dùng dữ liệu từ hợp đồng API, chỉ phục vụ chứng minh hành vi frontend khi gặp các phản hồi khác nhau. Nó không thay cho kiểm chứng SQL Server thật. Postman CLI không có trong môi trường này; không tạo/push tài nguyên Postman chung.

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--kiểm-tra-sql-server-thật"></a>
##### Kiểm tra SQL Server thật

Script `scripts/verify-live-auth-booking.ps1` chạy backend riêng trên 18080 và frontend trên 5174, dùng DB `EcoThuGomDB`. Tạo admin/nhân viên/khách hàng thử với marker duy nhất và mật khẩu sinh ngẫu nhiên qua môi trường tiến trình, không lưu mật khẩu vào file.

Trình duyệt thực hiện đăng ký, đăng nhập, đặt lịch và xem đơn sau khi tải lại; xác nhận đăng xuất; admin và nhân viên đăng nhập đúng khu vực và bị chặn khi vào route khác vai trò. Admin gọi API xác nhận/phân công như bước chuẩn bị dữ liệu kiểm thử, không phải thao tác UI đã triển khai. Nhân viên sau đó thấy đúng đơn được giao trong giao diện.

SQL xác nhận có một đơn thử ASSIGNED/version 2, một dòng vật liệu và ba log chuyển trạng thái. Dữ liệu thử được xóa theo cả marker, số điện thoại và vai trò chính xác, trong transaction; kiểm tra không còn danh tính marker. Hai tiến trình thử được dừng trong `finally`. Backend 8080/frontend 5173 vẫn chạy bình thường; không reset IDENTITY hoặc sửa dữ liệu có sẵn.

Kết quả máy: `.cache/live-auth/result.json`; kết quả HTTP mô phỏng và ảnh giao diện: `.cache/auth-booking/`. Các thư mục cache không đưa vào Git.

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--rà-soát-và-giới-hạn"></a>
##### Rà soát và giới hạn

Đã thử đảo điều kiện so sánh vai trò trong một bản sao nguồn riêng: 4 ca kiểm thử phát hiện lỗi. Mã website đang chạy giữ nguyên SHA-256, bản sao kiểm thử đã xóa. Bổ sung ca hồi quy khi cookie bị đổi sang tài khoản khác để loại bỏ cache tài khoản cũ.

Nhân viên/admin hiện xem danh sách và chi tiết. Chưa triển khai UI xác nhận/phân công, cập nhật tiến độ, nhập cân, duyệt giá, thanh toán mô phỏng và các màn quản trị khác. Chưa có idempotency phía backend cho tạo lịch; UI ngăn bấm trùng và hướng kiểm tra lịch sử nếu kết quả không chắc chắn.

Số Lighthouse trong `verification.md` là số đo lịch sử trước đợt này, không được dùng làm kết quả hiệu năng mới. Các trang nghiệp vụ mới tách chunk tải theo route.

<a id="doc-frontend-vcoi-docs-auth-booking-verification-md--chạy-lại"></a>
##### Chạy lại

```powershell
npm run check
npm run format:check
npm run test:browser
npm run test:flows
.\scripts\verify-live-auth-booking.ps1
```

<!-- source-end:doc-frontend-vcoi-docs-auth-booking-verification-md -->

<a id="doc-frontend-vcoi-docs-verification-md"></a>
### Kết quả kiểm tra bản khởi tạo VCoi

Nguồn trước khi gộp: `Frontend VCoi/docs/verification.md`.

<!-- source-begin:doc-frontend-vcoi-docs-verification-md -->
<a id="doc-frontend-vcoi-docs-verification-md--kết-quả-kiểm-tra-bản-khởi-tạo-vcoi"></a>
#### Kết quả kiểm tra bản khởi tạo VCoi

Ngày kiểm tra: 23/10/2026. Môi trường Windows, Node 24.14.0, npm 11.19.0, Chrome headless. Đối chiếu giao diện với hướng thiết kế trong `design-direction.md`.

<a id="doc-frontend-vcoi-docs-verification-md--các-lệnh-và-kết-quả-thực-tế"></a>
##### Các lệnh và kết quả thực tế

| Kiểm tra               | Kết quả                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run lint`         | Đạt, không có lỗi/cảnh báo ESLint                                 |
| `npm test`             | 14/14 ca qua, 3 tệp kiểm thử                                      |
| `npm run build`        | Đạt, bản build trong `dist/`                                      |
| `npm run format:check` | Đạt                                                               |
| `npm run test:browser` | 21/21 kiểm tra qua                                                |
| `npm audit`            | Không có lỗ hổng đã biết trong kết quả npm tại thời điểm kiểm tra |

Kiểm thử tự động gồm đọc dữ liệu API, phân trang danh mục, kiểm tra dữ liệu giá, giữ cookie, xử lý JSON hỏng/lỗi mạng, phân biệt giá chưa có, lọc nhóm, chuyển trang, tải lại, dữ liệu rỗng và menu bàn phím.

Thử đảo điều kiện kiểm tra đơn giá hợp lệ khiến ca kiểm thử API thất bại đúng dự kiến. Sau thử nghiệm, tệp được khôi phục nguyên byte và kiểm tra SHA-256 trùng bản gốc; bộ test cuối cùng lại qua đủ 14 ca.

<a id="doc-frontend-vcoi-docs-verification-md--kiểm-tra-trình-duyệt"></a>
##### Kiểm tra trình duyệt

- Trang chủ và bảng giá ở 320, 768, 1024, 1440 px, cả chế độ sáng và tối; không tràn ngang.
- Nút chính nằm trong màn hình đầu; menu di động đóng/mở được, Escape trả focus về nút menu.
- Skip link, FAQ dùng bàn phím và trang 404 hoạt động.
- Axe trên hai trang ở 1440 px, sáng/tối: không có vi phạm được công cụ phát hiện.
- Không có lỗi console trên các trang dùng dữ liệu thật.
- Gọi API thật qua proxy đến backend `127.0.0.1:8080`: hiển thị đúng 9 vật liệu mẫu trong SQL Server, chia 2 trang; lọc nhóm trả đúng dữ liệu.
- Tình huống tải/rỗng, HTTP 502 trả HTML, mất kết nối được mô phỏng tại lớp HTTP của trình duyệt kiểm thử. Giao diện báo lỗi và cho thử lại, không lộ nội dung lỗi máy chủ, không thay bằng giá giả.
- Không gửi yêu cầu ghi, không đổi schema hoặc dữ liệu SQL Server. Postman CLI không có trong môi trường thực thi; kiểm tra này dùng Playwright và hợp đồng API đã có trong backend.

Ảnh chụp và JSON kết quả ở `.cache/verification/`. Script chạy lại là `scripts/verify-browser.mjs`.

<a id="doc-frontend-vcoi-docs-verification-md--lighthouse"></a>
##### Lighthouse

Đo trang chủ bản build trên `http://127.0.0.1:4173/`, cấu hình mobile mặc định của Lighthouse 13.5.0:

| Chỉ số                   | Kết quả sau tối ưu |
| ------------------------ | ------------------ |
| Performance              | 94/100             |
| Accessibility            | 100/100            |
| Best practices           | 100/100            |
| SEO                      | 100/100            |
| First Contentful Paint   | 1,9 giây           |
| Largest Contentful Paint | 2,9 giây           |
| Cumulative Layout Shift  | 0,012              |
| Total Blocking Time      | 60 ms              |

Ảnh responsive và preload giúp điểm Performance tăng từ 77 lên 94, LCP từ 5,4 xuống 2,9 giây trong lần đo này. Ảnh chính màn hình nhỏ còn khoảng 65–135 KB thay vì tải ảnh 446 KB. LCP còn dư địa giảm về dưới 2,5 giây; khi triển khai hosting cần đo lại với nén truyền tải, cache và máy chủ thực tế. Đây là phép đo phòng thử nghiệm trên localhost, không phải dữ liệu người dùng thực.

Lệnh đo lại sau `npm run build` và `npm run preview`:

```powershell
npm exec -- lighthouse http://127.0.0.1:4173/ --output=json --output-path=.cache/verification/lighthouse-mobile.json --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo --quiet
```

<a id="doc-frontend-vcoi-docs-verification-md--phạm-vi-còn-lại"></a>
##### Phạm vi còn lại

Bản này là nền frontend cùng trang chủ và bảng giá. Chưa có màn xác thực, đặt lịch, quản lý đơn, khu vực nhân viên hoặc admin. Các màn đó sẽ dùng API backend hiện tại, cookie phiên và CSRF; bảng giá hiện tại không yêu cầu đăng nhập.

<!-- source-end:doc-frontend-vcoi-docs-verification-md -->

---

<a id="group-ke-hoach"></a>
## Kế hoạch và lịch sử triển khai

<a id="doc-ecothugom-backend-docs-backend-roadmap-md"></a>
### Phần backend còn thiếu và thứ tự đề xuất

Nguồn trước khi gộp: `ecothugom-backend/docs/backend-roadmap.md`.

<!-- source-begin:doc-ecothugom-backend-docs-backend-roadmap-md -->
<a id="doc-ecothugom-backend-docs-backend-roadmap-md--phần-backend-còn-thiếu-và-thứ-tự-đề-xuất"></a>
#### Phần backend còn thiếu và thứ tự đề xuất

Rà soát ngày 23/10/2026 từ controller, service, README và tài liệu Phan_tich_thiet_ke_EcoThuGom_Huong_1.docx. Đây là đề xuất để chọn việc tiếp theo, chưa phải các API đã triển khai hoặc cam kết triển khai toàn bộ. Phạm vi hiện tại: một đại lý, Spring Boot, SQL Server, frontend React, thanh toán mô phỏng.

Cập nhật cùng ngày: **đủ tám nhóm API trong bảng người dùng đã được triển khai**, gồm cả các phần bổ sung sau danh mục/bảng giá. Xem [hướng dẫn tổng hợp](#doc-ecothugom-backend-docs-backend-completion-md), [OpenAPI](<ecothugom-backend/docs/backend-completion-openapi.json>), [kết quả 211 test và 250 kiểm tra HTTP/SQL Server](#doc-ecothugom-backend-docs-backend-completion-verification-md). Các mục vùng phục vụ, thông báo/đánh giá và React nằm ngoài lượt này.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--những-phần-đã-có"></a>
##### Những phần đã có

- Đăng ký CUSTOMER, đăng nhập/đăng xuất, session/CSRF và ba vai trò; xem tài khoản hiện tại. Admin xem user, tạo collector và khóa/mở tài khoản.
- Danh mục và giá hiện hành chỉ đọc, lọc/phân trang; giá APPROVED theo hiệu lực.
- Khách đặt lịch và xem đơn của mình; admin xác nhận/phân công, chặn trùng lịch; nhân viên xem đơn được giao.
- ASSIGNED -> EN_ROUTE -> ARRIVED; cân/điều chỉnh giữ lịch sử; gửi báo giá và khách chấp thuận/từ chối.
- Thanh toán mô phỏng từ báo giá ACCEPTED, chuyển COMPLETED; đọc payment theo quyền, chống ghi lặp và transaction/audit.
- ADMIN quản lý danh mục/vật liệu và giá nháp, duyệt/từ chối, xem lịch sử phiên bản giá; giữ nguyên snapshot giao dịch cũ.

Luồng chính đủ để bắt đầu nối React. Không cần chờ hoàn tất tất cả phần mở rộng mới có giao diện.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--đối-chiếu-phạm-vi-và-các-đề-xuất-còn-lại"></a>
##### Đối chiếu phạm vi và các đề xuất còn lại

| Phần | Trạng thái hiện tại | Liên hệ thiết kế / ưu tiên |
|---|---|---|
| Quản trị danh mục, vật liệu, bảng giá | Đã có API ADMIN cho danh mục/vật liệu và tạo/sửa/duyệt/từ chối/lịch sử phiên bản giá. Không còn cần cập nhật các nghiệp vụ này bằng SQL thủ công. | FR02/FR03; dùng admin-catalog-openapi.json và admin-prices-openapi.json. |
| Hồ sơ và địa chỉ | Đã có sửa tên/email, đổi mật khẩu thu hồi phiên, CRUD/mặc định địa chỉ và booking addressId giữ snapshot. | FR01; profile-addresses.md và backend-completion.md. |
| Hủy/đổi lịch/phân công lại | Đã có: mọi hủy cần admin duyệt, đổi lịch trước khởi hành/yêu cầu sau khởi hành, admin phân công lại trước di chuyển. | FR10/BR08 được điều chỉnh theo xác nhận người dùng, giữ version/lịch trùng/audit. |
| Timeline và biên nhận | Đã có GET timeline phân trang và biên nhận JSON từ payment/quote/đúng phiếu cân đã chốt theo vai trò. | FR07/FR09/BR10; không lấy lại giá/tên/cân mới để thay snapshot. |
| Ảnh minh chứng | Đã có multipart và GET riêng tư, ảnh lưu backend; customer/admin đọc cân theo quyền. | FR04/FR08/BR06; JPEG/PNG 5 MiB, bảo vệ slot ảnh và phiếu cân được quote tham chiếu. |
| Khiếu nại | Đã có khách mở/xem, admin tiếp nhận/kết luận/từ chối và phục hồi previousOrderStatus. | FR10/BR10; không sửa payment hoặc số tiền đã chốt. |
| Thống kê quản trị | Đã có overview/materials/collectors theo kỳ lịch Việt Nam, đúng cohort/paid_at và snapshot. | FR11; không cộng cân gốc lẫn correction, không nhân payment theo số item. |
| Vùng phục vụ và giờ hẹn | Công khai phạm vi một đại lý, khung giờ được chọn; kiểm tra đặt lịch ngoài vùng/giờ. | Phần FR05 còn lại sau khi bỏ điều phối nhiều đại lý. Hiện chỉ kiểm tra thời gian tương lai/thứ tự và trùng lịch khi giao nhân viên. Cần chốt cấu hình hoặc schema trước triển khai. |
| Thông báo và đánh giá | Thông báo trong ứng dụng theo sự kiện và đánh dấu đã đọc; khách đánh giá sau hoàn tất nếu giữ mục này trong phạm vi nộp bài. | Tài liệu có đề cập, chưa thấy bảng/module chuyên biệt trong schema hiện tại. Làm ở cuối sau các phần nghiệp vụ chính, cập nhật ERD nếu bổ sung. |

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--quản-trị-danh-mục-và-bảng-giá--đã-hoàn-thành"></a>
##### Quản trị danh mục và bảng giá — đã hoàn thành

Hai lát dưới đây đã được triển khai. Các hợp đồng OpenAPI cuối cùng là nguồn chuẩn khi gọi API:

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--lát-1--danh-mục-và-vật-liệu-cho-admin"></a>
###### Lát 1 – Danh mục và vật liệu cho admin

Đã hoàn thành: GET/POST danh sách, GET/PUT chi tiết và PATCH /status cho cả hai tài nguyên. Các dòng dự kiến PATCH thông tin phía dưới là đề xuất ban đầu; hợp đồng cuối dùng PUT thay toàn bộ thông tin và giữ trạng thái, PATCH chỉ đổi trạng thái. Dùng admin-catalog-openapi.json khi gọi API thực tế.

- GET/POST `/api/admin/material-categories`; PATCH `/api/admin/material-categories/{id}`; thay isActive thay vì xóa vật lý dữ liệu đã được tham chiếu.
- GET/POST `/api/admin/materials`; PATCH `/api/admin/materials/{id}`; quản lý accepted để ngừng thu mua. GET admin gồm cả dữ liệu ẩn, khác GET công khai hiện có.
- Tiêu chí: chỉ ADMIN, POST/PATCH cần CSRF, kiểm tra trùng và dữ liệu hợp lệ; ngừng thu mua không làm mất lịch sử đơn/báo giá.
- Xác minh: MockMvc/H2 các quyền, đầu vào và liên kết; verify toàn bộ; thử SQL Server bằng dữ liệu tạm.
- Phạm vi file: controller/service/request admin catalog, repository hiện có và test. Chia danh mục và vật liệu thành hai lượt nếu vượt một phiên tập trung.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--lát-2--phiên-bản-giá-và-quy-trình-duyệt"></a>
###### Lát 2 – Phiên bản giá và quy trình duyệt

Đã hoàn thành: GET/POST `/api/admin/price-rules`, GET/PUT `/{id}`, POST `/{id}/approve` và `/{id}/reject`, GET `/api/admin/materials/{id}/price-rules` xem lịch sử. Hợp đồng và giới hạn sửa bản nháp: docs/admin-prices.md; tài liệu import Postman: admin-prices-openapi.json. Các gạch đầu dòng sau là tiêu chí đã dùng khi triển khai.

- GET `/api/admin/price-rules` có lọc vật liệu/trạng thái; POST tạo DRAFT; sửa chỉ DRAFT; POST `/{id}/approve` hoặc `/{id}/reject`.
- Tiêu chí: giá dương, hiệu lực hợp lệ, version_number không trùng; không ghi đè giá APPROVED đã được đơn/báo giá tham chiếu. Thay giá bằng phiên bản mới, giữ quy tắc chọn giá hiện hành đang có.
- Tiêu chí: chỉ ADMIN, không thay giá của quote đã gửi/đã chấp thuận hoặc số tiền đã thanh toán. Tài khoản COLLECTOR không được sửa quy tắc giá.
- Xác minh: kiểm tra giá mới xuất hiện đúng trên `/api/prices/current`; giá cũ vẫn nguyên trong đơn/báo giá/thanh toán; race khi tạo/duyệt và rollback. Sau đó verify và SQL Server.
- Phụ thuộc: vật liệu tồn tại; dùng schema price_rules hiện tại. Đối chiếu metadata và chốt quy tắc sửa giá nháp trước khi triển khai.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--lát-3--hồ-sơ-và-ngoại-lệ-đơn-đã-hoàn-thành"></a>
###### Lát 3 – Hồ sơ và ngoại lệ đơn, đã hoàn thành

Theo xác nhận mới nhất của người dùng: mọi yêu cầu hủy của khách phải liên hệ/gửi yêu cầu cho ADMIN duyệt, kể cả trước khởi hành; POST /cancel chỉ tạo yêu cầu PENDING. Khách tự đổi lịch trước EN_ROUTE, sau đó dùng yêu cầu có lý do và admin xử lý. Đơn đã thanh toán không hủy; chuyển qua khiếu nại. Đổi lịch/phân công phải kiểm tra lại lịch trùng và version, giữ audit. Không dùng một PATCH status tự do cho các chuyển trạng thái.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--lát-4--dữ-liệu-hiển-thị-và-hỗ-trợ-đã-hoàn-thành"></a>
###### Lát 4 – Dữ liệu hiển thị và hỗ trợ, đã hoàn thành

Timeline/biên nhận, ảnh minh chứng, khiếu nại và thống kê đã được triển khai, kiểm tra quyền/trạng thái/transaction và hồi quy. Màn hình admin/khách React có thể nối theo OpenAPI tổng hợp; frontend không thuộc lượt hoàn thiện API này.

<a id="doc-ecothugom-backend-docs-backend-roadmap-md--những-điểm-cần-thống-nhất-trong-bài-viết"></a>
##### Những điểm cần thống nhất trong bài viết

- Tài liệu gốc mô tả nhiều đại lý và PostgreSQL; quyết định hiện tại là một đại lý và SQL Server. Cập nhật các sơ đồ/mô tả tương ứng, không thêm API quản lý nhiều đại lý chỉ để khớp bản cũ.
- BR03 bản gốc có quy tắc giữ giá đặt lịch trong 24 giờ. Backend đã thống nhất lấy giá APPROVED hiện hành khi gửi báo giá, rồi giữ snapshot trong báo giá có hạn phản hồi 24 giờ. Hai quy tắc khác nhau: cần sửa tài liệu hoặc chốt lại yêu cầu trước khi bổ sung chính sách giữ giá.
- Thanh toán mô phỏng hiện do collector ghi nhận và tự hoàn tất đơn; nếu báo cáo giữ bước khách xác nhận đã nhận tiền riêng thì phải điều chỉnh mô tả hoặc thiết kế thêm bước, không coi là API đã có.
- Phần thông báo/đánh giá/vùng phục vụ cần rà lại phạm vi nộp môn và thiết kế dữ liệu. Các mục ghi MVP trong tài liệu gốc chưa đồng nghĩa đã triển khai trong mã.

Kết quả hoàn tất lượt API: hợp đồng OpenAPI/HTTP cập nhật, 211 test verify và 250 kiểm tra HTTP/SQL Server đạt; đã dọn dữ liệu/ảnh thử và dừng JVM thử. Schema production không đổi. React và các đề xuất ngoài bảng cần một lượt riêng.

<!-- source-end:doc-ecothugom-backend-docs-backend-roadmap-md -->

<a id="doc-ecothugom-backend-tasks-admin-catalog-md"></a>
### Quản trị danh mục và vật liệu – 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/tasks/admin-catalog.md`.

<!-- source-begin:doc-ecothugom-backend-tasks-admin-catalog-md -->
<a id="doc-ecothugom-backend-tasks-admin-catalog-md--quản-trị-danh-mục-và-vật-liệu--23102026"></a>
#### Quản trị danh mục và vật liệu – 23/10/2026

- [x] Contract, test RED cho danh mục; GET/POST/PUT/PATCH trạng thái, 33 test tập trung/hồi quy đạt.
- [x] Contract, test RED cho vật liệu; thêm/sửa/ngừng/nhận lại, lọc admin, tích hợp công khai/đặt lịch/lịch sử đạt.
- [x] Rà soát, mutation bắt lỗi ngừng thu mua, khôi phục nguồn nguyên byte; verify/build và OpenAPI/HTTP/Postman.
- [x] 152 test toàn bộ và 123 kiểm tra HTTP SQL Server đạt; Unicode/unique/FK/status/snapshot, dọn riêng dữ liệu và dừng server thử.

Chỉ ADMIN; POST/PUT/PATCH cần CSRF. GET admin gồm cả dữ liệu ẩn, phân trang id tăng. POST tạo active/accepted=true; PUT thay thông tin (optional thiếu/null/trống -> null), giữ trạng thái; PATCH /status thay đúng boolean bắt buộc. Không DELETE, không schema production/dependency mới; chưa làm quản trị bảng giá. Ràng buộc tên nhóm và tổ hợp category/name/grade, chuẩn hóa khoảng trắng/case duplicate. Unit KG theo schema. PUT và PATCH khóa dòng để cập nhật độc lập, không thêm version chưa có trong DB. Giữ row tham chiếu và mọi số liệu/snapshot báo giá/thanh toán.

<!-- source-end:doc-ecothugom-backend-tasks-admin-catalog-md -->

<a id="doc-ecothugom-backend-tasks-admin-prices-md"></a>
### ADMIN quản lý phiên bản giá

Nguồn trước khi gộp: `ecothugom-backend/tasks/admin-prices.md`.

<!-- source-begin:doc-ecothugom-backend-tasks-admin-prices-md -->
<a id="doc-ecothugom-backend-tasks-admin-prices-md--admin-quản-lý-phiên-bản-giá"></a>
#### ADMIN quản lý phiên bản giá

Trạng thái hiện tại (25/10/2026): hoàn tất; hợp đồng cũ dưới đây đã được cập nhật để gửi/kiểm tra `draftRevision`.

Yêu cầu: tạo/sửa giá nháp, duyệt/từ chối và xem lịch sử phiên bản; tương thích SQL Server hiện tại.

Hợp đồng trước triển khai:
- GET/POST `/api/admin/price-rules`; GET/PUT `/{id}`; POST `/{id}/approve` và `/{id}/reject`.
- GET `/api/admin/materials/{id}/price-rules` xem lịch sử, versionNumber giảm dần. Danh sách chung lọc materialId/approvalStatus, id giảm dần; page=0, size=20, tối đa 100.
- POST tạo DRAFT, tự cấp MAX(version_number)+1 theo vật liệu, gồm cả phiên bản bị từ chối. PUT thay unitPrice/validFrom/validTo của DRAFT; không đổi vật liệu, số phiên bản hoặc người tạo.
- Giá nguyên VND >0, tối đa 18 chữ số; validFrom bắt buộc có múi giờ, validTo tùy chọn và lớn hơn validFrom. Lưu UTC chính xác mili giây trong phạm vi datetime2; PUT bỏ validTo sẽ xóa ngày kết thúc.
- Chỉ DRAFT được sửa/duyệt/từ chối; APPROVED/REJECTED bất biến, chuyển lại hoặc lặp trả 409. Duyệt ghi approvedBy/approvedAt từ phiên ADMIN/Clock. Không tự đóng phiên bản cũ.
- Có thể chuẩn bị/duyệt giá cho vật liệu ngừng nhận hoặc danh mục ẩn; quy tắc công khai hiện có vẫn lọc chúng. Có thể lưu lịch hiệu lực quá khứ/tương lai; chỉ giá đang hiệu lực xuất hiện công khai.
- ADMIN + cookie phiên; mọi lệnh ghi cần CSRF. Không nhận trường trạng thái/metadata từ client, không xóa cứng, không sửa schema.
- Khóa vật liệu khi cấp số phiên bản; khóa bản giá khi sửa/chuyển trạng thái. PUT/approve/reject bắt buộc gửi `expectedRevision` khớp với `draftRevision` đang khóa; revision cũ trả 409 trước khi ghi. Hash snapshot được tính từ dữ liệu đã lưu, không thêm cột hoặc migration. `versionNumber` vẫn chỉ tăng khi tạo bản mới.

Tiêu chí hoàn tất:
- [x] Test hành vi API, dữ liệu biên, quyền/CSRF, tranh chấp và snapshot cũ: 18 test tích hợp `AdminPriceApiTests`, gồm hai phiên đăng nhập riêng.
- [x] Triển khai theo module catalog và giữ nguyên chọn giá hiện hành.
- [x] Tài liệu Markdown/HTTP/OpenAPI, liên kết Postman cục bộ; 11 operationId không trùng, tham chiếu nội bộ giải được.
- [x] Kiểm thử hồi quy bảng giá trên H2; kiểm thử Chrome + Spring Boot + SQL Server thật với hai phiên ADMIN riêng, xen kẽ sửa/duyệt/từ chối; dữ liệu tạm được dọn sau lượt thử.

Kết quả và giới hạn: docs/admin-prices-verification.md. Không sửa schema/dependency, không push Postman workspace.

<!-- source-end:doc-ecothugom-backend-tasks-admin-prices-md -->

<a id="doc-ecothugom-backend-tasks-payment-md"></a>
### Thanh toán mô phỏng – 23/10/2026

Nguồn trước khi gộp: `ecothugom-backend/tasks/payment.md`.

<!-- source-begin:doc-ecothugom-backend-tasks-payment-md -->
<a id="doc-ecothugom-backend-tasks-payment-md--thanh-toán-mô-phỏng--23102026"></a>
#### Thanh toán mô phỏng – 23/10/2026

- [x] Contract và test RED (404 trước khi có endpoint) cho ghi nhận, đọc theo quyền, version/trạng thái, gửi lặp, race và rollback.
- [x] Triển khai POST/GET theo session/CSRF/JdbcTemplate; không thay schema production hoặc thêm dependency.
- [x] 22 ca thanh toán, 139 test toàn bộ đạt và build JAR; mutation bỏ guard ACCEPTED bị test phát hiện, đã khôi phục nguyên byte.
- [x] SQL Server thật: 91 kiểm tra HTTP đạt; hai phương thức, cạnh tranh và trùng key khác đơn; đã dọn dữ liệu và dừng JVM thử.
- [x] OpenAPI (8 paths/45 refs), HTTP mẫu, README, hướng dẫn Postman và kết quả xác minh.

Tiêu chí: chỉ COLLECTOR ACTIVE được giao đơn, AWAITING_PAYMENT và version khớp mới ghi được. quoteId phải thuộc đơn và là ACCEPTED hiện hành. Tiền lấy nguyên từ báo giá; không thu thập thông tin ngân hàng. requestKey GUID do client tạo một lần dùng nhận diện yêu cầu và chống trùng; lặp trả 409, không replay. Một transaction ghi COMPLETED payment + COMPLETED order/version+1/completed_at + audit. GET giới hạn 100 bản gần nhất, đúng phạm vi. Mọi POST vẫn CSRF; không gọi dịch vụ thanh toán thật. Giữ cổng người dùng 8080; dùng cổng thử 18080.

<!-- source-end:doc-ecothugom-backend-tasks-payment-md -->

<a id="doc-ecothugom-backend-tasks-plan-md"></a>
### Thu gom, cân thực tế và khách duyệt báo giá

Nguồn trước khi gộp: `ecothugom-backend/tasks/plan.md`.

<!-- source-begin:doc-ecothugom-backend-tasks-plan-md -->
<a id="doc-ecothugom-backend-tasks-plan-md--thu-gom-cân-thực-tế-và-khách-duyệt-báo-giá"></a>
#### Thu gom, cân thực tế và khách duyệt báo giá

Ngày: 2026-10-23. Phạm vi: backend một đại lý; không tích hợp thanh toán.

1. Nhân viên được phân công chuyển ASSIGNED -> EN_ROUTE -> ARRIVED. Kiểm tra lại đặt lịch, xác nhận, phân công và di chuyển trước khi làm bước 2.
2. Nhập cân khi ARRIVED. Mỗi lần sửa tạo phiếu mới nối correction_of; giữ lịch sử. Gửi báo giá dùng phiếu cân mới nhất của mọi mặt hàng và giá APPROVED hiện hành. Không nhận giá hoặc tổng tiền từ client. Mỗi lần gửi tăng version_number; chỉ một báo giá hiện hành.
3. Khách xem lịch sử báo giá của mình, đồng ý hoặc từ chối báo giá SENT hiện hành còn hạn. Đồng ý -> AWAITING_PAYMENT; từ chối -> ARRIVED. Báo giá cũ vẫn đọc được. Chưa làm thanh toán.
4. Đồng bộ OpenAPI, HTTP examples, README; kiểm thử hồi quy và SQL Server thật bằng dữ liệu tạm; tạo báo cáo Word ngắn và render kiểm tra.

Mọi thay đổi ghi dữ liệu kiểm tra role, quyền sở hữu, CSRF, trạng thái và version. Ghi dữ liệu và lịch sử chung transaction. Chặn thao tác đồng thời bằng version trên đơn; lỗi 409 yêu cầu tải lại. Không sửa schema production và không sửa dữ liệu người dùng.

Xác minh: MockMvc/H2 cho luồng thành công, lỗi đầu vào, role/ownership, stale version, race, rollback và thời hạn. SQL Server thật kiểm tra JDBC, computed columns, composite FK, filtered unique indexes và luồng HTTP. Dừng server thử cổng 18080 và xóa riêng dữ liệu tạm sau test. Giữ server người dùng cổng 8080.

<a id="doc-ecothugom-backend-tasks-plan-md--lộ-trình-tiếp-theo-được-đề-xuất--23102026"></a>
##### Lộ trình tiếp theo được đề xuất – 23/10/2026

Phần ba bước phía trên đã hoàn tất; thanh toán mô phỏng cũng hoàn tất, xem tasks/payment.md. Người dùng đang hỏi phần còn thiếu và thứ tự làm tiếp; chưa yêu cầu triển khai các mục mới dưới đây.

Đề xuất bắt đầu bằng API ADMIN cho danh mục/vật liệu, sau đó tạo và duyệt phiên bản giá. Tiếp theo là hồ sơ/địa chỉ, hủy/đổi lịch/phân công lại; rồi timeline/biên nhận, ảnh minh chứng, khiếu nại và thống kê. React có thể bắt đầu nối với luồng hiện có và phát triển theo từng lượt.

Cập nhật: người dùng đã yêu cầu và phần ADMIN danh mục/vật liệu đã hoàn thành, gồm PUT thông tin và PATCH trạng thái. 152 test, 123 kiểm tra HTTP SQL Server đạt; xem tasks/admin-catalog.md và docs/admin-catalog-verification.md. Tiếp theo ADMIN bảng giá cũng đã hoàn thành: tạo/sửa DRAFT, duyệt/từ chối và lịch sử phiên bản; 169 test, 169 kiểm tra API/SQL Server đạt, xem tasks/admin-prices.md và docs/admin-prices-verification.md. Các mục còn lại vẫn là đề xuất chưa triển khai.

Phạm vi, endpoint dự kiến, tiêu chí kiểm tra và những khác biệt với tài liệu thiết kế cũ nằm ở docs/backend-roadmap.md. Giữ nguyên lịch sử và các phần đã kiểm thử.

<a id="doc-ecothugom-backend-tasks-plan-md--mở-rộng-theo-yêu-cầu-bảng-tám-nhóm-api"></a>
##### Mở rộng theo yêu cầu bảng tám nhóm API

Người dùng đã yêu cầu rà soát và làm thêm các phần còn thiếu trong bảng. Bản đồ phạm vi: CAPABILITY-MAP.md. Hai nhóm admin-catalog/admin-prices đã hoàn thành. Không mở rộng sang các đề xuất nằm ngoài tám nhóm.

1. profile-addresses: PUT hồ sơ và đổi mật khẩu (thu hồi phiên cũ); CRUD địa chỉ/mặc định; booking bằng addressId giữ snapshot. Tách tài khoản và địa chỉ thành lát nhỏ, mỗi lát test tập trung.
2. order-changes: theo xác nhận mới của người dùng, mọi yêu cầu hủy cần admin duyệt, POST /cancel chỉ tạo PENDING; reschedule trực tiếp trước khởi hành, request/review và phân công lại, kiểm tra version/lịch trùng, audit. Schema order_change_requests đã có; bổ sung fixture H2 tương ứng.
3. order-history: đọc timeline phân trang và biên nhận từ quote đã thanh toán, theo quyền sở hữu/collector/admin.
4. evidence: ảnh JPEG/PNG tối đa 5 MB, lưu riêng ngoài static webroot, file ngẫu nhiên; tải và đọc theo quyền với đơn, gắn đúng item/lần cân, không cho ghi đè cân/báo giá cũ.
5. disputes: khách mở tranh chấp có lý do, một tranh chấp hoạt động/đơn; admin tiếp nhận/kết luận; lưu previous_order_status và phục hồi có audit; không thay tiền chốt.
6. admin-reports: ngày/kỳ UTC rõ ràng, số đơn/tỉ lệ/tổng tiền thanh toán và cân snapshot, theo vật liệu và nhân viên; tránh nhân bản tiền khi join nhiều item.

Mỗi module có SPEC riêng trước khi code. Dependency theo bảng CAPABILITY-MAP, test theo lát → hồi quy tại checkpoint → SQL Server thật có cleanup. Dùng API Engineering/TDD/Security/Review hiện có; đọc schema để tránh đoán cột/ràng buộc. Người dùng đã xác nhận ảnh lưu backend và sửa quy tắc: mọi hủy đều cần liên hệ/gửi yêu cầu cho admin duyệt. Mã, test và tài liệu đã được đổi theo xác nhận đó.

Hoàn tất: đủ tám nhóm trong bảng; Maven verify 211 test, SQL Server 250 kiểm tra HTTP/SQL đạt. Đã dọn riêng dữ liệu/ảnh thử, dừng cổng 18080; không sửa schema production/dependency. Hợp đồng OpenAPI tổng hợp và báo cáo tại docs/backend-completion*. React và đề xuất ngoài bảng chưa triển khai.

<!-- source-end:doc-ecothugom-backend-tasks-plan-md -->

<a id="doc-ecothugom-backend-tasks-todo-md"></a>
### Tiến độ

Nguồn trước khi gộp: `ecothugom-backend/tasks/todo.md`.

<!-- source-begin:doc-ecothugom-backend-tasks-todo-md -->
<a id="doc-ecothugom-backend-tasks-todo-md--tiến-độ"></a>
#### Tiến độ

- [x] 1. API di chuyển và đến nơi; 48 test tập trung/hồi quy đạt.
- [x] 2. Luồng đến ARRIVED trên SQL Server: 40 kiểm tra HTTP đạt, đã dọn dữ liệu tạm.
- [x] 3. API cân, sửa cân và gửi báo giá; test và SQL Server thật đạt.
- [x] 4. API xem/đồng ý/từ chối báo giá; test và SQL Server thật đạt.
- [x] 5. Tài liệu/OpenAPI/HTTP, 117 test đạt và build JAR thành công.
- [x] 6. SQL Server: 65 kiểm tra đạt; dọn riêng dữ liệu tạm, dừng server thử.
- [x] 7. Rà soát, mutation bắt lỗi ranh giới hết hạn; báo cáo Word 4 trang đã kiểm tra ảnh từng trang.

<a id="doc-ecothugom-backend-tasks-todo-md--đã-hoàn-tất-tiếp-theo"></a>
##### Đã hoàn tất tiếp theo

- [x] Thanh toán mô phỏng: 139 test và 91 kiểm tra HTTP SQL Server đạt; chi tiết tasks/payment.md.
- [x] Rà soát phần còn thiếu so với controller và tài liệu thiết kế; ghi lộ trình ở docs/backend-roadmap.md.

<a id="doc-ecothugom-backend-tasks-todo-md--lộ-trình-tiếp-theo-và-trạng-thái"></a>
##### Lộ trình tiếp theo và trạng thái

- [x] ADMIN quản lý danh mục và vật liệu; 152 test và 123 kiểm tra HTTP SQL Server đạt. Chi tiết tasks/admin-catalog.md.
- [x] ADMIN tạo/sửa nháp, duyệt/từ chối và lịch sử phiên bản giá; giữ nguyên snapshot đơn/báo giá/thanh toán. 169 test và 169 kiểm tra API/SQL Server đạt; xem tasks/admin-prices.md.
- [x] profile-addresses: hồ sơ/mật khẩu; 4 test hồ sơ và 5 test địa chỉ, thu hồi phiên/mặc định/booking snapshot, sở hữu và đồng thời.
- [x] order-changes: mọi hủy cần admin duyệt theo xác nhận người dùng; 10 test trạng thái/version/lịch trùng/transaction, đổi lịch và phân công lại.
- [x] order-history: timeline/biên nhận snapshot và đọc cân theo quyền; 4 test cùng hồi quy cân/thanh toán.
- [x] evidence: ảnh lưu backend, 6 test nội dung/dung lượng/pixel/quyền, quoted weighing bất biến, rollback dọn file; mutation ownership bị phát hiện.
- [x] disputes: 7 test mở/tiếp nhận/kết luận, unique active/CAS/audit/rollback, lịch nhân viên và giữ tiền chốt.
- [x] admin-reports: 6 test kỳ Việt Nam, nhiều item/correction/tranh chấp, tiền/khối lượng đúng snapshot, chỉ ADMIN.
- [x] Checkpoint: Maven verify 211 test đạt; 250 kiểm tra HTTP/SQL Server đạt, dọn dữ liệu/ảnh và dừng server thử. OpenAPI 49 path/60 operation/510 ref nội bộ; docs/backend-completion-verification.md. React không thuộc lượt này.

Endpoint, tiêu chí và phạm vi: CAPABILITY-MAP.md, từng SPEC module và docs/backend-roadmap.md. Người dùng đã yêu cầu triển khai các phần còn thiếu trong bảng tám nhóm; các đề xuất ngoài bảng vẫn cần yêu cầu riêng.

<!-- source-end:doc-ecothugom-backend-tasks-todo-md -->

<a id="doc-frontend-vcoi-tasks-plan-md"></a>
### Kế hoạch xác thực và đặt lịch

Nguồn trước khi gộp: `Frontend VCoi/tasks/plan.md`.

<!-- source-begin:doc-frontend-vcoi-tasks-plan-md -->
<a id="doc-frontend-vcoi-tasks-plan-md--kế-hoạch-xác-thực-và-đặt-lịch"></a>
#### Kế hoạch xác thực và đặt lịch

<a id="doc-frontend-vcoi-tasks-plan-md--hoàn-thiện-khu-khách-hàng--24102026"></a>
##### Hoàn thiện khu khách hàng — 24/10/2026

Được yêu cầu nối API khách chấp thuận/từ chối báo giá và hoàn tất phần giao diện khách còn thiếu. Dùng các contract backend hiện có; không thêm chức năng quản trị, không thanh toán tiền thật, không sửa dự án WebPCMaker. Không cần dependency mới.

1. Duyệt báo giá: đọc đầy đủ snapshot và lịch sử; xem lại quyết định; gửi version đơn/quoteVersion và ghi chú, cập nhật từ response. Hết hạn, sai quyền, lỗi không rõ kết quả phải khóa/đọc lại. Kiểm tra API, UI và luồng thật chấp thuận/từ chối.
2. Hồ sơ/địa chỉ: sửa tên/email; đổi mật khẩu rồi đăng nhập lại; CRUD và mặc định địa chỉ; chọn địa chỉ lưu sẵn khi đặt lịch. Kiểm tra ranh giới, phiên và không thay snapshot đơn cũ.
3. Vòng đời đơn: timeline phân trang, cân/ảnh, trạng thái thanh toán và biên nhận; đổi lịch trực tiếp trước khởi hành, sau đó gửi yêu cầu; mọi hủy qua admin, rút yêu cầu đang chờ. Kiểm tra version, trạng thái và khung giờ Việt Nam.
4. Minh chứng/khiếu nại: tải JPEG/PNG tối đa 5 MiB cho từng vật liệu trước khởi hành, xem ảnh theo quyền; mở/xem khiếu nại và kết luận, chỉ dùng ảnh đã gắn đúng đơn. Kiểm tra multipart, scope và dữ liệu lỗi.
5. Hoàn thiện điều hướng và UX; hồi quy, responsive/axe, luồng thật trên dữ liệu thử riêng; đối chiếu SQL, dọn dữ liệu thử và ghi báo cáo.

Chốt thiết kế: tiếp tục ServiceLayout xanh rừng/xanh chanh, form có nhãn và trạng thái tải/rỗng/lỗi, phản hồi rõ hành động, không tự retry thao tác ghi. Các panel độc lập có khóa thao tác, mọi write kèm CSRF; backend quyết định điều kiện và tiền. Tiêu chí hoàn tất là mọi route khách hiện có được truy cập qua giao diện, các thao tác đúng quyền/trạng thái và kiểm chứng thực tế.

1. API client cookie/CSRF, lỗi an toàn, validator và test trước cho các bất biến.
2. Auth provider, form đăng ký/đăng nhập/đăng xuất, route guard và điều hướng vai trò; kiểm tra tập trung.
3. Workspace và danh sách/chi tiết đơn theo quyền, quản lý cache riêng tư.
4. Form đặt lịch, kiểm tra dữ liệu, xem lại, gửi một lần và xác nhận backend.
5. Kiểm tra hồi quy, trình duyệt với HTTP mô phỏng và kết nối backend thật nếu có; cập nhật tài liệu.

Thay đổi chỉ trong frontend, trừ khi phát hiện lỗi backend làm chặn chính luồng đã được yêu cầu. Không có Git trong workspace này nên không tạo commit hoặc tuyên bố đã rà git diff.

<a id="doc-frontend-vcoi-tasks-plan-md--tiếp-nối-admin-xác-nhận-và-phân-công"></a>
##### Tiếp nối: admin xác nhận và phân công

1. Đối chiếu contract backend, viết tiêu chí và kiểm thử ranh giới dữ liệu trước.
2. Thêm API client xác nhận/phân công, lấy nhân viên ACTIVE qua đủ trang.
3. Thêm panel thao tác vào chi tiết đơn, cập nhật cache, khóa gửi trùng và phục hồi sau xung đột.
4. Kiểm tra trình duyệt và SQL thật với dữ liệu thử riêng, rà thay đổi và cập nhật hướng dẫn.

<a id="doc-frontend-vcoi-tasks-plan-md--thiết-kế-lại-quản-trị-theo-pcmaker"></a>
##### Thiết kế lại quản trị theo PCMaker

5. Chỉ đọc dự án tham khảo; giữ nguyên chức năng và API, tạo shell quản trị độc lập với storefront.
6. Thay danh sách đơn bằng bảng, thêm bộ lọc trạng thái và số lượng thật từ API; giữ panel xử lý chi tiết.
7. Kiểm thử lại đầy đủ luồng, responsive, accessibility và SQL thật sau khi hoàn thiện giao diện.

8. Theo yêu cầu bổ sung: tách toàn bộ trang đăng nhập/đăng ký, khách, nhân viên và admin khỏi layout giới thiệu; ghi nhận quy tắc cho trang thêm sau này và kiểm tra hồi quy các vai trò.

<a id="doc-frontend-vcoi-tasks-plan-md--nhân-viên-cân-thực-tế"></a>
##### Nhân viên cân thực tế

1. Đối chiếu WeighingRequest/WeighingService và OpenAPI; kiểm thử kg, item, correction và version trước khi triển khai.
2. Form lựa chọn vật liệu, preview net, ghi theo lô và lịch sử; phối hợp cache chi tiết/lịch sử, khóa lỗi không xác định.
3. Browser nhiều vật liệu và cân lại, responsive/axe; luồng thật tới version 6, đối chiếu SQL và dọn dữ liệu thử; cập nhật tài liệu.

<a id="doc-frontend-vcoi-tasks-plan-md--hoàn-thiện-khách-hàng-và-taste-skill-toàn-frontend"></a>
##### Hoàn thiện khách hàng và Taste Skill toàn frontend

Đã hoàn tất ngày 24/10/2026:

1. Audit nhận diện và layout; áp dụng Taste cho mọi khu hiện có và phần thêm sau, giữ tokens, font, icon, tuyến đường và API.
2. Khách xem/lựa chọn/xác nhận chấp thuận hoặc từ chối báo giá, kiểm tra phiên/version/hạn/snapshot; có khóa ghi và đọc lại sau lỗi.
3. Hồ sơ, đổi mật khẩu, địa chỉ CRUD/mặc định và dùng địa chỉ lưu khi đặt lịch.
4. Yêu cầu hủy/đổi lịch/rút yêu cầu, ảnh vật liệu, khiếu nại/kết luận, timeline/cân/thanh toán/biên nhận.
5. 226 unit/component/API test, 7 bộ browser, 59 bước backend/SQL thật; đối chiếu bất biến và dọn dữ liệu tổng hợp. Rà soát cạnh tranh phiên và độ nhạy test trong bản sao biệt lập.
6. Cập nhật README và docs/customer-workspace.md với hướng dẫn, phạm vi, kết quả và các màn hình admin/nhân viên còn lại.

<a id="doc-frontend-vcoi-tasks-plan-md--nhân-viên-ghi-nhận-thanh-toán-mô-phỏng"></a>
##### Nhân viên ghi nhận thanh toán mô phỏng

1. Dùng contract PaymentResponse/SimulatedPaymentRequest hiện có; kiểm thử điều kiện đơn/báo giá/phân công, version, tiền và requestKey trước.
2. Panel cùng phong cách VCoi, cho xem lại tiền đã duyệt, chọn phương thức mô phỏng rồi xác nhận; chỉ ghi khi AWAITING_PAYMENT và đúng nhân viên.
3. Khóa nhấp đúp, không retry POST tự động; 404/409/kết quả chưa xác định phải đọc lại đơn/báo giá/payments. Hiển thị kết quả chính thức, lịch sử và giữ cache đúng phiên/version.
4. Kiểm thử UI/API, Chrome responsive/axe và lỗi; thay bước payment API trong luồng SQL thật bằng thao tác UI; cập nhật README/báo cáo và dọn dữ liệu thử.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-danh-mục-và-vật-liệu"></a>
##### Admin danh mục và vật liệu

1. Dùng contract admin-catalog hiện có: danh mục name/description/isActive, vật liệu categoryId/name/grade/KG/mô tả/URL/accepted/available. Không tạo version hoặc xóa row.
2. Taste preserve 3/2/6: hai trang trong AdminLayout, bảng phân trang và lọc URL, form có nhãn và xác nhận riêng trước ẩn/ngừng hoặc khôi phục.
3. Test ranh giới dữ liệu trước: trường cho phép, trạng thái không lẫn body thông tin, available=accepted AND categoryActive, lỗi/phiên/ghi lặp. Đọc detail trước sửa và trạng thái.
4. Kết nối API, đồng bộ cache danh mục/vật liệu/bảng giá sau ghi; không tự retry POST và khóa khi chưa rõ kết quả. Không hiển thị ảnh từ URL ngoài tự động.
5. Chrome HTTP mô phỏng, responsive/axe, unit/build và luồng thật với dữ liệu tổng hợp riêng; đối chiếu SQL và dọn đúng bản ghi thử; cập nhật README/báo cáo.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-quản-lý-bảng-giá"></a>
##### Admin quản lý bảng giá

1. Taste preserve 3/2/6, giữ AdminLayout và tokens; bảng phiên bản, lọc vật liệu/trạng thái, form nháp, chi tiết/duyệt/từ chối và lịch sử phân trang.
2. Contract yêu cầu `expectedRevision` khi PUT/review; API so sánh `draftRevision` trong cùng transaction. Kiểm thử hai phiên admin giữ bản nháp cũ ở trạng thái không ghi đè và yêu cầu tải lại.
3. Cache ADMIN riêng theo phiên, khóa ghi trùng, không retry ghi, 404/409/kết quả không rõ phải tải lại; cập nhật bảng giá công khai sau duyệt.
4. Chrome HTTP mô phỏng, responsive/axe, backend/SQL thật với dữ liệu riêng, đối chiếu và dọn; hồi quy và báo cáo.

Hoàn tất ngày 24/10/2026: 303 test/30 tệp, lint/build qua; Chrome bảng giá 21, hồi quy danh mục 20/phân công 40/công khai 21; 14 bước backend/SQL thật và bất biến SQL qua, dữ liệu thử còn 0. Thử đảo điều kiện thời gian trong bản sao làm test thất bại đúng dự kiến, mã gốc không đổi. Bài live dùng production preview để tránh EBUSY dependency cache Windows. Báo cáo: docs/admin-prices-ui.md.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-quản-lý-tài-khoản"></a>
##### Admin quản lý tài khoản

1. Taste preserve 3/2/6: giữ AdminLayout và tokens, bảng tài khoản phân trang, tạo nhân viên, xác nhận khóa/mở khóa; ADMIN chỉ đọc.
2. Dùng ba API auth hiện có, không thêm filter server/detail/reset password ngoài hợp đồng. Dùng schema riêng chấp nhận ACTIVE/LOCKED, không nới schema session ACTIVE.
3. Test trước cho body allowlist, mật khẩu, chống nâng quyền, giữ đích trạng thái, đọc lại đúng trang trước xác nhận/ghi; CSRF, khóa ghi lặp và kết quả chưa rõ. Sau ghi cập nhật danh sách nhân viên phân công.
4. Chrome production preview với HTTP mô phỏng, responsive/axe; backend/SQL thật bằng tài khoản tổng hợp riêng, xác minh khóa phiên và dọn dữ liệu; rà soát và báo cáo.

Hoàn tất ngày 24/10/2026: 332 test/32 tệp, lint/build/format qua; Chrome tài khoản 23, hồi quy phân công 40 và bảng giá 21; backend/SQL thật 14 bước với ba cookie jar riêng, xác minh khóa phiên và bcrypt, tài khoản thử còn 0. Mutation đảo guard ADMIN trong bản sao thất bại đúng dự kiến, mã gốc không đổi. Báo cáo: docs/admin-accounts-ui.md.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-xử-lý-yêu-cầu-hủy-và-đổi-lịch"></a>
##### Admin xử lý yêu cầu hủy và đổi lịch

1. Taste preserve 3/2/6, giữ AdminLayout/tokens: danh sách lọc trạng thái/phân trang URL, chi tiết lý do và lịch cũ/mới, quyết định/ghi chú/xác nhận; trạng thái đã chốt chỉ đọc.
2. Dùng contract OrderChangeController/Service/Requests; đồng bộ requestVersion và version đơn, không tự thay version khi gửi. Duyệt EN_ROUTE reschedule về CONFIRMED và bỏ collector; reject giữ lịch/trạng thái, vẫn tăng version.
3. Test trước cho quyền/terminal/đề xuất quá hạn/định danh, response và CAS; CSRF, chống ghi lặp, phục hồi 400/404/409/chưa rõ kết quả, cache đúng phiên.
4. Chrome mock responsive/axe, luồng backend/SQL thật với dữ liệu riêng, kiểm tra lịch/phân công/audit/version và dọn; hồi quy, README/báo cáo.

Hoàn tất ngày 25/10/2026: 364 test/34 tệp, lint/build qua; Chrome yêu cầu 23, hồi quy khách 27 và phân công 40; 13 bước backend/SQL thật với năm quyết định, xác minh slot/collector/request-version/order-version/audit rồi dọn dữ liệu. Đã tách SQL đồ án sang 1435 theo mục tiêu người dùng phê duyệt, giữ instance khác trên1433/1434; cập nhật profile Windows và script live. Mutation version trong bản sao bị test bắt, mã gốc không đổi. Hướng dẫn: docs/admin-order-changes-ui.md.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-xử-lý-khiếu-nại"></a>
##### Admin xử lý khiếu nại

1. Taste preserve 3/2/6: mở rộng AdminLayout, giữ tokens/font/icon. Bảng khiếu nại lọc trạng thái/phân trang URL, chi tiết lý do/ảnh/trạng thái đơn; form kết luận và xác nhận riêng. Không thêm thư viện hoặc thay layout giới thiệu.
2. Dùng DisputeController/Service/Requests, SPEC-disputes và OpenAPI hiện có. OPEN → IN_REVIEW; OPEN/IN_REVIEW → RESOLVED/REJECTED, phục hồi previousOrderStatus, giữ tiền/biên nhận. Tiếp nhận chỉ gửi version; kết luận gửi version và resolution bắt buộc tối đa 1000 ký tự. Không có disputeVersion/reviewedBy trong contract.
3. Test trước cho trạng thái/định danh/version/actor/kết luận và phản hồi API. Đọc chi tiết mới cùng đơn trước khi quyết định, dùng đúng version đã xem; chống ghi lặp, khóa 400/404/409/kết quả không rõ và tải lại trước khi tiếp tục. Cache riêng theo phiên admin; ảnh chỉ đường dẫn backend được phép.
4. Unit/component, Chrome responsive/sáng-tối/axe/lỗi; luồng backend+SQL thật với dữ liệu tổng hợp, kiểm tra audit/khôi phục/tiền không đổi và dọn. Hồi quy, rà soát và cập nhật README/báo cáo.

Hoàn tất ngày 25/10/2026: 400 test/36 tệp, lint/build qua; Chrome khiếu nại 21, hồi quy khách 27 và yêu cầu hủy/đổi lịch 23. Backend/SQL thật qua 15 kiểm tra với sáu quyết định UI, bốn khiếu nại trên hai đơn thử; audit/version/phục hồi ARRIVED hoặc COMPLETED, ảnh, kết luận khách và bất biến tiền/biên nhận đều đúng. Đã dọn dữ liệu và ảnh thử. Mutation guard version trong bản sao bị test bắt, nguồn gốc không đổi. Hướng dẫn: docs/admin-disputes-ui.md.

<a id="doc-frontend-vcoi-tasks-plan-md--admin-thống-kê-theo-kỳ"></a>
##### Admin thống kê theo kỳ

1. Taste preserve 3/2/6, giữ AdminLayout và tokens: bộ ngày Việt Nam, kỳ nhanh tháng/quý/năm, bốn chỉ số và phân bố trạng thái; bảng phân trang theo vật liệu/nhân viên. Đây là dashboard nghiệp vụ, kết hợp frontend-ui-engineering, không thêm thư viện hoặc biểu đồ xu hướng chưa có API.
2. Contract AdminReportController/Service/ReportPeriod và SPEC-admin-reports: GET overview/materials/collectors; khoảng [from,to), 1–366 ngày. UI chọn đến hết ngày và chuyển sang to exclusive. Đơn/tỷ lệ theo createdAt, tiền/kg theo paidAt; tiền là chi thu mua; khiếu nại sau hoàn tất vẫn giữ số liệu đã chi.
3. Test trước ngày/biên/múi giờ, response/rounding/miền số an toàn, lịch sử snapshot và quyền. Cache theo phiên/kỳ/nhóm/trang, không hiển thị kỳ cũ dưới nhãn mới, lỗi không biến thành số 0. Dữ liệu breakdown chỉ là trang hiện tại, không cộng làm tổng.
4. Kiểm thử UI/API, Chrome responsive/sáng-tối/axe/lỗi, luồng SQL thật với dữ liệu riêng và đối chiếu tổng trước/sau/biên ngày; dọn đúng dữ liệu thử, rà soát và cập nhật hướng dẫn.

Hoàn tất ngày 25/10/2026: 437 test/38 tệp, lint/build qua; Chrome thống kê 22, hồi quy phân công 40 và khiếu nại 21. Backend/SQL thật qua 15 kiểm tra, đối chiếu độc lập tổng quan và mọi trang vật liệu/nhân viên trước/sau dữ liệu thử, kiểm tra hai kỳ ngày Việt Nam. Ba đơn thử gồm hai khoản chi, cân điều chỉnh và khiếu nại sau thanh toán giữ đúng 7,5 kg, không cộng đơn unpaid hoặc nhân tiền theo item; dữ liệu đã dọn. Mutation mốc ngày cuối bị test phát hiện trong bản sao, mã gốc giữ nguyên. Lighthouse cục bộ 87/100/100 (Performance/Accessibility/Best Practices), LCP 0,62 s, CLS 0,02. Hướng dẫn: docs/admin-reports-ui.md.

<!-- source-end:doc-frontend-vcoi-tasks-plan-md -->

<a id="doc-frontend-vcoi-tasks-todo-md"></a>
### Frontend VCoi/tasks/todo.md

Nguồn trước khi gộp: `Frontend VCoi/tasks/todo.md`.

<!-- source-begin:doc-frontend-vcoi-tasks-todo-md -->
- [x] API client, CSRF và validator có kiểm thử.
- [x] Đăng ký, đăng nhập, phiên và guard theo vai trò.
- [x] Workspace và đọc đơn theo vai trò.
- [x] Đặt lịch, xem lại, xác nhận và xử lý kết quả không chắc chắn.
- [x] Kiểm tra tích hợp thật 16 ca + SQL, luồng mô phỏng 55 ca, hồi quy và tài liệu.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-xác-nhận-và-phân-công"></a>
##### Admin xác nhận và phân công

- [x] Contract, test và API client.
- [x] Panel thao tác, nhân viên, trạng thái và phục hồi lỗi.
- [x] Kiểm tra unit/component, browser, tích hợp thật và tài liệu.

<a id="doc-frontend-vcoi-tasks-todo-md--thiết-kế-lại-quản-trị-theo-pcmaker"></a>
##### Thiết kế lại quản trị theo PCMaker

- [x] Shell topbar/sidebar riêng và bảng đơn theo phong cách tham khảo.
- [x] Bộ lọc, số liệu thật và cache sau xử lý.
- [x] Kiểm tra giao diện mới, chức năng cũ và xác minh dự án tham khảo không đổi.
- [x] Tách đăng nhập, đăng ký, khách và nhân viên khỏi trang giới thiệu; hướng dẫn layout cho các trang thêm sau.

<a id="doc-frontend-vcoi-tasks-todo-md--nhân-viên-di-chuyển"></a>
##### Nhân viên di chuyển

- [x] Đối chiếu API start-trip/arrive và viết test cho ranh giới request/response.
- [x] Panel tiến độ theo phong cách VCoi, ghi chú, khóa thao tác và đọc lại sau lỗi.
- [x] Unit/component, browser responsive/axe và luồng thật tới ARRIVED; đối chiếu SQL và dọn dữ liệu thử.
- [x] Cập nhật README và báo cáo chức năng.

<a id="doc-frontend-vcoi-tasks-todo-md--nhân-viên-cân-thực-tế"></a>
##### Nhân viên cân thực tế

- [x] Contract cân lần đầu/cân lại, quy tắc kg và test ranh giới.
- [x] Form theo vật liệu, preview net, lịch sử, lý do điều chỉnh và đồng bộ version.
- [x] Browser nhiều vật liệu, lỗi, responsive/axe; sửa và kiểm tra panel không lặp sau lưu.
- [x] Luồng thật đến cân điều chỉnh, xác minh hai phiếu/version/audit trong SQL và dọn dữ liệu thử.
- [x] README và tài liệu sử dụng/kiểm tra.

<a id="doc-frontend-vcoi-tasks-todo-md--nhân-viên-gửi-báo-giá"></a>
##### Nhân viên gửi báo giá

- [x] Đối chiếu API gửi/đọc báo giá, quy tắc hết hạn và làm tròn VND.
- [x] Xem trước từ phiếu cân mới nhất và giá hiện hành; gửi version, hiển thị kết quả chính thức/lịch sử.
- [x] Khóa gửi lặp, phục hồi lỗi, bảo vệ phiên và cache khi cân đồng thời.
- [x] Unit/UI/API, Chrome responsive/axe, luồng thật đến báo giá và bất biến SQL; dọn dữ liệu thử.
- [x] README và báo cáo sử dụng/kiểm tra.

<a id="doc-frontend-vcoi-tasks-todo-md--hoàn-thiện-khách-hàng"></a>
##### Hoàn thiện khách hàng

- [x] Đọc/xem lại/chấp thuận/từ chối báo giá và kiểm tra trạng thái, phiên, version, tiền.
- [x] Hồ sơ, đổi mật khẩu và đăng nhập lại; địa chỉ thêm/sửa/xóa/mặc định.
- [x] Đặt lịch bằng địa chỉ lưu sẵn; điều hướng đến các trang mới.
- [x] Timeline, cân/ảnh, thanh toán chỉ đọc và biên nhận.
- [x] Đổi lịch, yêu cầu hủy/đổi lịch và rút yêu cầu theo quy tắc backend.
- [x] Tải ảnh vật liệu, xem ảnh đúng quyền; mở/xem khiếu nại và kết luận.
- [x] Hồi quy, Chrome responsive/axe, luồng thật và SQL; dọn dữ liệu thử, README/báo cáo.

<a id="doc-frontend-vcoi-tasks-todo-md--nhân-viên-thanh-toán-mô-phỏng"></a>
##### Nhân viên thanh toán mô phỏng

- [x] Contract/test API và schema thanh toán dùng chung.
- [x] Form xem lại/phương thức/xác nhận, kết quả và phục hồi lỗi an toàn.
- [x] Chrome responsive/axe, unit và hồi quy; luồng thật qua UI, đối chiếu SQL/dọn dữ liệu thử.
- [x] README và báo cáo chức năng/kiểm tra.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-danh-mục-và-vật-liệu"></a>
##### Admin danh mục và vật liệu

- [x] Schema/API/test theo hợp đồng hiện có.
- [x] Trang danh mục và vật liệu, bộ lọc/phân trang, form và xác nhận trạng thái.
- [x] Khóa ghi lặp/đọc lại, bảo vệ phiên và đồng bộ dữ liệu công khai.
- [x] Chrome responsive/axe, hồi quy và luồng backend/SQL thật; dọn dữ liệu thử.
- [x] README và báo cáo sử dụng/kiểm tra.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-quản-lý-bảng-giá"></a>
##### Admin quản lý bảng giá

- [x] Contract/model/API và test trước.
- [x] Trang bảng giá, form nháp, chi tiết/duyệt/từ chối, lịch sử và menu.
- [x] Bảo vệ phiên, ghi một lần và đọc lại khi có xung đột.
- [x] Unit, Chrome responsive/axe, hồi quy và SQL thật/dọn dữ liệu.
- [x] Rà soát, thử độ nhạy test, README và báo cáo.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-quản-lý-tài-khoản"></a>
##### Admin quản lý tài khoản

- [x] Schema/API và test ranh giới trước.
- [x] Trang danh sách, tạo nhân viên và xác nhận khóa/mở khóa, menu.
- [x] Bảo vệ ADMIN/phiên, khóa ghi và đồng bộ nhân viên phân công.
- [x] Unit, Chrome responsive/axe, SQL thật và dọn dữ liệu thử.
- [x] Rà soát, mutation check, README và báo cáo.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-xử-lý-yêu-cầu-hủy-và-đổi-lịch"></a>
##### Admin xử lý yêu cầu hủy và đổi lịch

- [x] Đối chiếu contract và test model/API trước.
- [x] Danh sách, bộ lọc, chi tiết và quyết định/xác nhận theo Taste.
- [x] Version/CAS, bảo vệ phiên, đồng bộ cache và phục hồi lỗi.
- [x] Chrome responsive/axe, hồi quy, backend/SQL thật và dọn dữ liệu.
- [x] Rà soát, mutation check và cập nhật hướng dẫn.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-xử-lý-khiếu-nại"></a>
##### Admin xử lý khiếu nại

- [x] Đối chiếu hợp đồng và test model/API trước.
- [x] Danh sách, lọc/phân trang, chi tiết/ảnh và tiếp nhận/kết luận/xác nhận.
- [x] Version, quyền/phiên, khóa ghi và phục hồi lỗi; đồng bộ cache.
- [x] Unit, Chrome responsive/axe, hồi quy và backend/SQL thật/dọn dữ liệu.
- [x] Rà soát và cập nhật hướng dẫn/báo cáo.

<a id="doc-frontend-vcoi-tasks-todo-md--admin-thống-kê-theo-kỳ"></a>
##### Admin thống kê theo kỳ

- [x] Đối chiếu contract và test ngày/model/API trước.
- [x] Bộ kỳ, số liệu, phân bố trạng thái, bảng chi tiết, route/menu theo Taste.
- [x] Cache theo phiên/kỳ, lỗi/rỗng/tải và đồng bộ bộ lọc URL.
- [x] Unit, Chrome responsive/axe, hồi quy, backend/SQL thật và dọn dữ liệu.
- [x] Rà soát, mutation check và báo cáo/hướng dẫn.

<!-- source-end:doc-frontend-vcoi-tasks-todo-md -->

---

<a id="group-don-dep"></a>
## Lịch sử dọn dẹp dự án

<a id="doc-bao-cao-don-dep-2026-10-25-md"></a>
### Dọn tệp không dùng trong backend và frontend VCoi

Nguồn trước khi gộp: `BAO_CAO_DON_DEP_2026-10-25.md`.

<!-- source-begin:doc-bao-cao-don-dep-2026-10-25-md -->
<a id="doc-bao-cao-don-dep-2026-10-25-md--dọn-tệp-không-dùng-trong-backend-và-frontend-vcoi"></a>
#### Dọn tệp không dùng trong backend và frontend VCoi

Thực hiện ngày 25/10/2026 theo yêu cầu chuyển tệp dư sang D:\Vcoi1.

Thư mục lưu: D:\Vcoi1\Cleanup-20261025-104757. Cấu trúc đường dẫn của hai dự án được giữ nguyên bên trong.

| Dự án | Tệp đã chuyển | Dung lượng |
|---|---:|---:|
| ecothugom-backend | 234 | 6,74 MiB |
| Frontend VCoi | 848 | 67,42 MiB |
| Tổng | 1.082 | 74,16 MiB |

Các tệp được chuyển gồm cache, ảnh chụp và kết quả kiểm thử cũ của frontend; log backend; báo cáo Surefire được sinh tự động; bản sao script trong sandbox kiểm thử; ảnh render kiểm tra tài liệu; hai Java probe độc lập; SQL thử tạm; thông báo cổng SQL cũ; JAR trung gian .original; log của lần khởi động thất bại và HELP.md mặc định do Spring Initializr sinh ra.

Hai tệp .cache/reopen-frontend.log và .cache/reopen-frontend-error.log còn đang được tiến trình frontend giữ nên được giữ tại dự án. Đã dọn 158 thư mục tạm rỗng sau khi chuyển tệp.

Kết quả rà tham chiếu:

- Cả 178 tệp frontend dùng cho ứng dụng đều có đường import từ src/main.jsx, gồm các trang tải động và CSS; không có import tương đối bị thiếu.
- Các tài nguyên trong public đều có tham chiếu; robots.txt được giữ theo quy ước phục vụ web.
- Đã rà 96 tệp Java chính theo tham chiếu và các điểm vào tự động của Spring; chưa có class nào đủ căn cứ để chuyển khỏi mã nguồn.
- Giữ mã nguồn, test, fixture, script kiểm thử tái sử dụng, tài liệu API, các đặc tả, báo cáo Word, dependency, cấu hình chạy, DLL xác thực SQL, thông tin khôi phục cổng SQL và các JAR chạy được.

Kiểm tra sau khi chuyển:

- SHA-256 của 487 tệp nguồn/cấu hình/tài liệu và tệp chạy được bảo vệ không thay đổi.
- Mỗi tệp chuyển có SHA-256 đối chiếu lại tại nơi lưu.
- http://127.0.0.1:5173/quan-tri/bang-gia: HTTP 200.
- http://127.0.0.1:5173/api/prices/current: HTTP 200, xác nhận frontend vẫn chuyển tiếp được API.
- http://127.0.0.1:8080/api/auth/csrf: HTTP 200.
- Không chạy lại bộ test hoặc build vì lượt dọn này không thay đổi mã nguồn, cấu hình hay script vận hành.

manifest.json trong thư mục lưu ghi đường dẫn gốc (source), đường dẫn lưu (destination), lý do, kích thước, SHA-256 và trạng thái của từng tệp. Chỉ các mục có status: moved đã được chuyển. Có thể dùng danh sách này để khôi phục đúng vị trí; cần kiểm tra tệp mới tại vị trí gốc trước khi khôi phục để tránh ghi đè.

## Cập nhật giao diện, rà soát và lưu trữ kiểm thử ngày 26/10/2026

### Giao diện và báo cáo quản trị

- Thanh điều hướng công khai được căn lại; khu vực tài khoản dùng biểu tượng người dùng; đăng xuất đồng kích thước với nút về website. Thêm chuyển động khi đổi sáng/tối, chỉnh footer và animation trang quản trị.
- Trang chủ bỏ caption nổi trên ảnh, kéo ảnh hero cao hơn và trình bày bốn bước quy trình theo hàng ngang có hình minh họa, số thứ tự đặt dưới ảnh.
- Thống kê thay phần phân bố trạng thái bằng biểu đồ cột tiền đã chi mua theo vật liệu và biểu đồ tròn tỷ trọng khối lượng vật liệu; hỗ trợ xuất CSV và XLSX. Báo cáo hiện gọi khoản chi mua, không gọi doanh thu bán hàng vì mô hình đại lý lưu tiền trả cho người bán.
- Các dòng trợ giúp mà người dùng yêu cầu bỏ đã được xóa khỏi admin, bảng giá và footer công khai.

### Phần nghiệp vụ còn có thể bổ sung

- Admin chưa có quyết định từ chối riêng cho đơn PENDING ngoài luồng hủy/đổi lịch; cần lý do và timeline nếu thêm.
- Chưa có cách loại một loại vật liệu khỏi kết quả cân/báo giá của một đơn trong khi vẫn giữ lịch sử và lý do.
- Giờ hoạt động và vùng phục vụ của đại lý chưa cấu hình trong hệ thống; đặt lịch hiện kiểm tra ngày giờ hợp lệ nhưng không giới hạn theo ca làm hoặc địa bàn.
- Khôi phục mật khẩu và thông báo trạng thái là mở rộng tùy tiêu chí đồ án.

### Lưu trữ bộ kiểm thử

Đã chuyển 160 tệp sang `D:\Vcoi1\EcoThuGom-Test-Archive-20261026`, giữ nguyên đường dẫn tương đối: 57 test frontend, thiết lập test frontend, 64 script/fixture frontend, 32 test backend và 6 script xác minh backend. Manifest SHA-256 xác nhận đủ 160 tệp. Các test và fixture không còn trong mã nguồn bàn giao.

Đã gỡ lệnh test và cấu hình setup khỏi frontend; `npm run check` hiện chạy lint và build. Các script vận hành tạo database, migrate và đóng gói vẫn ở dự án. Bộ tạo database tự kiểm tra fingerprint schema, dấu phiên bản, bảng chính, 5 tài khoản DEMO và 8 đơn DEMO. Script migration giữ đối chiếu fingerprint đầy đủ nhưng không còn phụ thuộc file verifier đã lưu trữ. Gói demo không đóng gói test hoặc fixture.

### Xác minh lượt này

- `npm run lint`: đạt. Kiểm tra Prettier cho `package.json` và `vite.config.js`: đạt.
- Cú pháp PowerShell của ba script đã sửa: đạt. Câu truy vấn fingerprint trong script tạo database và migration khớp với verifier gốc đã lưu trữ.
- SHA-256 của 160 tệp trong archive: khớp manifest. Không chạy bộ test vì các tệp đã được chuyển theo yêu cầu.
- Build frontend chưa xác minh được: Vite không nạp được native binding Tailwind trên máy này và gặp `spawn EPERM`. Lần đóng gói Maven trước đó cũng dừng ở quyền truy cập khóa cache `C:\Users\HP\.m2\repository\.locks`, trước khi biên dịch. Các script SQL mới chưa chạy trên SQL Server trong lượt này.

Các đường dẫn .cache, log .local và báo cáo Surefire trong tài liệu xác minh cũ phản ánh vị trí tại thời điểm kiểm thử. Bản lịch sử của chúng hiện nằm ở thư mục lưu trên; những lần kiểm thử tiếp theo sẽ tạo lại đầu ra tại dự án.

<!-- source-end:doc-bao-cao-don-dep-2026-10-25-md -->

