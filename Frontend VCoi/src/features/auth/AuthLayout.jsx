import { Link } from 'react-router-dom'

export default function AuthLayout({ title, description, children }) {
  return (
    <section className="container auth-layout">
      <aside className="auth-story">
        <img
          src="/weighing.webp"
          width="1448"
          height="1086"
          alt="Phân loại và cân giấy carton, ảnh minh họa"
        />
        <div>
          <p className="auth-story-kicker">MỘT LỰA CHỌN NHỎ. MỘT VÒNG ĐỜI MỚI.</p>
          <h2>
            Gom điều nhỏ.
            <br />
            Tạo thay đổi lớn.
          </h2>
          <p>Mỗi lịch thu gom là khởi đầu cho một vòng đời mới của vật liệu.</p>
          <Link className="text-link" to="/bang-gia">
            Khám phá giá thu mua →
          </Link>
        </div>
      </aside>
      <div className="auth-form-area">
        <p className="auth-form-kicker">CHÀO MỪNG ĐẾN VỚI VCOI</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </div>
    </section>
  )
}
