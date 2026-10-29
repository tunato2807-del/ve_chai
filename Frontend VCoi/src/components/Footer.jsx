import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { ArrowUpIcon } from '@phosphor-icons/react/ArrowUp'
import { RecycleIcon } from '@phosphor-icons/react/Recycle'

gsap.registerPlugin(useGSAP)

export default function Footer() {
  const root = useRef(null)

  useGSAP(
    (_, contextSafe) => {
      if (
        !root.current ||
        !window.IntersectionObserver ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        return
      }

      const columns = root.current.querySelectorAll('[data-footer-reveal]')
      const reveal = contextSafe(() => {
        gsap.fromTo(
          columns,
          { y: 18, opacity: 0.72 },
          {
            y: 0,
            opacity: 1,
            duration: 0.62,
            stagger: 0.11,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          },
        )
      })
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect()
            reveal()
          }
        },
        { threshold: 0.12 },
      )

      observer.observe(root.current)
      return () => observer.disconnect()
    },
    { scope: root },
  )

  return (
    <footer className="site-footer" ref={root}>
      <div className="container footer-top">
        <div className="footer-brand-block" data-footer-reveal>
          <Link className="brand" to="/" aria-label="VCoi, trang chủ">
            <RecycleIcon size={32} weight="bold" aria-hidden="true" />
            <span>VCoi.</span>
          </Link>
          <p className="footer-manifesto">
            Gom điều nhỏ.
            <br />
            <span>Tạo thay đổi lớn.</span>
          </p>
          <p className="footer-signoff">Thu gom tử tế, bắt đầu từ những vật liệu quanh bạn.</p>
        </div>
        <nav className="footer-nav" aria-label="Thông tin thu gom" data-footer-reveal>
          <span className="footer-label">Khám phá VCoi</span>
          <Link to="/#thu-mua">Vật liệu thu mua</Link>
          <Link to="/bang-gia">
            Bảng giá hiện hành <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
          <Link to="/#quy-trinh">Quy trình thu gom</Link>
        </nav>
        <div className="footer-project" data-footer-reveal>
          <span className="footer-label">Về dự án</span>
          <p className="footer-project-title">Một điểm hẹn rõ ràng cho mỗi lần thu gom.</p>
          <p>Đồ án hệ thống thương mại điện tử dành cho một đại lý thu mua phế liệu.</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} VCoi</span>
        <span className="footer-cycle-note">
          <RecycleIcon size={17} aria-hidden="true" /> Một vòng đời mới cho vật liệu cũ.
        </span>
        <Link className="footer-top-link" to="/#main-content">
          Về đầu trang <ArrowUpIcon size={16} aria-hidden="true" />
        </Link>
      </div>
    </footer>
  )
}
