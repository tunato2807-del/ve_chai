const questions = [
  [
    'Giá trên website có phải giá cuối cùng không?',
    'Bảng giá cho biết đơn giá thu mua hiện hành. Báo giá cuối cùng được lập theo loại vật liệu, phân hạng và kết quả cân thực tế. Khách hàng duyệt báo giá trước bước hoàn tất thu mua.',
  ],
  [
    'Tôi nên chuẩn bị ve chai như thế nào?',
    'Tách riêng giấy, nhựa và kim loại. Giữ giấy khô, làm sạch và để ráo chai nhựa, buộc gọn carton. Vật liệu khác loại nên để riêng để việc cân và báo giá thuận tiện.',
  ],
  [
    'Khi muốn hủy hoặc đổi lịch thì làm sao?',
    'Bạn cần liên hệ hoặc gửi yêu cầu để quản trị viên duyệt hủy. Việc đổi lịch phụ thuộc trạng thái đơn; khi nhân viên đã khởi hành, yêu cầu đổi lịch cần được quản trị viên xử lý.',
  ],
  [
    'Vật liệu chưa có giá thì có được thu mua không?',
    'Vật liệu còn được tiếp nhận nhưng chưa có giá hiệu lực sẽ hiển thị “Liên hệ báo giá”. Bạn cần xác nhận giá với đại lý trước khi quyết định bán.',
  ],
]

export default function FaqSection() {
  return (
    <section
      className="container faq-section section-space"
      id="cau-hoi"
      aria-labelledby="faq-title"
    >
      <div>
        <h2 id="faq-title">
          Một vài điều
          <br />
          bạn muốn biết.
        </h2>
        <p className="section-description">Chuẩn bị nhẹ nhàng hơn cho lần thu gom tiếp theo.</p>
      </div>
      <div className="faq-list">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span className="faq-indicator" aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
