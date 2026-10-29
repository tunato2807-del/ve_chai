const steps = [
  [
    'Gửi lịch thu gom',
    'Chọn vật liệu, địa chỉ và khung giờ bạn thuận tiện.',
    '/weighing-640.webp',
    'Giấy carton phân loại gọn để hẹn thu gom, ảnh minh họa',
  ],
  [
    'Đại lý xác nhận',
    'Đại lý kiểm tra lịch và phân công nhân viên đến thu gom.',
    '/recycling-yard-640.webp',
    'Điểm tập kết và thu gom vật liệu của đại lý, ảnh minh họa',
  ],
  [
    'Cân & duyệt giá',
    'Xem khối lượng thực tế và duyệt báo giá trước khi hoàn tất.',
    '/weighing-640.webp',
    'Nhân viên cân giấy carton bằng cân thực tế, ảnh minh họa',
  ],
  [
    'Hoàn tất thu mua',
    'Theo dõi kết quả thu mua và biên nhận của đơn.',
    '/recycling-yard-640.webp',
    'Vật liệu đã được thu gom, phân loại để tái chế, ảnh minh họa',
  ],
]

export default function ProcessSection() {
  return (
    <section
      className="process-section section-space"
      id="quy-trinh"
      aria-labelledby="process-title"
    >
      <div className="container">
        <div className="process-intro">
          <h2 id="process-title">Gọn từ nhà. Rõ từng bước.</h2>
          <p className="section-description">
            Một quy trình thu gom để bạn luôn biết vật liệu của mình đang ở đâu.
          </p>
          <p className="process-note">Bạn chọn thời gian. VCoi lo phần thu gom.</p>
        </div>
        <ol className="process-steps">
          {steps.map(([title, description, image, alt], index) => (
            <li key={title}>
              <div className={`process-photo process-photo-${index + 1}`}>
                <img src={image} alt={alt} width="640" height="400" loading="lazy" />
              </div>
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
