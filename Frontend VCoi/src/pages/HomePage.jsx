import { Link } from 'react-router-dom'
import { ArrowDownRightIcon } from '@phosphor-icons/react/ArrowDownRight'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { PackageIcon } from '@phosphor-icons/react/Package'
import { ScalesIcon } from '@phosphor-icons/react/Scales'
import { TruckIcon } from '@phosphor-icons/react/Truck'
import MaterialsSection from '../features/home/MaterialsSection'
import ProcessSection from '../features/home/ProcessSection'
import FaqSection from '../features/home/FaqSection'
import '../styles/home.css'
import HomeMotion from '../features/home/HomeMotion'

export default function HomePage() {
  return (
    <HomeMotion>
      <section className="container hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="hero-kicker">THU GOM TẬN NƠI · TÁI CHẾ CÓ ÍCH</p>
          <h1 id="hero-title">
            Ve chai cũ.
            <br />
            <span>Giá trị mới.</span>
          </h1>
          <p className="hero-description">
            Thu gom tận nơi, cân thực tế.
            <br />
            Bạn duyệt báo giá trước khi bán.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/dat-lich">
              Đặt lịch thu gom <ArrowUpRightIcon size={21} aria-hidden="true" />
            </Link>
            <Link className="hero-text-link" to="/bang-gia">
              Xem giá thu mua <ArrowRightIcon size={19} aria-hidden="true" />
            </Link>
          </div>
          <p className="hero-assurance">
            <ScalesIcon size={17} aria-hidden="true" />
            Cân minh bạch <span aria-hidden="true">·</span> Chủ động duyệt giá
          </p>
        </div>
        <div className="hero-visual">
          <img
            className="hero-image"
            src="/recycling-yard.webp"
            srcSet="/recycling-yard-640.webp 640w, /recycling-yard-960.webp 960w, /recycling-yard.webp 1672w"
            sizes="(max-width: 767px) 800px, 1100px"
            alt="Các kiện kim loại và giấy được phân loại tại một điểm tái chế, ảnh minh họa"
            width="1672"
            height="941"
            fetchPriority="high"
          />
        </div>
      </section>
      <nav className="container quick-links" aria-label="Khám phá dịch vụ">
        <Link to="/#thu-mua">
          <PackageIcon size={28} aria-hidden="true" />
          <span>
            Nhà gọn hơn.<small>Phân loại vật liệu bạn muốn bán</small>
          </span>
          <ArrowDownRightIcon size={22} aria-hidden="true" />
        </Link>
        <Link to="/bang-gia">
          <ScalesIcon size={28} aria-hidden="true" />
          <span>
            Giá rõ ràng.<small>Xem giá thu mua đang áp dụng</small>
          </span>
          <ArrowUpRightIcon size={22} aria-hidden="true" />
        </Link>
        <Link to="/#quy-trinh">
          <TruckIcon size={28} aria-hidden="true" />
          <span>
            Thu gom thuận tiện.<small>Tìm hiểu các bước thu gom tại nhà</small>
          </span>
          <ArrowDownRightIcon size={22} aria-hidden="true" />
        </Link>
      </nav>
      <MaterialsSection />
      <ProcessSection />
      <FaqSection />
      <section className="container closing-section">
        <div className="closing-content">
          <h2>
            Mỗi vật liệu cũ,
            <br />
            một cơ hội mới.
          </h2>
          <Link className="button button-primary" to="/dat-lich">
            Đặt lịch thu gom <ArrowUpRightIcon size={22} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </HomeMotion>
  )
}
