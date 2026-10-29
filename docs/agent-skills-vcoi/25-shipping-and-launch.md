# 25 — Shipping and Launch cho VCoi

Nguồn: [shipping-and-launch/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/shipping-and-launch/SKILL.md). Ngày đối chiếu: 29/10/2026.

**Trạng thái:** đã lập cổng phát hành và phương án khôi phục; chưa triển khai ứng dụng, áp dụng migration, cấu hình DNS/HTTPS hay kích hoạt feature flag. Đẩy tài liệu lên GitHub không có nghĩa ứng dụng đã phát hành hoặc được chứng nhận an toàn.

## Hai mục tiêu cần phân biệt

| Mục tiêu                 | Điều kiện phù hợp                                                                                         | Hạn chế cần công bố                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Thuyết trình đồ án/demo  | Môi trường riêng, dữ liệu giả lập, luồng ba vai trò và reset có kiểm soát                                 | Thanh toán mô phỏng; điểm xuất phát chỉ đường tạm; không dùng dữ liệu thật để minh họa. |
| Pilot có người dùng thật | SQL Server đã kiểm thử, dữ liệu/ảnh có backup, HTTPS và cấu hình vận hành đúng, có người chịu trách nhiệm | Chưa tích hợp chuyển tiền thực; không quảng bá độ tin cậy hoặc quy mô chưa đo.          |

Chưa có lựa chọn môi trường pilot, người vận hành hay SLO được chủ dự án xác nhận. Tài liệu này cung cấp điều kiện để quyết định, không tự chọn hosting hoặc chi tiền.

## Bằng chứng hiện có và phần còn thiếu

Xem [EVIDENCE.md](EVIDENCE.md) cho kết quả và môi trường cụ thể. Lint/build frontend và đóng gói backend đã chạy; nguồn test chính thức vẫn bị chuyển ra ngoài repository. Các phép đối chiếu H2 có ca xác nhận lỗi còn tồn tại, không phải dấu chứng nhận mọi nghiệp vụ đúng.

Cấu hình [profile Windows](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/src/main/resources/application-windows.properties#L1) cho môi trường nội bộ; [Vite preview](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/vite.config.js#L21) đang phục vụ kiểm tra cục bộ, chưa là thiết kế máy chủ vận hành. Session RAM/rate limit một instance và thư mục ảnh local phải được tính vào kế hoạch restart/backup.

## Cổng trước phát hành

- [ ] **Đúng nghiệp vụ:** chốt chính sách V01–V06, test hồi quy có nguồn trong Git; không có lỗi đã biết chưa được đánh giá rủi ro/owner.
- [ ] **Kiểm chứng:** chạy unit/integration; luồng ba vai trò và ownership trên SQL Server thật; kiểm tra cạnh tranh ghi khoản chi và snapshot báo cáo.
- [ ] **Bảo mật:** kiểm tra credential, cookie/CSRF, quyền đơn/ảnh, giới hạn request, headers của HTML lẫn API; audit dependency frontend/backend có kết luận theo khả năng ảnh hưởng.
- [ ] **Hiệu năng:** có baseline, ngân sách được chốt và đo trên môi trường đại diện; một lượt Lighthouse localhost không thay dữ liệu người dùng.
- [ ] **Giao diện:** responsive, bàn phím, nhãn lỗi, focus, thông báo chờ/rỗng/lỗi, screen reader và bản đồ khi mất mạng.
- [ ] **Vận hành:** cấu hình explicit, không dùng mật khẩu trong Git; SQL TLS/ít quyền; nơi lưu ảnh bền vững, backup/restore đã thử; có kiểm tra health/readiness không lộ chi tiết nội bộ.
- [ ] **Theo dõi:** có request ID, tín hiệu của [24](24-observability-and-instrumentation.md), dashboard và runbook; owner xác nhận nhận được cảnh báo thử.
- [ ] **Tài liệu:** lệnh chạy đúng checkout, changelog và quyết định migration rõ; nguồn artifact/commit có thể truy ngược.

Không đánh dấu đạt chỉ vì build xanh. V07 thiếu nguồn test là cổng phải xử lý nếu định dựa vào CI để phát hành.

## Rollout đề xuất cho một đại lý

1. **Staging riêng:** SQL Server/ảnh/dữ liệu giả lập tách biệt; chạy regression, backup/restore và smoke test ba vai trò.
2. **Pilot nội bộ:** một nhóm nhân viên và khách thử được chọn rõ; chưa mở đăng ký đại trà. Có người theo dõi và đầu mối hỗ trợ.
3. **Mở rộng theo quan sát:** chỉ tăng phạm vi khi số liệu đủ và không có sự cố tính đúng đắn. Không áp tỷ lệ canary 5%/25% một cách máy móc khi đại lý mới có vài người dùng.
4. **Sau mỗi thay đổi:** quan sát ngay và kiểm tra luồng quan trọng. Ghi mốc 1 giờ, 24 giờ và lần đánh giá tiếp; đây là lịch đề xuất, chưa phải hoạt động đã diễn ra.
5. **Sau ổn định:** dọn feature flag nếu đã dùng, cập nhật runbook từ sự cố. Mỗi flag có owner, hạn dọn, test cả hai trạng thái; không thêm flag cho thay đổi văn bản đơn giản.

Một flag không thể thu hồi khoản chi hay xóa migration đã chạy. Thay đổi liên quan dữ liệu phải có phương án riêng theo [22](22-deprecation-and-migration.md).

## Điều kiện dừng và rollback

| Tín hiệu                                                          | Quyết định                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Đọc được đơn/ảnh sai quyền, ghi khoản chi sai hoặc mất dữ liệu    | Dừng rollout ngay; khóa chức năng liên quan theo runbook, bảo toàn audit, điều tra phạm vi. |
| 5xx/độ trễ vượt ngưỡng và thời gian đã chốt                       | Giữ hoặc quay lại bản ổn định; không lấy ngưỡng ví dụ của skill làm SLO đã được duyệt.      |
| Thiếu log, không khôi phục được ảnh/DB hoặc chưa biết artifact cũ | Chưa phát hành; cần hoàn tất bằng chứng khôi phục trước.                                    |

**Runbook rollback đề xuất:**

1. Ghi lại release ID, thời điểm, triệu chứng và người thực hiện; bảo toàn dữ liệu/sự kiện để đối soát.
2. Tắt đường vào chức năng mới nếu có cơ chế đã thử; dùng bản artifact trước đã lưu và kiểm tra tương thích schema.
3. Giữ dữ liệu mới nếu bản cũ đọc được; không DROP cột/bảng hoặc restore đè database đang có giao dịch như bước rollback mặc định.
4. Với session version, không triển khai lại bản bỏ kiểm tra thu hồi phiên nếu mục tiêu sửa là V01; có thể cần đăng xuất toàn bộ thay vì phục hồi phiên cũ.
5. Kiểm tra health, login, đọc đơn/ảnh, khoản chi và biên nhận bằng dữ liệu thử có marker; không tạo giao dịch thật chỉ để smoke test.
6. Báo lại kết quả qua kênh đã được chủ dự án chỉ định. Tài liệu không tự ủy quyền gửi tin nhắn bên ngoài.

Mục tiêu thời gian khôi phục, mất dữ liệu tối đa chấp nhận được và người quyết định còn **chưa chốt**. Không ghi cam kết “rollback 5 phút” khi chưa diễn tập.

## Error budget

Trước pilot, chọn SLI và cửa sổ SLO từ [05](05-constraint-driven-development.md). Khi đã có số liệu, tính phần ngân sách lỗi còn lại và quy định lúc nào chỉ phát hành thay đổi độ tin cậy. Nếu chưa có traffic/baseline, trạng thái là **chưa đủ dữ liệu**, không phải “100% ngân sách còn lại”. Với V01/V02 sai quyền hoặc đứt luồng, tính đúng đắn có thể yêu cầu dừng ngay kể cả SLO tổng thể còn xanh.

## Nghiệm thu

- [ ] Artifact và commit được ghim; cấu hình của đúng môi trường được kiểm chứng.
- [ ] Checklist trước phát hành có bằng chứng/owner, không có mục đạt giả.
- [ ] Rollback ứng dụng và chiến lược dữ liệu được thử trong staging; bảo toàn khoản chi đã chốt và snapshot lịch sử.
- [ ] Sau phát hành kiểm tra được luồng quan trọng, log và số liệu qua thời gian quan sát đã chốt.
- [ ] Đầu mối hỗ trợ, điều kiện dừng và error budget có thể dùng để ra quyết định thực tế.

Phụ thuộc: [11 TDD](11-test-driven-development.md), [12 trình duyệt](12-browser-testing-with-devtools.md), [18 bảo mật](18-security-and-hardening.md), [19 hiệu năng](19-performance-optimization.md), [21 CI](21-ci-cd-and-automation.md), [22 migration](22-deprecation-and-migration.md), [24 observability](24-observability-and-instrumentation.md).

## Prompt bàn giao

> Chuẩn bị pilot VCoi theo tài liệu này. Lập bảng cổng đạt/chưa đạt kèm bằng chứng cho đúng artifact và SQL Server mục tiêu, chốt owner và diễn tập rollback. Giữ nhãn thanh toán mô phỏng và dữ liệu thử tách biệt. Chỉ triển khai trong phạm vi người dùng đã giao; nếu thiếu một quyết định bắt buộc, hoàn tất phần độc lập rồi nêu đúng điểm cần chốt. Không coi việc push tài liệu là phát hành ứng dụng.
