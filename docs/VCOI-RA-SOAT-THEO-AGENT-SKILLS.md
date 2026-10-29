# VCoi / EcoThuGom — Những hạng mục cần sửa theo Agent Skills

Ngày rà soát: **29/10/2026**. Dự án nguồn: [1250080247-cloud/VCOI](https://github.com/1250080247-cloud/VCOI).

Phiên bản được kiểm tra: `2c804bc8090dee4dcdb2ca150404c534ce35f669`, là HEAD của nhánh `main` tại thời điểm lấy mã. Bản sao trong `tunato2807-del/ve_chai` có cùng nội dung mã nguồn này. Các liên kết mã bên dưới được cố định theo commit để số dòng không thay đổi khi dự án được cập nhật.

Đây là báo cáo rà soát và kế hoạch sửa, **chưa triển khai các sửa đổi**. Phạm vi bao gồm backend Spring Boot/SQL Server, frontend React/Vite, hợp đồng API, luồng thêm/sửa/xóa, bảo mật, kiểm thử và tài liệu. Thanh toán trong dự án là **mô phỏng**, chưa phải giao dịch ngân hàng thực tế.

## 1. Cách áp dụng `addyosmani/agent-skills`

Tham chiếu bộ hướng dẫn tại commit `eb07f19f52c2669f2364897aaa293e2aaddd7b1c` của [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c).

| Skill đã đọc và đối chiếu | Áp dụng vào VCoi |
|---|---|
| [code-review-and-quality](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/code-review-and-quality/SKILL.md) | Rà soát tính đúng đắn, khả năng đọc, kiến trúc, bảo mật và hiệu năng; đưa bằng chứng trước khi kết luận. |
| [security-and-hardening](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/security-and-hardening/SKILL.md) | Kiểm tra phiên, phân quyền tài nguyên, đầu vào, ảnh riêng tư, dependency và dữ liệu cá nhân. |
| [api-and-interface-design](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/api-and-interface-design/SKILL.md) | Đối chiếu giới hạn dữ liệu frontend/backend, version, retry và tính nhất quán của báo cáo. |
| [ci-cd-and-automation](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/ci-cd-and-automation/SKILL.md) | Xác định các bước kiểm tra đang thiếu trong repository và đề xuất kiểm tra tự động trước khi merge. |
| [documentation-and-adrs](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/documentation-and-adrs/SKILL.md) | Tách hướng dẫn hiện hành khỏi lịch sử, ghi rõ quyết định nghiệp vụ và điều kiện nghiệm thu. |

Không áp dụng máy móc mọi ví dụ trong bộ skill: dự án dùng SQL Server, session cookie và JavaScript nên không đề xuất đổi database, chuyển sang JWT, thêm TypeScript hay thêm DELETE cho đủ CRUD. Không sao chép `AGENTS.md` của kho skill sang dự án; file đó hướng dẫn phát triển chính kho `agent-skills`.

## 2. Kết quả kiểm chứng và giới hạn

| Kiểm tra thực hiện trong lượt này | Kết quả | Ý nghĩa |
|---|---|---|
| Đối chiếu checkout với commit nguồn | 382 tệp nguồn được giữ nguyên; bản sao có thêm PowerPoint | Không rà soát nhầm một phiên bản đã sửa khác. |
| Cài frontend từ lockfile | `npm ci --ignore-scripts` thành công, dùng cache có quyền ghi | Không sửa dependency hay lockfile; không thực thi lifecycle script của dependency khi cài. |
| Frontend `npm run check` | Lint và build thành công | Lệnh này hiện **không chạy test nghiệp vụ**. |
| Backend Maven `verify` | Biên dịch và đóng gói JAR thành công; `No tests to run` | Build thành công không chứng minh nghiệp vụ đã được kiểm thử. |
| Bộ kiểm tra HTTP bổ sung bên ngoài mã dự án | 142/142 phép đối chiếu cho kết quả script dự kiến | Có các ca cố ý xác nhận hành vi lỗi còn tồn tại; không được hiểu là 142 chức năng đều đúng. |
| Bộ kiểm tra frontend bổ sung bên ngoài mã dự án | 17/17 phép đối chiếu | Gồm kiểm tra validator, tính toán và phản hồi API mô phỏng bị lệch tổng. |
| `npm audit --package-lock-only --json` | 0 advisory được báo, gồm 0 high/critical | Chỉ phản ánh các lỗ hổng đã biết trong cơ sở dữ liệu advisory tại thời điểm chạy; chưa audit dependency Maven. |
| Nguồn test và CI trong commit | Không có `src/test`, tệp `*.test.*`/`*.spec.*` hay `.github/workflows` | Xác nhận khoảng trống kiểm thử và quy trình tự động ở V07–V08. |

**Môi trường và giới hạn:** Node 24.19.0, npm 11.9.0, Java 21.0.12.1, Maven 3.10.0. Java trong môi trường kiểm tra thiếu `ct.sym`, nên Maven dùng `-Dmaven.compiler.release= -Dmaven.compiler.source=21 -Dmaven.compiler.target=21`; không sửa POM. Không coi đây là lỗi build của dự án trên JDK đầy đủ.

Các request HTTP gọi backend thật với cookie phiên/CSRF, dữ liệu giả lập và **H2 2.4.240 ở chế độ MSSQLServer**. Schema tạm giữ các ràng buộc thông thường, nhưng không mô phỏng đầy đủ filtered indexes, khóa, phantom reads hay deadlock của SQL Server. Một số DEFAULT timestamp và identity đã được điều chỉnh riêng cho H2; không thay schema dự án. Các lần điều chỉnh cấu hình H2 để chạy bộ kiểm tra không được tính là lỗi ứng dụng.

Chưa chạy SQL Server thực, E2E trình duyệt trong lượt này, GPS/Valhalla thật, kiểm thử tải, khôi phục backup hay mở XLSX bằng Excel. Chưa có kết luận về hiệu năng thực tế hoặc độ an toàn của một máy chủ đang triển khai. Không gọi các số liệu kiểm thử cũ trong README là kết quả kiểm thử mới.

## 3. Danh sách ưu tiên

Mức ưu tiên ở đây là **thứ tự xử lý đề xuất**, không phải thang điểm CVSS:

- **P1:** cần hoàn thành trước khi dựa vào quy trình phát hành để phục vụ người dùng thực.
- **P2:** ảnh hưởng tính nhất quán, xử lý ngoại lệ hoặc khả năng vận hành; sửa theo phạm vi sử dụng.
- **P3:** trường hợp biên hoặc nâng cấp sau các việc trên.

| Mã | Hạng mục | Ưu tiên | Tính chất và mức kiểm chứng |
|---|---|---|---|
| V01 | Thu hồi phiên sau khóa rồi mở khóa tài khoản | P2 | Khoảng trống thu hồi phiên; tái hiện qua HTTP. |
| V02 | Bàn giao đơn khi nhân viên phụ trách bị khóa | P2 | Thiếu luồng ngoại lệ nghiệp vụ; tái hiện tại ARRIVED. |
| V03 | Chống ghi đè khi lưu biểu mẫu cũ | P2 | Hạn chế thiết kế; tái hiện ở danh mục, đọc mã các nơi tương tự. |
| V04 | Báo cáo và file xuất dùng chung ảnh chụp dữ liệu | P2 | Rủi ro nhất quán; xác nhận frontend chấp nhận phản hồi lệch tổng. |
| V05 | Kiểm tra tổng độ dài địa chỉ ngay khi lưu | P3 | Lệch hợp đồng backend; tái hiện qua HTTP. |
| V06 | Thống nhất kiểu và giới hạn tiền | P3 | Lệch hợp đồng frontend/backend; tái hiện. |
| V07 | Đưa test/fixture trở lại Git | P1 | Khoảng trống kiểm chứng, xác nhận từ cây mã và Maven. |
| V08 | Bổ sung CI kiểm tra PR và nhánh main | P2 | Chưa có workflow trong repository. |
| V09 | Chỉnh README và hướng dẫn chạy lại | P2 | Tài liệu chứa lệnh/script không có trong checkout. |
| V10 | Tách cấu hình phát triển và triển khai thực tế | P2 khi triển khai | Điều kiện vận hành, chưa phải lỗi của bản chạy localhost. |
| V11 | Audit sự kiện tài khoản và theo dõi vận hành | P2 khi triển khai | Thiếu trong mã ứng dụng đã đọc; chưa xác minh log của hạ tầng bên ngoài. |
| V12 | Backup, khôi phục và vòng đời dữ liệu/ảnh | P2 khi dùng dữ liệu thật | Thiếu cơ chế/chính sách trong checkout; chưa kiểm tra hệ thống backup bên ngoài. |
| V13 | Hoàn thiện điểm xuất phát và dịch vụ bản đồ | P3 khi dùng thực tế | Giới hạn demo được mã nguồn và giao diện ghi rõ. |

## 4. Chi tiết từng hạng mục

### V01 — Khóa rồi mở khóa có thể giữ lại phiên cũ

**Vị trí:** [AccountService.java:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119), [AccountSessionFilter.java:19](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountSessionFilter.java#L19), [SessionPrincipal.java:12](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/SessionPrincipal.java#L12).

**Kịch bản đã tái hiện:** nhân viên đăng nhập → admin chuyển LOCKED → không có request từ phiên đó trong thời gian khóa → admin mở ACTIVE → cookie cũ gọi `/api/auth/me` vẫn nhận 200.

**Nguyên nhân/tác động:** filter chỉ hủy phiên khi nhìn thấy trạng thái khóa. Credential stamp phụ thuộc password hash, không đổi khi khóa/mở. Nếu khóa nhằm thu hồi phiên trên thiết bị cũ, việc mở khóa có thể phục hồi quyền của cookie đó. Request gửi trong lúc tài khoản còn LOCKED vẫn bị chặn đúng; chưa có bằng chứng vượt quyền khi đang khóa.

**Hướng sửa:** bổ sung `sessionVersion` hoặc mốc thu hồi phiên riêng, cập nhật khi khóa/thu hồi và đối chiếu trên mỗi request. Ghi rõ chính sách này trong API; không chỉ dùng `updatedAt` chung vì sửa hồ sơ không nhất thiết phải đăng xuất mọi thiết bị.

**Nghiệm thu:** phiên cũ nhận 401 sau chuỗi khóa–mở không có request xen giữa; áp dụng cho nhiều phiên; đăng nhập mới hoạt động; sửa tên/email không thu hồi phiên ngoài chủ đích.

### V02 — Đơn thiếu đường bàn giao khi nhân viên bị khóa sau khi đến nơi

**Vị trí:** [AccountService.java:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119), [OrderChangeService.java:38](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/OrderChangeService.java#L38).

**Kịch bản đã tái hiện:** đưa đơn tới ARRIVED → khóa nhân viên → nhân viên nhận 401 → admin phân công người khác nhận 409 vì `reassign` chỉ nhận ASSIGNED. Không có cách tiếp tục bằng nhân viên khác trong khi vẫn giữ người cũ bị khóa. Vẫn có các lựa chọn khác như mở khóa người cũ hoặc xử lý yêu cầu hủy hợp lệ; không phải đơn mất vĩnh viễn.

**Hướng sửa:** thiết kế nghiệp vụ bàn giao ngoại lệ theo từng giai đoạn. Trước khi khóa, hiển thị đơn đang phụ trách. Quy định rõ giữ số cân, minh chứng, báo giá đã chấp thuận, lịch và trách nhiệm ghi khoản chi. Không mở tự do mọi trạng thái cho endpoint `reassign` hiện có.

**Nghiệm thu:** có cách xử lý đơn đang EN_ROUTE/ARRIVED/AWAITING_SELLER_APPROVAL/AWAITING_PAYMENT khi người phụ trách không thể làm tiếp; người nhận mới phải ACTIVE, không xung đột lịch; version cũ bị từ chối; lưu lý do/người bàn giao; quyền người cũ bị thu hồi đúng.

### V03 — Biểu mẫu cũ có thể ghi đè sửa đổi mới

**Vị trí:** [AdminCatalogService.java:28](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminCatalogService.java#L28), [AdminCatalogService.java:54](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminCatalogService.java#L54), [CustomerAddressService.java:49](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L49), [AccountService.java:86](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L86).

**Kịch bản đã tái hiện ở danh mục:** A và B đọc cùng một bản → A sửa mô tả → B đổi tên nhưng gửi lại mô tả cũ → backend trả 200 và mất nội dung A vừa lưu.

**Nguyên nhân:** khóa dòng ngăn hai lần ghi chạy cùng lúc, nhưng không biết client đang sửa từ bản đã cũ. Các API trên chưa có `expectedVersion`/revision. Đây là hạn chế của chính sách ghi sau thắng hiện tại; không mô tả nó như vi phạm một hợp đồng chống ghi đè đã có. Khóa dòng tài khoản hiện tại đã bảo vệ việc ghi đè giữa các transaction backend; vấn đề này nằm ở biểu mẫu client cũ.

**Hướng sửa:** nếu cần chống mất chỉnh sửa, bổ sung version/revision và điều kiện UPDATE tương ứng; trả 409 khi bản đã cũ; frontend yêu cầu xem lại hoặc hợp nhất có chủ đích. Tham khảo cách đơn hàng và bảng giá đang kiểm tra version/revision.

**Nghiệm thu:** hai tab sửa cùng bản không âm thầm mất nội dung; sửa thông tin giữ nguyên trạng thái ẩn/ngừng; xử lý đúng cả sửa–sửa, sửa–đổi trạng thái, sửa–xóa địa chỉ.

### V04 — Tổng quan, chi tiết và file báo cáo có thể lệch nhau

**Vị trí:** [useAdminReports.js:9](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/useAdminReports.js#L9), [reports-api.js:66](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/reports-api.js#L66), [AdminReportsPage.jsx:28](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/pages/AdminReportsPage.jsx#L28), [AdminReportService.java:12](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/reports/AdminReportService.java#L12).

**Bằng chứng:** tổng quan, bảng theo trang và toàn bộ vật liệu được lấy bằng những request độc lập. Bộ kiểm tra frontend đã cung cấp overview 44.000 VND và chi tiết 48.000 VND; cả hai phản hồi đều được các hàm đọc chấp nhận. Điều kiện mở nút xuất file chỉ kiểm tra query thành công và không tải, chưa đối chiếu tổng hay snapshot.

**Tác động:** có khoản thanh toán mới giữa hai request thì báo cáo có thể trộn hai thời điểm. Kiểm tra `totalElements` không bắt được trường hợp tổng số nhóm không đổi. Ngoài ra, `REPEATABLE_READ` trên SQL Server không tự tạo ảnh chụp dữ liệu và không loại trừ mọi phantom insert; cần kiểm chứng sự nhất quán cả giữa các SELECT trong một request. Phần này là rủi ro từ thiết kế/isolation, chưa tái hiện cạnh tranh trên SQL Server thật.

**Hướng sửa:** ưu tiên endpoint báo cáo/export trả toàn bộ phần cần đối chiếu từ một snapshot được bảo đảm ở database, hoặc cơ chế snapshot token chung qua nhiều request. Chỉ gom request vào một endpoint hoặc thêm giờ tạo báo cáo chưa đủ nếu các SELECT vẫn đọc khác thời điểm. Cân nhắc SNAPSHOT transaction sau khi đánh giá cấu hình SQL Server, hoặc một truy vấn/materialized dataset nhất quán. Không tự bật cấu hình database trong bước sửa frontend.

**Nghiệm thu:** có giao dịch thanh toán đồng thời vẫn bảo đảm tổng tiền/khối lượng khớp giữa overview, biểu đồ và CSV/XLSX; các trang cùng tập dữ liệu. Không cộng số đơn của từng vật liệu để suy ra tổng số đơn vì một đơn chứa nhiều vật liệu. Trước mắt có thể chặn xuất và yêu cầu tải lại khi đối chiếu tổng bị lệch.

### V05 — Lưu được địa chỉ nhưng không đặt lịch bằng địa chỉ đó được

**Vị trí:** [CreateCollectionOrderRequest.java:20](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CreateCollectionOrderRequest.java#L20), [CustomerAddressService.java:34](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L34), [CustomerOrderService.java:43](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerOrderService.java#L43), [account-api.js:17](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/customer/account-api.js#L17).

**Kịch bản đã tái hiện:** `addressLine` 300 ký tự, `ward`/`district`/`province` mỗi trường 100 ký tự. Từng trường đúng giới hạn, POST địa chỉ trả 201. Sau khi ghép dấu `, `, tổng là **606 ký tự**, nên đặt lịch bằng `addressId` trả 400 vì snapshot chỉ nhận tối đa 600.

**Hướng sửa:** dùng chung quy tắc chuẩn hóa và kiểm tra tổng địa chỉ ở backend cho thêm/sửa địa chỉ và đặt lịch. Frontend đã có kiểm tra tổng này; vẫn phải thực thi tại API để client khác không tạo dữ liệu khó sử dụng. Kiểm tra và hướng dẫn chỉnh các bản ghi cũ vượt giới hạn nếu đã tồn tại.

**Nghiệm thu:** thêm/sửa từ chối ngay địa chỉ vượt giới hạn với lỗi dễ hiểu; kiểm tra 599/600/601 ký tự sau chuẩn hóa và ghép dấu; đặt lịch dùng địa chỉ hợp lệ; sửa/xóa địa chỉ nguồn không thay snapshot của đơn cũ.

### V06 — Backend nhận số tiền frontend không biểu diễn an toàn

**Vị trí:** [AdminPriceRequests.java:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/catalog/AdminPriceRequests.java#L10), [prices-model.js:4](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/admin/prices-model.js#L4), [model.js:20](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/orders/model.js#L20), [quotation-model.js:18](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/orders/quotation-model.js#L18).

**Kịch bản đã tái hiện:** gửi `unitPrice = 10000000000000000` qua API được 201; phản hồi không qua schema frontend. Backend cho tới 18 chữ số nguyên; frontend giới hạn `Number.MAX_SAFE_INTEGER = 9007199254740991`.

**Tác động:** đây là dữ liệu biên lớn, form hiện tại đã ngăn nhập. Tuy nhiên, dữ liệu tạo qua API khác vẫn có thể làm màn hình từ chối phản hồi. Cũng cần xét tổng nhiều dòng, tiền báo giá, thanh toán và tổng báo cáo, không chỉ đơn giá.

**Hướng sửa:** chốt hợp đồng tiền VND xuyên suốt. Có thể dùng giới hạn nghiệp vụ thực tế thấp hơn ngưỡng số nguyên an toàn, đồng thời kiểm tra mọi phép tính tổng; hoặc truyền tiền dạng chuỗi thập phân và xử lý chính xác ở frontend. Nếu đổi kiểu API, cập nhật DTO, schema, tài liệu và client cùng nhau.

**Nghiệm thu:** kiểm tra ngay dưới/đúng/trên giới hạn, tổng nhiều dòng, làm tròn HALF_UP và tổng báo cáo lớn; dữ liệu hợp lệ backend phải được frontend đọc đúng, không làm tròn âm thầm.

### V07 — Test và fixture không còn trong repository

**Vị trí:** [README.md:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7), [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10), [pom.xml](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml).

**Bằng chứng:** README xác nhận test/fixture/script kiểm tra được chuyển sang `D:\Vcoi1\EcoThuGom-Test-Archive-20261026`. Checkout không chứa nguồn test; Maven báo `No tests to run`; `npm run check` chỉ lint/build dù đã khai báo Vitest và Testing Library.

**Hướng sửa:** khôi phục test, fixture và cấu hình chạy vào Git. Chỉ loại bỏ dữ liệu thật, credential, cache và kết quả sinh ra; việc không đưa test vào bundle sản phẩm không đòi hỏi xóa test khỏi repository. Các script bổ sung của lượt audit này không thay thế bộ test chính thức đã bị chuyển đi.

**Nghiệm thu:** clone mới có thể chạy test frontend và backend, có số test được phát hiện lớn hơn 0. Ưu tiên V01–V06, ownership, version/revision, cân điều chỉnh, giá đã chấp thuận, khoản chi trùng, địa chỉ mặc định. Test phải bắt được hành vi sai, không chỉ xác nhận hàm mock được gọi.

### V08 — Chưa có CI để kiểm tra thay đổi

**Bằng chứng:** commit nguồn không chứa `.github/workflows`. Chưa kiểm tra cấu hình CI ngoài repository hoặc quy tắc bảo vệ nhánh trên GitHub, nên không kết luận các hệ thống bên ngoài chắc chắn không tồn tại.

**Hướng sửa:** thêm workflow cho PR và push vào `main`, chạy đúng working directory của hai dự án. Dùng `npm ci`, phiên bản Node/npm và JDK được chốt; lint → test → build; backend kiểm thử bằng Maven Wrapper. Sau V07, cấu hình fail khi suite cần thiết không tìm thấy test. Bổ sung integration job SQL Server cho nghiệp vụ cần khóa/filtered index; không coi H2 là bằng chứng thay thế đầy đủ.

**Nghiệm thu:** PR cố ý làm sai một quy tắc nghiệp vụ hoặc lint phải đỏ; lockfile không bị tự viết lại; lưu báo cáo khi thất bại; bật required checks nếu chính sách kho yêu cầu. Audit dependency cần có đánh giá phạm vi ảnh hưởng, không chạy `audit fix --force` tự động. Không thêm `tsc` như một bước bắt buộc khi dự án chưa dùng TypeScript.

### V09 — README trộn hướng dẫn hiện hành và lệnh kiểm thử đã mất

**Vị trí:** [README.md:7](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L7), [README.md:60](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/README.md#L60), [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10).

**Bằng chứng:** README dài 4.534 dòng, gồm nhiều ghi chú lịch sử. Chẳng hạn `npm run test:dossier`, `npm run test:navigation`, `scripts/verify-live-dossier.ps1` còn xuất hiện nhưng không có trong checkout hiện tại. Phần đầu đã cảnh báo việc lưu trữ test; vẫn khó tìm một bộ lệnh có thể chạy trọn vẹn từ clone mới.

**Hướng sửa:** giữ README ngắn với kiến trúc, yêu cầu môi trường, khởi tạo database, tạo admin, khởi chạy và các lệnh đang tồn tại. Chuyển nhật ký sang `docs/history/`, hợp đồng API sang tài liệu theo module, ghi ngày/phạm vi cho số liệu cũ. Đồng bộ hướng dẫn với V07; không xóa lịch sử quyết định quan trọng. Ghi ADR cho chính sách bàn giao, chống ghi đè và snapshot báo cáo khi chốt phương án.

**Nghiệm thu:** một người dùng clone mới chạy theo hướng dẫn hiện hành không cần file từ Desktop của tác giả; mọi đường dẫn/lệnh được đánh dấu rõ là hiện hành hoặc lịch sử; các script được dẫn trong phần hiện hành có thật.

### V10 — Cần cấu hình triển khai riêng trước khi đưa lên Internet

**Vị trí:** [application.properties:2](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application.properties#L2), [application-windows.properties:2](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application-windows.properties#L2), [application-sqlserver.properties](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application-sqlserver.properties), [AuthRateLimitFilter.java:12](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AuthRateLimitFilter.java#L12), [vite.config.js:21](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/vite.config.js#L21).

**Điều kiện áp dụng:** chạy localhost trên một backend theo hướng dẫn hiện tại là hợp lý. Rủi ro xuất hiện khi dùng nguyên cấu hình phát triển để phục vụ bên ngoài: mặc định chọn profile Windows, profile này cho cookie `Secure=false` và tin chứng chỉ SQL Server nội bộ. Session/rate limit hiện ở RAM của một tiến trình. Đây chưa phải bằng chứng một hệ thống đang triển khai bị cấu hình sai.

**Hướng sửa:** bổ sung hướng dẫn/profile triển khai bắt buộc chọn rõ; HTTPS cùng origin qua reverse proxy, cookie Secure, database account ít quyền và kiểm tra chứng chỉ. Phục vụ `dist` bằng máy chủ phù hợp; không dùng Vite dev server làm cấu hình vận hành. Kiểm tra header tại cả HTML frontend và API: CSP trên API không tự bảo vệ tài liệu HTML do máy chủ khác phục vụ. Nếu chạy nhiều instance, chọn cách chia sẻ session và giới hạn request phù hợp; xác minh IP client từ proxy tin cậy để tránh gộp toàn bộ người dùng vào một IP.

**Nghiệm thu:** kiểm tra từ trình duyệt qua HTTPS, refresh URL sâu, login/logout/CSRF, cookie và CSP tương thích bản đồ/ảnh; test rate limit sau proxy. Nếu chỉ chạy một instance, tài liệu phải ghi rõ phiên mất khi restart; không bắt buộc thêm Redis khi chưa có nhu cầu nhiều instance.

### V11 — Thiếu audit tài khoản và dữ liệu theo dõi sự cố

**Vị trí:** [AdminUserController.java:24](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AdminUserController.java#L24), [AccountService.java:119](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AccountService.java#L119), [AuthController.java:39](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/auth/AuthController.java#L39).

**Bằng chứng/phạm vi:** đơn hàng đã có `order_status_logs`. Riêng API khóa/mở chỉ truyền ID tài khoản đích và trạng thái vào service, không truyền người quản trị thực hiện và không ghi audit nghiệp vụ tài khoản trong luồng này. Mã cũng chưa có cơ chế request ID/metrics ứng dụng riêng để theo dõi đăng nhập thất bại, 429, lỗi lưu ảnh hay độ trễ định tuyến. Log sẵn có của framework không tương đương nhật ký thay đổi tài khoản.

**Hướng sửa:** bổ sung audit có actor, target ID, hành động, trạng thái trước/sau, thời điểm và kết quả cho thao tác nhạy cảm. Có correlation ID và các chỉ số đủ phục vụ xử lý sự cố. Tránh ghi password, hash, cookie, CSRF, toàn bộ body hoặc tọa độ/địa chỉ không cần thiết. Quyền đọc và thời gian giữ audit phải được xác định.

**Nghiệm thu:** biết ai đã khóa/mở tài khoản nào và khi nào; truy vết được một request lỗi; các ca đăng nhập sai không làm lộ credential trong log; không nhân đôi audit khi transaction thất bại. Chọn công cụ theo nhu cầu, không bắt buộc tích hợp một dịch vụ bên ngoài chỉ để đạt checklist.

### V12 — Cần chính sách và kiểm thử backup/khôi phục dữ liệu riêng tư

**Vị trí:** [EvidenceStorage.java:21](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/EvidenceStorage.java#L21), [EvidenceStorage.java:53](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/EvidenceStorage.java#L53), [CustomerAddressService.java:68](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/orders/CustomerAddressService.java#L68).

**Bằng chứng/phạm vi:** ảnh nằm trên filesystem `.local/evidence`; database chỉ giữ URL. Code có dọn ảnh khi transaction rollback, nhưng cơ chế này không chạy nếu tiến trình chết đột ngột. Xóa địa chỉ lưu vẫn chủ đích giữ snapshot liên hệ trên đơn cũ. Trong checkout chưa thấy quy trình khôi phục đồng bộ DB và ảnh, thời hạn giữ dữ liệu, hay quy trình xử lý yêu cầu xuất/xóa dữ liệu cá nhân. Chưa xác minh có quy trình thủ công hoặc hạ tầng thực hiện các việc này bên ngoài repository hay không.

**Hướng sửa:** trước khi dùng dữ liệu thật, xác định loại dữ liệu, mục đích và thời gian lưu; tách việc xóa địa chỉ lưu khỏi xử lý dữ liệu lịch sử. Thiết kế backup/restore gồm cả database và thư mục ảnh. Có đối chiếu ảnh mồ côi với khoảng chờ an toàn, chỉ dọn đúng root và bản ghi đã xác minh, tránh xóa ảnh đang được giao dịch khác sử dụng. Yêu cầu xóa/ẩn danh phải tuân theo chính sách lưu chứng từ áp dụng, không xóa cứng giao dịch đang cần đối soát.

**Nghiệm thu:** khôi phục trên môi trường mới vẫn đọc được ảnh của đúng đơn và giữ phân quyền; thử ngắt tiến trình giữa lưu file và commit; tài liệu chỉ rõ dữ liệu nào còn lưu trong snapshot/backup và thời gian xử lý. Không kết luận vi phạm một quy định pháp lý cụ thể khi chưa xác định nơi vận hành và chính sách.

### V13 — Chỉ đường đang dùng điểm xuất phát cố định cho demo

**Vị trí:** [collector-origin.js:1](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/maps/collector-origin.js#L1), [CollectorDirections.jsx:49](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/src/features/maps/CollectorDirections.jsx#L49), [ValhallaRouteClient.java:26](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/java/com/ecothugom/routing/ValhallaRouteClient.java#L26).

**Hiện trạng:** mọi lần tính đường trong component này dùng tọa độ tạm gần Công viên Tao Đàn; giao diện đã thông báo rõ là điểm minh họa. Không gọi đây là lỗi GPS vì chức năng hiện không tuyên bố dùng vị trí thật của nhân viên.

**Hướng nâng cấp khi vận hành:** cấu hình điểm đại lý hoặc cho nhân viên chủ động chọn vị trí/GPS sau khi đồng ý. Chốt nhà cung cấp bản đồ/định tuyến, giới hạn sử dụng và thông báo luồng chia sẻ tọa độ trước khi dùng địa chỉ thật. Không tự chuyển nhà cung cấp, thu thập GPS nền hay gửi PII sang dịch vụ mới trong một bản sửa giao diện.

**Nghiệm thu:** tuyến đường xuất phát từ nguồn vị trí đã chọn; xử lý từ chối quyền GPS, thiếu vị trí, timeout và 429; đổi người phụ trách phải kiểm tra lại quyền; có cách tiếp tục bằng địa chỉ/số điện thoại khi bản đồ không dùng được. Đây là nâng cấp tùy mục tiêu, không chặn thuyết trình bản demo hiện tại.

## 5. Đối chiếu thêm, sửa, xóa và xử lý từng phần

Bảng này kết hợp đọc mã và các ca chạy bổ sung; **không khẳng định đã kiểm thử mọi tổ hợp** trong từng module.

| Phần | Thêm/tạo | Sửa/xử lý | Xóa/ngừng | Việc cần xử lý hoặc kiểm chứng tiếp |
|---|---|---|---|---|
| Đăng ký, đăng nhập | Khách tự đăng ký; admin tạo COLLECTOR | Đổi mật khẩu, khóa/mở | Logout, thu hồi phiên | V01, V07, V11; thêm ca đăng nhập cạnh tranh với đổi mật khẩu. |
| Hồ sơ | Thông tin lúc đăng ký | Sửa tên/email | Xóa email tùy chọn | V03; không cho client sửa role/phone qua profile. |
| Danh mục | Tạo tên duy nhất | Sửa thông tin, đổi trạng thái | Ẩn thay DELETE | V03; test tạo trùng đồng thời trên SQL Server. |
| Vật liệu | Tạo theo danh mục/tên/hạng, đơn vị KG | Sửa thông tin, ngừng/nhận lại | Không xóa cứng lịch sử | V03; giữ logic trạng thái và dữ liệu đơn cũ khi sửa danh mục. |
| Bảng giá | Tạo DRAFT | Sửa/duyệt/từ chối theo revision | Không sửa giá đã duyệt tùy ý | V06; thêm test hiệu lực chồng thời gian và thao tác cạnh tranh. |
| Địa chỉ | Thêm, tối đa 100 | Sửa, chọn mặc định | DELETE, chọn mặc định thay thế | V03, V05; test 100/101 địa chỉ, sửa/xóa đồng thời và snapshot đơn cũ. |
| Đặt lịch | Tạo PENDING cùng dòng vật liệu | Đổi lịch theo giai đoạn | Hủy qua yêu cầu admin | V05–V07; xem thêm hợp đồng idempotency ở phần 7. |
| Điều phối | Xác nhận/gán nhân viên | Gán lại trước khởi hành | Thu hồi phân công trong nhánh đổi lịch cho phép | V02; giữ kiểm tra ACTIVE, lịch trùng, ownership và version. |
| Khởi hành/đến nơi | Chuyển trạng thái đúng thứ tự | ASSIGNED → EN_ROUTE → ARRIVED | Không xóa lịch sử trạng thái | V02, V07; test mọi chuyển trạng thái trái phép. |
| Cân | Tạo phiếu cân | Điều chỉnh bằng bản mới có lý do | Không ghi đè/xóa phiếu đã dùng | V07; test điều chỉnh cạnh tranh, cân sai đơn và phiếu đã nằm trong quote. |
| Báo giá | Tạo từ cân và giá hợp lệ | Gửi, từ chối, chấp thuận, thay phiên bản | Giữ phiên bản cũ | V06–V07; test hết hạn 24 giờ bằng clock điều khiển được. |
| Thanh toán | Nhân viên ghi khoản chi mô phỏng | Hoàn tất theo quote ACCEPTED | Không sửa/xóa giao dịch đã chốt | V06–V07; test hai request đồng thời trên SQL Server, timeout sau commit. |
| Minh chứng | Ảnh vật liệu/phiếu cân theo quyền | Mỗi slot theo điều kiện nghiệp vụ | Giữ lịch sử, dọn rollback | V12; test file hỏng, quá kích thước, I/O lỗi, crash và quyền xem ảnh. |
| Hủy/đổi lịch | Tạo yêu cầu | Rút, duyệt, từ chối | Giữ yêu cầu lịch sử | V02, V07; test duyệt đồng thời với chuyển trạng thái đơn. |
| Khiếu nại | Mở khi đủ điều kiện | Tiếp nhận, giải quyết/từ chối | Kết luận cuối không sửa tự do | V07; giữ khoản chi đã ghi nhận, không tự thêm hoàn tiền ngoài phạm vi. |
| Timeline/biên nhận | Sinh từ sự kiện/giao dịch | Đọc/in theo quyền | Không DELETE | V07, V11; test phân trang và biên nhận của đơn đã thanh toán đang khiếu nại. |
| Thống kê/export | Tổng hợp dữ liệu nghiệp vụ | Lọc kỳ, nhóm, phân trang | Không xóa giao dịch từ báo cáo | V04, V06–V08; xác minh file Excel và tổng dữ liệu lớn. |
| Bản đồ | Lưu điểm thu gom tùy chọn | Chọn điểm/tính đường | Bỏ vị trí tùy chọn | V13; kiểm thử nhà cung cấp thật và quyền truy cập sau phân công lại. |

## 6. Những quyết định hiện tại nên giữ

- **Giữ mô hình một đại lý thu mua:** khách bán vật liệu và nhận tiền; không tự chuyển thành sàn nhiều người mua hoặc mô hình trả phí thu gom.
- **Giữ session cookie, CSRF và phân quyền theo tài nguyên.** Mã dùng bcrypt cost 12, cookie HttpOnly, xác thực trạng thái tài khoản và kiểm tra chủ đơn/người được giao. Các ca thử ngoài quyền đã bị chặn; V01 là một tình huống thu hồi phiên cụ thể.
- **Giữ soft delete/trạng thái** cho danh mục, vật liệu và tài khoản có lịch sử. Không thêm DELETE hàng loạt để đủ bốn chữ CRUD.
- **Giữ snapshot và lịch sử:** sửa địa chỉ nguồn không đổi đơn cũ; cân điều chỉnh tạo bản mới; báo giá giữ phiên bản; thanh toán lấy số tiền từ quote đã được khách chấp thuận.
- **Giữ bảo vệ giao dịch đã có:** CAS/version của đơn, revision bảng giá, ràng buộc thanh toán và transaction. Các ca thanh toán lặp tuần tự đã bị từ chối; vẫn phải kiểm chứng cạnh tranh trên SQL Server.
- **Giữ xử lý kết quả ghi chưa rõ:** frontend không tự retry mù POST đặt lịch/thanh toán mà yêu cầu đọc lại. Nâng cấp idempotency phải giữ được đặc tính này.
- **Giữ ảnh riêng tư và kiểm tra nội dung:** JPEG/PNG, giới hạn byte/pixel, chuẩn hóa ảnh, quyền đọc theo đơn. Không đổi sang thư mục ảnh công khai để đơn giản hóa giao diện.
- **Giữ cấu trúc module và tải trang lazy hiện tại.** Chưa có đo đạc chứng minh cần đổi framework, thêm state manager hay viết lại toàn bộ.

## 7. Những phần cần kiểm chứng thêm, chưa kết luận là lỗi

1. **SQL Server thật:** race phân công/khóa nhân viên, tạo tên trùng, đổi giá nháp, cập nhật mặc định địa chỉ, thanh toán đồng thời; filtered unique indexes, phantom reads và deadlock. H2 không đủ để phê duyệt các đặc tính này.
2. **Đăng nhập đồng thời với đổi mật khẩu/khóa tài khoản:** kiểm tra khoảng giữa xác thực credential và tạo phiên; chưa có ca kiểm soát lịch thực thi để kết luận về race trong lượt này.
3. **Retry đặt lịch:** `CustomerOrderService.create` chưa có idempotency key. Hợp đồng hiện đã tránh tự retry và cảnh báo kết quả chưa rõ, nên không coi đây là lỗi tạo trùng đã được chứng minh. Nếu cần retry an toàn, dùng key ổn định theo một ý định, claim atomically với unique constraint, gắn hash payload và quy định phản hồi khi request đang xử lý.
4. **Hiệu năng:** đo thời gian truy vấn báo cáo theo kỳ lớn, tải toàn bộ vật liệu để vẽ/export, query plan và bundle trên thiết bị thực trước khi đề xuất cache/index/library mới. Chưa đo p95, nên không gán kết luận “chậm” hay “N+1” cho các luồng chưa có bằng chứng.
5. **Trình duyệt và accessibility:** phục hồi E2E cho ba vai trò; chạy bàn phím, focus sau điều hướng, responsive, screen reader/axe và bản đồ khi mất mạng. Lint/build và kiểm tra schema không thay thế được các bước này.
6. **Dependency backend và chuỗi cung ứng:** audit frontend hiện 0 advisory; chưa có kết quả SCA Maven, quét toàn bộ lịch sử secret hay xác minh provenance mọi package. Không suy rộng thành “dự án không có lỗ hổng”.
7. **Thanh toán thực:** cần một thiết kế khác về gateway, callback, đối soát, idempotency và bảo vệ dữ liệu trước khi tích hợp. Không đổi nhãn mô phỏng thành thanh toán thật khi cơ chế vẫn chỉ ghi database.

## 8. Lộ trình sửa đề xuất và tiêu chí hoàn tất

### Đợt A — Khôi phục khả năng kiểm chứng

- [ ] V07: khôi phục nguồn test/fixture; chạy được từ clone mới và báo số test thực thi.
- [ ] V08: có CI frontend/backend, fail khi thiếu test bắt buộc; bổ sung SQL Server integration theo khả năng môi trường.
- [ ] V09: cập nhật phần hướng dẫn hiện hành, phân biệt rõ kết quả lịch sử.

### Đợt B — Phiên và xử lý ngoại lệ

- [ ] V01: thu hồi được mọi phiên cũ khi khóa/mở theo chính sách đã chốt.
- [ ] V02: thống nhất nghiệp vụ bàn giao, triển khai theo giai đoạn cùng audit và test.
- [ ] V03: chốt phạm vi cần chống ghi đè; bổ sung revision cho các biểu mẫu được chọn.

### Đợt C — Hợp đồng và báo cáo

- [ ] V04: báo cáo/export cùng snapshot; test giao dịch đồng thời trên SQL Server.
- [ ] V05: validator tổng địa chỉ dùng chung cho thêm/sửa/đặt lịch.
- [ ] V06: tiền VND có hợp đồng/giới hạn nhất quán, gồm cả tổng nhiều dòng và báo cáo.

### Đợt D — Trước khi tiếp nhận dữ liệu thật

- [ ] V10: kiểm tra triển khai HTTPS, cookie, proxy, cấu hình database và restart/nhiều instance nếu có.
- [ ] V11: audit tài khoản và theo dõi sự cố đủ dùng, không lộ dữ liệu nhạy cảm.
- [ ] V12: thử backup/restore DB cùng ảnh; có chính sách lưu và xử lý dữ liệu cá nhân.
- [ ] V13: thay điểm demo nếu triển khai chỉ đường thực; kiểm tra chính sách dịch vụ bản đồ.

Mỗi bản sửa nên xử lý một vấn đề, kèm ca hồi quy và bằng chứng chạy. Hoàn tất một mục khi tiêu chí nghiệm thu đạt trên môi trường phù hợp; việc thêm một checkbox, đổi tài liệu hoặc build thành công chưa tự giải quyết lỗi nghiệp vụ.
