# Kịch bản báo cáo VCoi — Đồ án Thương mại điện tử

5 slide, tổng thời lượng gợi ý **160 giây (2 phút 40 giây)**. Điền tên nhóm, lớp và giảng viên ở slide 1. Đây là báo cáo hệ thống C2B một đại lý; thanh toán hiện là mô phỏng.

| Slide | Nội dung | Thời lượng |
|---|---|---|
| 1 | Giới thiệu tổng quan | 25 giây |
| 2 | Các phân hệ và nghiệp vụ | 40 giây |
| 3 | Kiến trúc và luồng giao dịch | 40 giây |
| 4 | Thiết kế cơ sở dữ liệu | 25 giây |
| 5 | Kết quả và hướng phát triển | 30 giây |

## Slide 1 — Giới thiệu tổng quan

Kính chào thầy cô. Nhóm chúng em giới thiệu VCoi, hệ thống thu mua ve chai trực tuyến cho một đại lý. Dự án được trình bày theo mô hình C2B: cá nhân bán vật liệu và đại lý là bên thu mua. Mục tiêu là giúp khách chủ động đặt lịch, đồng thời theo dõi rõ khối lượng, đơn giá và kết quả giao dịch.

**Lưu ý:** Điền tên nhóm, lớp và giảng viên trước khi trình bày. C2B là cách phân loại theo chiều giao dịch thực tế của dự án, không phải mô hình bán lẻ cho khách mua sản phẩm.

## Slide 2 — Các phân hệ và nghiệp vụ

Hệ thống có ba vai trò. Khách hàng xem vật liệu được nhận mua, đặt lịch và theo dõi đơn. Nhân viên nhận lịch được phân công, tới nơi cân thực tế rồi lập báo giá. Quản trị viên quản lý vật liệu, bảng giá, điều phối nhân viên và xem thống kê khoản chi. Điểm đặc thù của giao dịch này là tiền được chốt sau khi cân, thay vì cố định lúc đặt lịch. Khách được xem và chấp thuận báo giá trước khi hoàn tất thu mua. Hệ thống còn lưu lịch sử và biên nhận để các bên đối chiếu.

**Lưu ý:** Không giới thiệu giỏ hàng, voucher, tồn kho bán lẻ, VNPay, MoMo hoặc API giao hàng vì chưa có các tính năng đó trong mã nguồn. Thống kê là tiền đại lý đã chi thu mua, không gọi nhầm là doanh thu bán hàng.

## Slide 3 — Kiến trúc và luồng giao dịch

Về kiến trúc, React và Vite xây dựng giao diện; Spring Boot cung cấp API và xử lý nghiệp vụ; SQL Server lưu dữ liệu. Các yêu cầu ghi dùng phiên đăng nhập và CSRF. Luồng chính bắt đầu khi khách đặt lịch, quản trị phân công và nhân viên đến cân. Nhân viên gửi báo giá dựa trên khối lượng thực tế, khách chấp thuận rồi nhân viên mới ghi nhận khoản chi. Số tiền lấy từ báo giá đã duyệt. Bản đồ án hiện mô phỏng tiền mặt hoặc chuyển khoản, chưa gọi cổng thanh toán hay phát sinh tiền thật.

**Lưu ý:** Các khối là kiến trúc sản phẩm đọc từ mã. Ảnh chạy thử trong bộ slide dùng backend thật với H2 tạm để có dữ liệu minh họa, không phải bằng chứng đã kiểm thử SQL Server đầy đủ.

## Slide 4 — Thiết kế cơ sở dữ liệu

ERD rút gọn nối người dùng với đơn thu gom, rồi tới các dòng vật liệu, phiếu cân, báo giá và khoản chi. Một đơn có nhiều vật liệu và có thể có nhiều phiên bản báo giá. Khóa ngoại giúp giữ quan hệ giữa các bản ghi. Version hỗ trợ từ chối thao tác trên bản đơn cũ; ràng buộc dữ liệu giới hạn một khoản chi hoàn tất cho mỗi đơn. Các bảng và snapshot giúp giữ lại thông tin đã chốt để đối chiếu.

**Lưu ý:** Sơ đồ chỉ vẽ một số khóa ngoại, không phải ERD đầy đủ. Các bảng địa chỉ, danh mục, giá, khiếu nại và audit được lược bớt. Chỉ mô tả cơ chế trong code/schema; chưa tuyên bố kiểm chứng mọi race trên SQL Server.

## Slide 5 — Kết quả và hướng phát triển

Kết quả là giao diện cho khách, nhân viên và quản trị cùng các bước đặt lịch, báo giá, ghi nhận khoản chi và biên nhận. Đây là ảnh chụp ứng dụng đang chạy với dữ liệu giả lập; nhóm không dùng tỷ lệ phần trăm để suy đoán mức hoàn thiện. Hướng tiếp theo là bổ sung kiểm thử hồi quy đầy đủ, kiểm chứng trên SQL Server thực và tích hợp thanh toán thật khi đáp ứng yêu cầu an toàn. Nhóm xin kết thúc và mời thầy cô xem phần demo hoặc đặt câu hỏi.

**Lưu ý:** Tổng thời gian gợi ý năm slide: 160 giây, khoảng 2 phút 40 giây. Không dùng số đơn/tỷ lệ trong ảnh demo làm số liệu kinh doanh thực tế. Có thể chuyển sang demo đặt lịch hoặc mở biên nhận sau khi thuyết trình.

## Nguồn và phạm vi

Mã nguồn: https://github.com/1250080247-cloud/VCOI, commit `2c804bc8090dee4dcdb2ca150404c534ce35f669`.

Ảnh giao diện chụp từ frontend thật và backend thật với dữ liệu giả lập trên H2 tạm. Kiến trúc sản phẩm đọc từ code/schema dùng SQL Server. Sơ đồ kiến trúc, luồng và ERD trong PowerPoint là các hình/khối chỉnh sửa được; ERD đã lược bớt bảng và quan hệ phụ. Không có số liệu doanh thu, phần trăm hoàn thiện hoặc tích hợp VNPay/MoMo được tự thêm vào slide.
