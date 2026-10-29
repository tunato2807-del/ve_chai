# 21 — Thiết kế CI và tự động hóa kiểm chứng VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: thiết kế pipeline, **chưa tạo workflow hay bật triển khai tự động**.

Nguồn skill: [ci-cd-and-automation/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/ci-cd-and-automation/SKILL.md).
Mã nguồn: `2c804bc8090dee4dcdb2ca150404c534ce35f669`; liên quan [V07–V10](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Hiện trạng được xác nhận

- Commit nguồn không chứa `.github/workflows`; chưa kiểm tra CI ngoài kho hoặc branch protection trên GitHub.
- [package.json:10](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/Frontend%20VCoi/package.json#L10) chỉ có dev/build/preview/lint/format/format:check/check.
  `check` là lint rồi build; có dependency Vitest/Testing Library nhưng chưa có script hoặc nguồn test.
- [pom.xml](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/ecothugom-backend/pom.xml) có dependency test và Surefire, checkout không có `src/test`.
  Audit ngày 29/10 Maven verify đạt nhưng báo `No tests to run`.
- Frontend dùng JavaScript, React 19.3.1/Vite 8.3.5/npm; backend Spring Boot 4.1.1, Java 21, SQL Server.
  Không chép gate `tsc --noEmit`, Prisma hoặc PostgreSQL từ ví dụ skill vào dự án này.

## Pipeline đề xuất theo từng lớp

| Job dự kiến             | Thư mục làm việc         | Nội dung và điều kiện đạt                                                                |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `frontend-quality`      | `Frontend VCoi`          | Cài từ lockfile theo chính sách lifecycle, lint, test được khôi phục, build, audit.      |
| `backend-quality`       | `ecothugom-backend`      | JDK 21 đầy đủ, Maven Wrapper, unit/service test, verify, báo cáo số test.                |
| `sqlserver-integration` | Backend và fixture riêng | DB SQL Server tạm, schema thật, test cạnh tranh/constraint/snapshot; không dùng DB thật. |
| `browser-smoke`         | Frontend và backend thử  | Ba vai trò, cookie/CSRF, luồng cân–quote–chi mô phỏng, quyền ảnh, navigation.            |
| `docs-links`            | Gốc                      | Đường dẫn/lệnh hiện hành và liên kết nội bộ; không giả định ứng dụng đã được sửa.        |

Chạy frontend/backend độc lập để phản hồi sớm, nhưng job triển khai sau này chỉ phụ thuộc các gate bắt buộc đã đạt.
Mỗi gate test phải kiểm tra số test phát hiện >0; đừng dùng `--passWithNoTests`, bỏ test hay `continue-on-error` để làm xanh.
SQL Server integration là điều kiện cho các thay đổi phụ thuộc khóa/filtered indexes, V03/V04 và khoản chi đồng thời.
H2 có thể làm test nhanh; nhãn kết quả phải cho biết engine và không thay thế bằng chứng SQL Server.

## Lệnh hiện có và phần cần bổ sung

Lệnh sau có trong checkout; đây là khung để triển khai CI sau khi rà soát chính sách cài:

```bash
# Chạy trong Frontend VCoi
npm ci --ignore-scripts
npm run lint
npm run build
npm audit --package-lock-only --json

# Chạy trong ecothugom-backend với JDK 21 đầy đủ
sh ./mvnw -B -ntp verify
```

`npm audit` JSON cần được đọc và áp dụng chính sách severity/reachability, không bỏ qua exit code vô điều kiện.
`npm run test:ci`, `test:integration` hay `test:e2e` là **tên đề xuất cho tương lai, chưa tồn tại**.
Thêm runner/config/fixture và script tương ứng trong cùng PR khôi phục V07 trước khi đưa các lệnh đó vào workflow.
Với Maven, đề xuất bật `-DfailIfNoTests=true` cho suite bắt buộc; checkout hiện tại sẽ lộ khoảng trống thay vì được coi là đã có test.
Nếu chọn Failsafe cho integration, phải thêm cấu hình và kiểm tra cả tình huống không phát hiện integration test.
Không dùng workaround compiler của máy audit thiếu `ct.sym` làm chuẩn CI; dùng bản JDK đầy đủ, không sửa POM để che lỗi môi trường.

## Cài tái lập và bảo vệ chuỗi cung ứng

1. Chốt Node/npm phù hợp engines; Node 24.19.0/npm 11.9.0 là bộ đã chạy audit, không phải file pin đã thêm vào dự án.
   Dùng cache lockfile đúng `Frontend VCoi/package-lock.json`; cache download npm/Maven, không cache `node_modules` tùy tiện.
2. Giữ `npm ci --ignore-scripts` làm bootstrap; rà mã lifecycle chính xác trước khi cho phép chạy.
   Ghi chính sách chặn/allow cần thiết theo npm đã pin, kiểm tra clean install; không bật toàn bộ scripts để xử lý nhanh lỗi build.
3. Commit lockfile có thẩm quyền; CI không chạy install làm tự viết lại dependency graph.
   Rà dependency cập nhật theo reachability ở cả runtime/build/test; không `audit fix --force` tự động.
4. Pin GitHub Actions bằng commit SHA đã rà soát và pin image/service đủ để tái lập.
   Workflow chỉ cần `contents: read` cho kiểm tra; tránh `pull_request_target` chạy mã PR không tin cậy với secret.
5. Dùng DB thử cô lập, credential sinh riêng/CI secret; không đưa production secret vào job.
   Không upload cookie, password, dump thật hoặc log body chứa PII làm artifact.

## Trigger, thất bại và mở rộng CD

- Dự kiến chạy khi `pull_request` và push vào `main` ở kho phân phối `tunato2807-del/ve_chai`.
- Đặt timeout, hủy lượt cũ cùng PR và lưu Surefire/JUnit/browser trace phù hợp khi thất bại, có thời hạn lưu.
- Path filter docs-only có thể bỏ job ứng dụng khi chắc không liên quan; required check vẫn phải cho kết quả rõ ràng.
- Chứng minh pipeline đỏ bằng một lint lỗi và một test hồi quy lỗi trong PR thử, rồi khôi phục trước merge.
- Required checks/approval là thiết lập kho cần xác minh và cấu hình riêng; tạo YAML chưa tự bật bảo vệ nhánh.
- Chưa có căn cứ chọn Vercel/Netlify hay nền tảng khác; không thêm provider/secret hoặc auto-deploy trong gói tài liệu.
- CD sau này cần staging, HTTPS/profile phù hợp, artifact gắn commit, kiểm tra smoke và rollback tương thích schema.
  Dữ liệu/ảnh bền vững không được bị thay bằng build mới; rollback code không đồng nghĩa rollback giao dịch.
- Mục tiêu vòng phản hồi nhanh dưới khoảng 10 phút là đề xuất; đo thời gian từng job trước khi tối ưu cache/shard.
  Không đưa test cạnh tranh bắt buộc sang lịch đêm chỉ để PR xanh nhanh.

## Tiêu chí nghiệm thu

- [ ] Clone mới chạy được suite có số test >0 ở cả frontend/backend; lint/build/audit có kết quả được đọc.
- [ ] Workflow thật đã chạy trên PR và main, lỗi bắt buộc làm đỏ và được required checks chặn khi cấu hình đó đã bật.
- [ ] Job SQL Server thử được constraint và race; job browser thử cookie/CSRF và ba vai trò.
- [ ] Lockfile không đổi sau CI; lifecycle scripts có chính sách rõ; không rò secret qua artifact.
- [ ] Báo cáo tên job, commit, engine DB, số test và thời gian thực; chưa chạy phải ghi chưa chạy.
- [ ] Nếu có CD về sau, staging/rollback được diễn tập; hiện tại không có tuyên bố đã triển khai.

## Phụ thuộc và bàn giao

V07 trước gate test; [18](18-security-and-hardening.md) cho lifecycle/audit,
[20](20-git-workflow-and-versioning.md) cho phạm vi PR, [22](22-deprecation-and-migration.md) cho rollback schema.

> Khôi phục test V07 rồi đề xuất workflow CI đúng hai thư mục dự án VCOI.
> Chốt Node/npm/JDK, chặn dependency scripts chưa rà soát và làm fail khi suite bắt buộc trống.
> Nộp kết quả PR thật và test cố ý thất bại; tách việc cấu hình branch protection/CD khỏi việc viết YAML.
