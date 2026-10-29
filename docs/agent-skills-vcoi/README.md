# Bộ tài liệu áp dụng 25 Agent Skills vào VCoi

Ngày lập: **29/10/2026**. Dự án đích: [1250080247-cloud/VCOI](https://github.com/1250080247-cloud/VCOI), commit nguồn `2c804bc8090dee4dcdb2ca150404c534ce35f669`.

**Bộ này bao phủ đủ 25/25 skill ở mức đối chiếu và hướng dẫn áp dụng riêng cho dự án.** Đây là đầu ra tài liệu theo yêu cầu hiện tại; không đồng nghĩa đã hoàn tất 25 quy trình triển khai. Các việc sửa mã, TDD sau sửa, SQL Server thật, migration, telemetry và phát hành chỉ được đánh dấu hoàn thành khi có bằng chứng tương ứng. Không cài plugin toàn cục hoặc thay đổi mã ứng dụng trong lượt này.

Nguồn skill: [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c), commit `eb07f19f52c2669f2364897aaa293e2aaddd7b1c`. Mỗi tài liệu đánh số dẫn tới đúng `SKILL.md` đã đọc và chỉ ra việc cụ thể trong VCoi. Không sao chép `AGENTS.md` của kho skill sang ứng dụng.

## Bắt đầu đọc ở đâu

1. [EVIDENCE.md](EVIDENCE.md): phân biệt kết quả đã chạy, giới hạn và nguồn không lấy được.
2. [Báo cáo 13 hạng mục cần sửa](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md): vấn đề, vị trí, hướng sửa và nghiệm thu.
3. [CAPABILITY-MAP.md](CAPABILITY-MAP.md): các nhóm thay đổi và phụ thuộc; trạng thái dự thảo.
4. [tasks/plan.md](tasks/plan.md) và [tasks/todo.md](tasks/todo.md): chọn một lát cắt và làm đến nghiệm thu, không gửi đồng thời 25 prompt sửa toàn dự án.
5. [AGENTS.template.md](AGENTS.template.md): bản đề xuất quy ước cho agent, chỉ cài vào dự án sau khi đối chiếu quy ước đang có.

## Mục lục và trạng thái 25 skill

| #   | Skill và tài liệu                                                                                  | Đã áp dụng đến đâu / việc còn lại                                                                                              |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 01  | [using-agent-skills](01-using-agent-skills.md) — Điều phối quy trình                               | Map đủ 25 skill; xác định đầu ra và ranh giới cho lượt tài liệu.                                                               |
| 02  | [interview-me](02-interview-me.md) — Làm rõ nhu cầu                                                | Tách yêu cầu đã rõ khỏi quyết định nghiệp vụ còn mở; chưa tổ chức phỏng vấn sản phẩm.                                          |
| 03  | [idea-refine](03-idea-refine.md) — Chọn hướng cải thiện                                            | Đưa phương án phù hợp một đại lý; chưa xác nhận lựa chọn sản phẩm mới.                                                         |
| 04  | [spec-driven-development](04-spec-driven-development.md) — Đặc tả trước khi sửa                    | Đặc tả dự thảo và tiêu chí; chưa duyệt chính sách bàn giao/tiền/snapshot.                                                      |
| 05  | [constraint-driven-development](05-constraint-driven-development.md) — Ràng buộc chất lượng        | Định nghĩa invariant và cổng; ngân sách chưa đo/chốt được đánh dấu đề xuất.                                                    |
| 06  | [planning-and-task-breakdown](06-planning-and-task-breakdown.md) — Kế hoạch theo phụ thuộc         | Chia lát cắt và task; chưa thực hiện các task sửa ứng dụng.                                                                    |
| 07  | [context-engineering](07-context-engineering.md) — Ngữ cảnh theo module                            | Chỉ dẫn nạp đúng tệp/commit; loại bỏ số liệu lịch sử khỏi bằng chứng hiện tại.                                                 |
| 08  | [source-driven-development](08-source-driven-development.md) — Đối chiếu tài liệu gốc              | Phát hiện phiên bản; website có lỗi 403, đã đọc 12 nguồn chính thức qua GitHub; giữ giới hạn tag/rolling và API chưa kiểm thử. |
| 09  | [incremental-implementation](09-incremental-implementation.md) — Sửa từng lát cắt                  | Có trình tự sửa/kiểm tra/dừng; chưa có patch nghiệp vụ.                                                                        |
| 10  | [doubt-driven-development](10-doubt-driven-development.md) — Phản biện giả định                    | Có artifact/contract và quy trình bàn giao; không tuyên bố đã có ý kiến cross-model.                                           |
| 11  | [test-driven-development](11-test-driven-development.md) — Test đỏ trước bản sửa                   | Có ca hồi quy dự kiến cho lỗi cụ thể; chưa triển khai chu trình RED–GREEN trên mã ứng dụng.                                    |
| 12  | [browser-testing-with-devtools](12-browser-testing-with-devtools.md) — Kiểm tra trình duyệt        | Có baseline Chromium cục bộ qua Playwright; thiếu DevTools MCP và E2E đầy đủ ba vai trò.                                       |
| 13  | [debugging-and-error-recovery](13-debugging-and-error-recovery.md) — Tái hiện và khoanh vùng       | Có các ca HTTP/schema tái hiện; chưa thực hiện bản sửa và kiểm tra sau sửa.                                                    |
| 14  | [frontend-ui-engineering](14-frontend-ui-engineering.md) — Giao diện và accessibility              | Có checklist/case riêng VCoi và baseline giới hạn; chưa sửa component.                                                         |
| 15  | [api-and-interface-design](15-api-and-interface-design.md) — Hợp đồng API                          | Đối chiếu tiền/địa chỉ/revision/snapshot; schema thay thế còn là thiết kế đề xuất.                                             |
| 16  | [code-review-and-quality](16-code-review-and-quality.md) — Review năm chiều                        | Kế thừa phát hiện có bằng chứng; không có verdict phê duyệt bản sửa chưa tồn tại.                                              |
| 17  | [code-simplification](17-code-simplification.md) — Đơn giản hóa có kiểm chứng                      | Chỉ ra phạm vi đơn giản hóa; chưa refactor hay xóa mã.                                                                         |
| 18  | [security-and-hardening](18-security-and-hardening.md) — Bảo mật theo ranh giới                    | Có threat model và lỗ hổng thiết kế; chưa kiểm chứng toàn bộ deployment/hệ phụ thuộc.                                          |
| 19  | [performance-optimization](19-performance-optimization.md) — Đo trước khi tối ưu                   | Có baseline lab giới hạn và kế hoạch đo; chưa tối ưu hoặc kết luận SQL Server nhanh/chậm.                                      |
| 20  | [git-workflow-and-versioning](20-git-workflow-and-versioning.md) — Git và truy vết                 | Giữ lịch sử nguồn/PowerPoint; lần phát hành này chỉ ghi tài liệu vào kho của người dùng.                                       |
| 21  | [ci-cd-and-automation](21-ci-cd-and-automation.md) — CI và cổng tự động                            | Có thiết kế pipeline; chưa tạo workflow đang chạy trên GitHub.                                                                 |
| 22  | [deprecation-and-migration](22-deprecation-and-migration.md) — Di chuyển an toàn                   | Có chiến lược schema/API/phiên theo thay đổi; chưa chạy migration dữ liệu.                                                     |
| 23  | [documentation-and-adrs](23-documentation-and-adrs.md) — Tài liệu và quyết định                    | Có bộ MD và lộ trình tách README; chưa tái cấu trúc README gốc hoặc phê duyệt ADR.                                             |
| 24  | [observability-and-instrumentation](24-observability-and-instrumentation.md) — Log, metrics, trace | Có tín hiệu và runbook đề xuất; chưa có telemetry ứng dụng mới được triển khai.                                                |
| 25  | [shipping-and-launch](25-shipping-and-launch.md) — Phát hành và khôi phục                          | Có cổng staging/pilot/rollback; chưa triển khai ứng dụng.                                                                      |

## Cách đưa bộ này vào kho VCOI

- Giữ thư mục `docs/agent-skills-vcoi/` và file báo cáo `docs/VCOI-RA-SOAT-THEO-AGENT-SKILLS.md` cạnh nhau để liên kết tương đối hoạt động. Bản ZIP được đóng gói theo đúng cấu trúc đó; giải nén ở thư mục gốc dự án sau khi xem danh sách file, không ghi đè tài liệu đang sửa.
- Kho `tunato2807-del/ve_chai` là nơi phân phối bộ tài liệu trong cuộc trao đổi này. Không tự coi nó là nhánh ghi được của `1250080247-cloud/VCOI`; muốn cập nhật kho gốc cần tài khoản có quyền hoặc PR từ bản sao.
- Nếu muốn agent làm theo quy ước dự án: đọc `AGENTS.template.md`, hợp nhất với `AGENTS.md` đang có rồi mới đặt ở gốc dự án. Không xóa quy tắc cũ và không chép nguyên đường dẫn máy cá nhân từ ví dụ.
- Muốn dùng mặc định `tasks/plan.md` và `tasks/todo.md` cho công cụ build: chuyển/hợp nhất hai file trong bộ này vào thư mục `tasks/` ở gốc **chỉ sau khi xác minh không có kế hoạch đang làm**; sửa đường dẫn tương đối nếu chuyển. Hiện các file được cố ý đặt trong gói tài liệu để không trở thành lệnh triển khai tự động.
- Bộ MD không tự cài native skill/plugin vào Codex/Claude và không thay thế source skill. Nếu cài công cụ sau này, chốt phiên bản và cơ chế chính thức trước; không dùng `npx` hoặc endpoint từ tài liệu như một lệnh được cấp quyền ngầm.

## Prompt khởi động một lần sửa

> Đọc `docs/agent-skills-vcoi/README.md`, `EVIDENCE.md` và `tasks/todo.md`. Kiểm tra HEAD so với commit nguồn trong tài liệu. Chọn duy nhất task T05 về địa chỉ sau khi T01–T02 đã có bằng chứng, hoặc khôi phục nguồn test nếu còn thiếu. Dùng các skill 07 → 08 → 11 → 09 → 13 → 16 → 20 → 23 tương ứng với việc thực tế. Phân biệt lệnh đang có với lệnh đề xuất. Không tự mở rộng sang bàn giao nhân viên, chuyển tiền thật hoặc triển khai. Báo thay đổi, kết quả kiểm tra và phần chưa xác minh; không tick đạt khi chưa có bằng chứng.

## Quy tắc đọc trạng thái

- **Đã đối chiếu:** có dữ kiện từ mã nguồn hoặc tài liệu; không tự suy ra đã sửa.
- **Đã chạy:** có kết quả cụ thể và môi trường ở EVIDENCE.md; giữ nguyên giới hạn.
- **Đề xuất / DRAFT:** có phương án để người triển khai dùng; chưa là quyết định sản phẩm đã duyệt.
- **Cần xác minh:** chưa chạy được/thiếu môi trường/thiếu nguồn chính thức; không chuyển thành đạt vì thời gian đã trôi qua.

Dùng mức áp dụng phù hợp từng task: `using-agent-skills` cũng nêu không phải mọi task cần mọi skill. Ví dụ, một sửa validator không cần triển khai hạ tầng tracing hay rollout nhiều giai đoạn. Bao phủ đủ catalog giúp không bỏ sót góc nhìn, còn phạm vi triển khai phải theo nhu cầu của VCoi.
