# 20 — Git, phạm vi thay đổi và phiên bản phát hành VCOI

Ngày đối chiếu: **29/10/2026**. Trạng thái: quy trình đề xuất; tài liệu này không tạo commit/tag, push hoặc phát hành.

Nguồn skill: [git-workflow-and-versioning/SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/git-workflow-and-versioning/SKILL.md).
Mốc mã ứng dụng: [VCOI `2c804bc`](https://github.com/1250080247-cloud/VCOI/tree/2c804bc8090dee4dcdb2ca150404c534ce35f669).
Báo cáo nền: [những hạng mục V01–V13](../VCOI-RA-SOAT-THEO-AGENT-SKILLS.md).

## Xác định đúng kho và những gì phải bảo toàn

- Kho nguồn là `1250080247-cloud/VCOI`; lần kiểm tra quyền gần nhất trả 403 khi ghi.
  Không push tới nguồn hoặc tìm cách vượt quyền; dùng liên kết commit nguồn để đối chiếu.
- `origin` của bản phân phối hiện là `https://github.com/tunato2807-del/ve_chai.git`.
  Đây là nơi nhận thay đổi khi nhiệm vụ có yêu cầu commit/push phù hợp.
- Giữ các commit hiện có, mã nhập từ nguồn và [PowerPoint](../presentation/VCoi_Thu_gom_ve_chai.pptx).
  Không khởi tạo lại Git, thay toàn bộ cây dự án bằng một bản rút gọn hoặc viết lại lịch sử để dọn diff.
- Việc thêm tài liệu theo skill không có nghĩa các mục sửa trong tài liệu đã được thực thi.
  Phân biệt phiên bản báo cáo với phiên bản ứng dụng và bản phát hành cho người dùng.

Trước công việc mới, chạy các lệnh đọc ở thư mục gốc:

```bash
git status --short
git remote -v
git log --oneline -8
git diff --stat
```

Nếu có thay đổi do người dùng tạo, ghi nhận và chỉ stage file thuộc phạm vi nhiệm vụ.
Không dùng `git reset --hard`, `git clean -fd` hay checkout đè file để đạt working tree sạch.
Phần hướng dẫn Git tổng quát của skill cần được áp dụng cùng yêu cầu bảo toàn dữ liệu của checkout này.

## Chia công việc thành PR có thể kiểm chứng

| Nhánh/PR đề xuất                 | Phạm vi                                                      | Bằng chứng cần kèm                                                                    |
| -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `test/restore-regression-suite`  | V07: nguồn test/fixture, lệnh phát hiện test.                | Số test >0, fixture giả và chạy được từ clone mới.                                    |
| `fix/session-revocation`         | V01 và migration phiên tương ứng.                            | Tái hiện cookie cũ trước sửa, 401 sau sửa; rollback không khôi phục phiên đã thu hồi. |
| `fix/catalog-stale-edit`         | Một phần V03, không thêm revision toàn bộ ứng dụng cùng lúc. | Hai tab cùng bản cũ, bản sau nhận 409; thông báo tải lại.                             |
| `fix/report-consistency`         | V04: hợp đồng snapshot, backend và client liên quan.         | Tổng và các trang/export khớp khi có khoản chi mới trên SQL Server.                   |
| `refactor/address-validation-js` | Chỉ trích logic JavaScript đã trùng.                         | Hành vi giữ nguyên; tách khỏi sửa backend V05.                                        |
| `docs/current-runbook`           | V09, tài liệu hiện hành và lịch sử.                          | Đường dẫn/lệnh hợp lệ; số liệu cũ có ngày/phạm vi.                                    |

Mỗi commit hoàn thành một ý định, kèm kiểm chứng cần thiết để chính commit đó có ý nghĩa.
Ví dụ `fix: revoke old sessions after account lock` giải thích lý do thu hồi, không chỉ ghi “update auth”.
Không tách test của một bug fix sang một PR không liên quan để tạo commit nhỏ giả tạo.
Không trộn format toàn kho, nâng dependency, refactor và thay chính sách tiền vào cùng PR.
Mục tiêu là diff dễ review; khoảng 100–300 dòng là hướng dẫn, không phải hạn mức cứng cho tài liệu.

## Kiểm tra trước commit và review

1. Đọc `git diff` rồi stage từng đường dẫn có chủ đích; xem `git diff --cached` trước khi commit.
2. Rà secret và dữ liệu cá nhân trong diff mà không in giá trị nhạy cảm vào artifact công khai.
   [`.gitignore` nguồn](https://github.com/1250080247-cloud/VCOI/blob/2c804bc8090dee4dcdb2ca150404c534ce35f669/.gitignore) đã loại `.env`, `.local`, `target`, `node_modules`, log và backup DB.
   Ignore không bảo vệ file đã được track; không stage credential, ảnh thật hoặc database dump.
3. Chạy kiểm tra phù hợp phạm vi: frontend `npm run check`; backend Maven Wrapper `verify` khi sửa Java.
   Test hiện thiếu nguồn; ghi số test thực thi, không chỉ ghi build xanh. Theo [21](21-ci-cd-and-automation.md) để bổ sung gate.
4. Với docs-only, kiểm tra nội dung, đường dẫn, liên kết và trạng thái “đã làm/đề xuất”; không dựng kết quả test ứng dụng mới.
5. PR nêu lỗi/kết quả sau sửa, commit nền, phạm vi, lệnh đã chạy, số test và phần chưa thử.
   Reviewer cần biết ca SQL Server/browser nào còn thiếu trước khi quyết định phát hành.

Khi xung đột, đọc cả hai ý định và test hợp đồng; không mặc định chọn `ours`/`theirs` cho DTO, schema hoặc chính sách quyền.
Khi cần hoàn nguyên thay đổi đã chia sẻ, dùng commit revert có chủ đích thay cho force-push.
Worktree riêng chỉ cần khi thực sự có nhiều luồng; không xóa worktree chứa thay đổi chưa lưu của người khác.

## Phiên bản và lịch sử thay đổi

Frontend hiện ghi `0.1.0`; backend ghi `0.0.1-SNAPSHOT`, chưa phải bằng chứng có một bản release thống nhất.
Trước release ứng dụng, chọn cách gắn version cho bộ frontend/backend/schema và ghi đầy đủ commit/artifact đi cùng.
Thay kiểu tiền number → decimal string hoặc bắt buộc revision có thể phá client cũ: cần migration và hợp đồng phiên bản.
Theo SemVer khi đã công bố hợp đồng: breaking → major, bổ sung tương thích → minor, sửa tương thích → patch.
Tag release phải cố định; tạo changelog cho tác động người dùng, không chép toàn bộ `git log`.
Giữ mục Added/Changed/Fixed/Deprecated/Removed/Security cùng hướng dẫn nâng cấp nếu cần.
Chỉ tạo/push tag khi thực hiện nhiệm vụ phát hành đã được giao; không đánh tag bộ tài liệu như ứng dụng đã sửa xong.

## Tiêu chí nghiệm thu và bàn giao

- [ ] Kho đích đúng `tunato2807-del/ve_chai`, mốc nguồn được giữ rõ; không có push tới kho nguồn.
- [ ] Lịch sử hiện có, mã ứng dụng và PowerPoint còn nguyên; diff chỉ thuộc phạm vi được giao.
- [ ] Commit/PR có một ý định và bằng chứng; refactor và đổi hành vi được phân biệt.
- [ ] Không có secret/build output/dữ liệu thật; working tree của người dùng được bảo toàn.
- [ ] Nếu phát hành: version/tag/changelog/artifact khớp nhau, có đường rollback và migration ở [22](22-deprecation-and-migration.md).

> Tổ chức thay đổi VCOI trên nhánh ngắn của tunato2807-del/ve_chai, giữ lịch sử và PowerPoint.
> Xem trạng thái trước; chia mỗi vấn đề thành PR nhỏ có test, ghi giới hạn kiểm chứng.
> Không force-push, xóa thay đổi sẵn có hoặc push sang 1250080247-cloud/VCOI.
