# Bằng chứng và mức độ áp dụng

Ngày kiểm tra: **29/10/2026**. Dữ liệu giả lập, cổng localhost tạm; các tiến trình phục vụ kiểm tra đã dừng sau khi lấy kết quả. Không có dữ liệu người dùng thật, chuyển tiền thật hoặc thao tác vào database đang vận hành.

## Phiên bản được ghim

| Nguồn                               | Commit                                     |
| ----------------------------------- | ------------------------------------------ |
| `1250080247-cloud/VCOI`, nhánh main | `2c804bc8090dee4dcdb2ca150404c534ce35f669` |
| `addyosmani/agent-skills`           | `eb07f19f52c2669f2364897aaa293e2aaddd7b1c` |

Đã đọc đủ 25 `skills/*/SKILL.md` trong catalog này và đối chiếu các workflow vào bộ tài liệu riêng của VCoi. Đây là **bao phủ phương pháp và tài liệu**, không phải 25 chứng nhận hoàn tất triển khai. Xem trạng thái từng skill ở [README.md](README.md).

## Kết quả có thể kiểm tra lại từ đầu ra

| Phép kiểm tra       | Kết quả                                                                       | Bằng chứng và giới hạn                                                                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nội dung mã nguồn   | 382 tệp nguồn giữ nguyên so với commit gốc                                    | Bản sao có thêm PowerPoint và tài liệu; không có patch ứng dụng trong bộ này.                                                                                                                                                                         |
| Frontend            | Cài từ lockfile với lifecycle scripts tắt; `npm run check` đạt lint/build     | Node 24.19.0, npm 11.9.0. `check` tại commit nền không chạy unit test.                                                                                                                                                                                |
| Backend             | Maven `verify` đóng gói thành công, báo `No tests to run`                     | Java 21.0.12.1, Maven 3.10.0; dùng compiler source/target 21 do JDK môi trường thiếu `ct.sym`, không sửa POM.                                                                                                                                         |
| Cổng thiếu test     | `test -DfailIfNoTests=true` với Surefire 3.5.6 trả exit 1, `No tests to run!` | Đây là phép xác minh cổng fail-closed trên checkout thiếu test, không phải test nghiệp vụ thất bại mới.                                                                                                                                               |
| HTTP bổ sung        | 142 phép đối chiếu, 142 đúng kết quả script dự kiến                           | [http-results.json](evidence/http-results.json). Có ca xác nhận lỗi vẫn còn, không phải 142 chức năng được chứng nhận đúng.                                                                                                                           |
| Frontend bổ sung    | 17 phép đối chiếu, 17 đúng kết quả script dự kiến                             | [frontend-results.json](evidence/frontend-results.json). Kiểm tra schema/tính toán/API mô phỏng, không phải 17 E2E trình duyệt.                                                                                                                       |
| Dependency frontend | 0 advisory được báo tại lúc audit                                             | [npm-audit.json](evidence/npm-audit.json); chưa SCA Maven, chưa xác minh toàn bộ supply chain.                                                                                                                                                        |
| Trình duyệt         | 16 trường hợp trang, 5 tương tác kiểm tra thêm                                | [browser-results.json](evidence/browser-results.json); mô tả phạm vi bên dưới.                                                                                                                                                                        |
| Hiệu năng           | Một lượt Lighthouse mobile, 69/100                                            | [lighthouse-summary.json](evidence/lighthouse-summary.json); đây là baseline lab, chưa có thử nghiệm tối ưu trước/sau.                                                                                                                                |
| Official docs       | Website có lỗi proxy 403; lấy được 12 nguồn chính thức qua GitHub sau đó      | [Lỗi website](evidence/official-source-lookups.json), [nguồn GitHub/trích đoạn/hash](evidence/official-github-sources.json). Một lookup tag Surefire trả 404, đã đọc source master và kiểm tra flag trong runtime; không coi master là exact release. |

## HTTP/backend: đã làm gì và chưa làm gì

Backend thật dùng cookie phiên, CSRF và dữ liệu giả lập. Database là H2 2.4.240 ở chế độ MSSQLServer, với schema tạm giữ PK/FK/UQ/CHECK thông thường, sửa identity và DEFAULT timestamp riêng để tương thích bộ kiểm tra.

H2 **không mô phỏng đầy đủ** filtered indexes, khóa, phantom reads, deadlock và isolation của SQL Server. Vì vậy:

- V01/V02/V03/V05/V06 có hành vi được tái hiện trong môi trường bổ sung, cùng bằng chứng mã nguồn.
- V04 có kiểm tra frontend chấp nhận hai phản hồi lệch tổng; chưa dựng cạnh tranh snapshot trên SQL Server thật.
- Các ca ownership, CSRF, luồng thu mua, cân điều chỉnh, quote, khoản chi lặp tuần tự và khiếu nại được kiểm tra trong phạm vi script.
- Không coi kết quả H2 là cổng đủ để phát hành giao dịch trên SQL Server thật.

142 phép đối chiếu được chạy lại để nạp dữ liệu giả lập cho kiểm tra trình duyệt. Những ca mang nhãn `REPRO` kỳ vọng nhìn thấy vấn đề còn tồn tại; “passed” của script không có nghĩa lỗi đó đã được sửa.

## Trình duyệt: phạm vi chính xác

Chromium headless qua `playwright-core`, phục vụ frontend build production bằng Vite preview, API chuyển tiếp tới backend thật/H2 nói trên. Không có Chrome DevTools MCP trong danh sách công cụ; đây là cách kiểm tra thay thế được ghi rõ, không phải giả lập đã gọi MCP.

Các trang `/`, `/bang-gia`, `/dang-nhap`, `/dang-ky` được mở ở **320 và 1440 px**, mỗi kích thước ở **light và dark**: 4 × 2 × 2 = **16 trường hợp**.

- 0 lỗi `pageerror` và 0 response 5xx trong các trường hợp được thu.
- 0 trường hợp tràn ngang theo `scrollWidth > innerWidth + 1`.
- 0 vi phạm axe trong các lượt quét theo tag `wcag2a`, `wcag2aa`, `wcag21aa`.
- Mỗi trang có một h1 trong các trường hợp đã mở.
- 5 tương tác đạt: chưa đăng nhập vào ba khu khách/nhân viên/admin bị chuyển tới đăng nhập; Tab tới skip link và Enter đưa focus vào main; gửi form login rỗng có `aria-invalid` và không phát POST.

**Chưa kiểm tra:** hành trình UI đăng nhập đủ ba vai trò, biểu mẫu sửa dữ liệu/409/timeout trong browser, screen reader thực, bản đồ/GPS/Valhalla thật, toàn bộ trình duyệt di động hay mọi tiêu chí WCAG. Axe không bao phủ mọi yêu cầu accessibility. Việc dùng reduced motion trong phần quét không xác minh hiệu ứng chuyển động thông thường.

## Lighthouse: baseline có số đo, chưa có kết luận tối ưu

Lighthouse 13.5.0, form factor mobile, throttling `simulate`, một lượt trên localhost bằng Chromium. Backend có dữ liệu giả lập, không có tải người dùng cạnh tranh. Không có runtimeError/runWarnings trong kết quả này.

| Chỉ số                   | Số đo một lượt                   |
| ------------------------ | -------------------------------- |
| Performance score        | 69/100                           |
| First Contentful Paint   | khoảng 3.07 giây                 |
| Largest Contentful Paint | khoảng 6.46 giây                 |
| Total Blocking Time      | 161 ms                           |
| Cumulative Layout Shift  | khoảng 0.00183                   |
| Tổng byte tải            | 1,191,618 byte, khoảng 1,164 KiB |

Lighthouse nhận diện LCP là ảnh `img.hero-image`; bản `/recycling-yard.webp` được tải có dung lượng 446,300 byte. Tool ước tính có cơ hội giảm ảnh, JavaScript chưa dùng và tài nguyên chặn render. Đây là **giả thuyết để thử** theo [19](19-performance-optimization.md), không phải bằng chứng nguyên nhân duy nhất hoặc mức tiết kiệm chắc chắn.

Không có INP thực từ tương tác người dùng, percentile p95 database, field Core Web Vitals, kết quả nhiều lượt hay benchmark trước/sau. Không biến điểm 69/100 thành kết luận tất cả trang chậm, hoặc lấy CLS tốt ở một lượt làm chứng nhận toàn ứng dụng.

## Nguồn chính thức: phương án thay thế website bị chặn

Sau lỗi proxy 403 của các website tài liệu, đã lấy và đọc tài liệu/source trong repository chính thức: React effect, Vite env/static deploy, TanStack Query keys/invalidation, Spring Security 7.1.1 CSRF, Spring Framework 7.0.9 transaction, Microsoft SQL isolation, npm CLI 11.9.0 `ci`/`ignore-scripts`, MDN MAX_SAFE_INTEGER và source Surefire master. Nhật ký có 13 lookup qua GitHub: **12 thành công, 1 tag Surefire 404**.

Runtime classpath đã dùng chứa Spring Security 7.1.1 và `spring-tx` 7.0.9; Maven chạy Surefire 3.5.6. Tài liệu ở nhánh `main`/`live`/`master` là nguồn rolling, không tự gắn cho một patch release khác hoặc phiên bản SQL Server engine chưa biết. Các trích đoạn chỉ hỗ trợ quyết định liên quan; không suy ra đã sửa ứng dụng đúng API hoặc xác minh mọi hành vi framework. Chi tiết và link đầy đủ ở [08](08-source-driven-development.md).

## Những trạng thái chưa hoàn tất

| Workflow             | Phần đã chuẩn bị                                                                      | Chưa được thực hiện                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Interview/spec       | Intent của yêu cầu tài liệu, giả định, câu hỏi và đặc tả dự thảo                      | Chưa có phê duyệt chính sách sản phẩm mới; không gán câu trả lời giả cho người dùng.                                    |
| TDD/build            | Ca hồi quy cụ thể, trình tự RED–GREEN và task                                         | Chưa viết patch sản phẩm, chưa chạy RED–GREEN trên một bản sửa.                                                         |
| Doubt/review         | Quy trình phản biện, artifact/contract và đối chiếu chất lượng tài liệu               | Chưa có cross-model opinion hay phê duyệt kỹ thuật một patch sản phẩm.                                                  |
| Source-driven        | Phiên bản từ manifest/POM/runtime; đọc nguồn chính thức GitHub và lưu trích đoạn/hash | Docs rolling không chứng minh đúng mọi patch release; chưa thực thi các API mới hay kiểm tra deprecated API toàn dự án. |
| CI/migration         | Hợp đồng, pipeline và rollout dự kiến                                                 | Chưa bật CI, thay database, backfill hay chuyển client.                                                                 |
| Observability/launch | Tín hiệu, runbook, checklist và rollback đề xuất                                      | Chưa có telemetry triển khai, staging/pilot hay phát hành ứng dụng.                                                     |

Các JSON trong thư mục evidence là kết quả review bổ sung, không phải test suite chính thức được khôi phục vào ứng dụng. Muốn dùng làm regression lâu dài cần đưa harness/fixture vào Git ở vị trí phù hợp, loại phụ thuộc đường dẫn môi trường và chốt hành vi mong muốn trước.

## Kiểm tra bộ tài liệu trước phân phối

Đã kiểm tra catalog có đúng 25 guide, 31 file Markdown trong thư mục gói, 156 liên kết tới mã/skill và 164 liên kết nội bộ; không phát hiện đường dẫn thiếu. Cả 7 JSON bằng chứng đọc được; các file mã ứng dụng giữ nguyên so với commit nguồn.

Một lượt review tính nhất quán tài liệu với ngữ cảnh tách biệt phát hiện hai điểm: prompt mở đầu yêu cầu nhiều prerequisite hơn task T05, và mô tả Lighthouse summary chưa có URL trang đo. Đã chỉnh prompt theo T01/T02, bổ sung URL/route và thu hẹp khẳng định về cấu hình đã lưu. Đây là review tài liệu; không thay cho fresh-context review hoặc cross-model của một bản sửa bảo mật/snapshot chưa được tạo.
