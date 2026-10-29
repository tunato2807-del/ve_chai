# Mẫu quy ước agent cho VCoi

**Đây là mẫu đề xuất trong gói tài liệu, không phải `AGENTS.md` đang có hiệu lực ở gốc dự án.** Khi áp dụng, hợp nhất với quy ước hiện hữu rồi mới đặt ở gốc; không ghi đè hướng dẫn đang dùng. Bỏ đoạn giới thiệu này sau khi chủ dự án quyết định sử dụng.

## Mô hình nghiệp vụ

- VCoi/EcoThuGom vận hành một đại lý thu mua phế liệu. CUSTOMER bán vật liệu và nhận tiền, ADMIN xác nhận/phân công, COLLECTOR đến cân và ghi khoản chi **mô phỏng**.
- Luồng chuẩn: đặt lịch → xác nhận → phân công → khởi hành → đến nơi → cân → báo giá → khách chấp thuận → khoản chi mô phỏng → hoàn tất; hủy/đổi lịch/khiếu nại theo điều kiện của từng trạng thái.
- Giữ lịch sử cân/báo giá/khoản chi, snapshot địa chỉ/giá, ownership và version. Danh mục/vật liệu/tài khoản có lịch sử dùng trạng thái thay xóa cứng.

## Nơi đọc mã

- `Frontend VCoi/src`: React, JavaScript, Vite; API ở `src/lib/api.js`, schema ở từng feature, dữ liệu riêng tư gắn scope tài khoản/vai trò trong TanStack Query.
- `ecothugom-backend/src/main/java/com/ecothugom`: auth, catalog, orders, reports, routing. Nhiều thao tác dùng JDBC và compare-and-set/version; không mặc định có ORM version cho mọi entity.
- `ecothugom-backend/scripts/sql`: schema SQL Server/dữ liệu mẫu. Không dùng schema H2 tạm làm migration thật.
- `docs/agent-skills-vcoi/README.md`: bộ hướng dẫn 25 skill; `EVIDENCE.md` ghi rõ giới hạn kết quả.

## Trước khi sửa

1. Đọc `AGENTS.md` thực tế và trạng thái Git; không ghi đè công việc đang dở.
2. Xác minh HEAD so với nguồn trong tài liệu, kiểm tra lỗi còn tồn tại; không áp patch cũ chỉ vì trùng tên file.
3. Chọn một module/task, nêu phạm vi, ca sai và tiêu chí hoàn tất. Chỉ nạp các file liên quan cùng hợp đồng provider/consumer.
4. Dùng đúng skill theo công việc. Bao phủ đủ catalog không đòi chạy 25 quy trình cho mỗi dòng sửa.
5. Quyền và quyết định đã được người dùng giao có hiệu lực trong phiên. Không tạo vòng xin xác nhận mới cho đọc mã, viết tài liệu hay sửa thường lệ đã được yêu cầu. Nếu một quyết định nghiệp vụ/schema/chi phí chưa có thực sự cần cho bước tiếp theo, nêu rõ điểm thiếu, hoàn tất việc độc lập và hỏi ngắn gọn.

## Lệnh đang tồn tại

Từ thư mục gốc repository, Bash:

```bash
cd 'Frontend VCoi'
npm ci --ignore-scripts
npm run check
```

Lệnh cài tắt lifecycle script phục vụ bootstrap/kiểm tra chuỗi cung ứng; nếu một dependency cần script, đọc đúng script/phiên bản và có chính sách cho phép hẹp trước khi bật. Không đổi lockfile để làm cài đặt dễ hơn.

Backend, từ thư mục gốc, JDK 21 đầy đủ:

```bash
cd ecothugom-backend
sh ./mvnw -B -ntp verify
```

Trên Windows PowerShell: `cd ecothugom-backend` rồi `.\mvnw.cmd -B -ntp verify`. Chạy database/demo theo script hiện có và cấu hình môi trường thực, không chép đường dẫn ổ D của người khác.

**Chú ý:** tại commit nền, Maven không tìm thấy test và frontend `check` chỉ lint/build. Chưa có `npm test`, `test:dossier` hoặc workflow CI trong checkout. Chỉ dùng lệnh test mới khi đã được thêm và xác minh; không trình bày lệnh đề xuất như lệnh có sẵn.

## Khi viết và kiểm tra

- Với lỗi nghiệp vụ, tạo test kiểm tra hành vi sai, quan sát RED đúng nguyên nhân, sửa ít nhất cần thiết, chạy GREEN và regression liên quan. Không sửa test cho qua khi hợp đồng chưa đổi.
- Kiểm tra đầu vào tại API; frontend không là ranh giới bảo mật. Giữ CSRF/cookie/ownership. Không dùng JWT/localStorage để chữa vấn đề session version.
- Tiền, địa chỉ, version và thời gian phải theo hợp đồng nhất quán backend/frontend/OpenAPI. Không âm thầm chuyển số thập phân sang JS Number hoặc dùng thời gian UTC như giờ địa phương.
- Giữ ảnh riêng tư; không công khai thư mục minh chứng. Không ghi credential/PII/body nguyên vẹn vào log hoặc gửi sang dịch vụ bên ngoài ngoài phạm vi được giao.
- Test trên SQL Server thật cho ràng buộc filtered index, khóa, cạnh tranh giao dịch và snapshot. H2 chỉ là phép kiểm tra bổ sung, không bằng chứng tương đương.
- Với refactor, tách khỏi đổi hành vi và chứng minh kết quả không đổi; không xóa mã vì chỉ tìm chưa thấy người dùng.
- Với hiệu năng, ghi môi trường và baseline trước; ngưỡng đề xuất không là số đã đo.

## Git và dữ liệu

- Kiểm tra remote trước push; `tunato2807-del/ve_chai` và `1250080247-cloud/VCOI` là hai kho khác nhau.
- Commit theo lát cắt, chỉ stage file liên quan; giữ PowerPoint/tài liệu/lịch sử đã có. Không force-push, reset công việc người khác hoặc chạy `push --mirror` để nhập dự án.
- Không commit `.env`, token, mật khẩu, dữ liệu thật, `node_modules`, `target` hoặc kết quả ảnh chứa PII.
- Migration theo expand → backfill → verify → switch → contract khi phù hợp. Không DROP dữ liệu hay restore đè database có giao dịch như một lệnh rollback mặc định.

## Khi báo hoàn tất

Nêu thay đổi, lý do, lệnh đã thực sự chạy, kết quả và giới hạn. Phân biệt build/test/browser/runtime/production. Không đánh dấu “đã bảo mật”, “đã TDD”, “đã deploy”, “đã đọc official docs” hoặc “đã áp dụng hoàn tất 25 workflow” khi chỉ mới tạo tài liệu. Không tự gửi Slack/email hay tích hợp telemetry vì một ví dụ skill có nhắc đến dịch vụ đó.
