# Capability map — kế hoạch sửa VCoi

**DRAFT, 29/10/2026.** Đây là bản phân rã để áp dụng skill, chưa phê duyệt một đợt sửa mã hay migration. Mã nền: `2c804bc8090dee4dcdb2ca150404c534ce35f669`. Không đổi tên nghiệp vụ một đại lý thu mua.

| Module ID ổn định  | Trách nhiệm sửa                                       | Vấn đề liên quan | Phụ thuộc trong kế hoạch                                    |
| ------------------ | ----------------------------------------------------- | ---------------- | ----------------------------------------------------------- |
| verification       | Harness, ca hồi quy, SQL Server integration, CI       | V07–V08          | —                                                           |
| identity           | Chính sách thu hồi phiên khi khóa/mở                  | V01              | verification                                                |
| pickup-address     | Địa chỉ lưu và snapshot dùng chung giới hạn           | V05              | verification                                                |
| edit-concurrency   | Chống lưu biểu mẫu cũ ở phạm vi được chọn             | V03              | verification                                                |
| collector-recovery | Chính sách và luồng bàn giao ngoại lệ                 | V02              | identity, verification                                      |
| reporting-snapshot | Báo cáo/export từ tập dữ liệu nhất quán               | V04              | verification                                                |
| money-contract     | Tiền VND chính xác từ API đến giao diện               | V06              | verification                                                |
| operations         | Audit, telemetry, privacy, backup, cấu hình phát hành | V10–V12          | verification; kiểm tra tương thích các bản sửa đã phát hành |
| docs-handoff       | Hướng dẫn hiện hành, lịch sử, ADR, bộ tài liệu skill  | V09              | —; cập nhật theo từng lát cắt                               |
| maps-readiness     | Điểm xuất phát thực, quyền GPS và nhà cung cấp        | V13              | operations khi dùng dữ liệu thật                            |

## Thứ tự triển khai đề xuất

`verification → pickup-address → identity → edit-concurrency` là đường sửa sớm, ít thay đổi nghiệp vụ hơn. `collector-recovery`, `reporting-snapshot` và `money-contract` cần chốt hợp đồng trước khi viết patch. `docs-handoff` đi cùng mỗi thay đổi. `operations` là điều kiện bổ sung trước pilot thật, không tự trở thành một dự án hạ tầng lớn cho demo.

Phụ thuộc ở đây chỉ mô tả **công việc cải thiện**, không khẳng định các package hiện tại đã có kiến trúc phụ thuộc đúng như bảng. Không có yêu cầu tách microservice hay thêm nhiều repository.

## Hợp đồng cần chốt trước các thay đổi rủi ro

- `identity`: khóa là chặn trong lúc LOCKED hay đồng thời thu hồi toàn bộ phiên cũ? Kế hoạch khuyến nghị có mốc/version thu hồi, nhưng đây vẫn là chính sách cần xác nhận trước patch.
- `collector-recovery`: giai đoạn nào được bàn giao, ai giữ trách nhiệm phiếu cân/báo giá/khoản chi, khách cần được thông báo ra sao?
- `reporting-snapshot`: một tập kết quả có token dùng lại hay endpoint export nguyên khối? Isolation phải được kiểm chứng trên SQL Server thật.
- `money-contract`: giới hạn nghiệp vụ hợp lý hay chuỗi tiền chính xác? Không tùy ý đổi kiểu JSON trong một client đơn lẻ.
- `operations`: mục tiêu demo hay người dùng thật, hosting, retention, người vận hành, SLO/RTO/RPO chưa được chốt.

## Điều kiện chuyển từ bản đồ sang thực hiện

- Mỗi lát cắt có acceptance criteria và ca kiểm tra trong [tasks/todo.md](tasks/todo.md).
- Ghi rõ quyết định nào đã được người dùng giao trong phiên làm việc. Không hỏi lại một phê duyệt đã có; chỉ làm rõ quyết định thực sự còn thiếu trước phần việc phụ thuộc.
- Nếu scope đổi, sửa module map/spec liên quan trước. Không đổi ID module âm thầm hoặc gộp tất cả vào một commit.
- Mọi checkbox chưa có bằng chứng giữ nguyên chưa đạt. Tài liệu của một module không đồng nghĩa module đã được triển khai.
