import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { RecycleIcon } from '@phosphor-icons/react/Recycle'
import { NewspaperIcon } from '@phosphor-icons/react/Newspaper'
import { NutIcon } from '@phosphor-icons/react/Nut'

const materials = [
  {
    title: 'Giấy & carton',
    description: 'Thùng carton, giấy báo và giấy văn phòng. Giữ khô và xếp gọn trước khi thu gom.',
    icon: NewspaperIcon,
  },
  {
    title: 'Nhựa',
    description:
      'Chai PET và các loại nhựa được đại lý tiếp nhận. Làm sạch, để ráo và phân loại riêng.',
    icon: RecycleIcon,
  },
  {
    title: 'Kim loại',
    description:
      'Sắt, nhôm, đồng và các vật liệu kim loại. Giá phụ thuộc loại và chất lượng thực tế.',
    icon: NutIcon,
  },
]

export default function MaterialsSection() {
  return (
    <section
      className="container materials-section section-space"
      id="thu-mua"
      aria-labelledby="materials-title"
    >
      <div className="materials-intro">
        <p className="section-eyebrow">VẬT LIỆU THU MUA</p>
        <h2 id="materials-title">
          Bạn có ve chai.
          <br />
          Chúng tôi thấy
          <br />
          <span className="text-accent">tài nguyên.</span>
        </h2>
        <p>
          Từ góc bếp đến kho hàng, bắt đầu vòng tuần hoàn bằng những vật liệu đã được phân loại.
        </p>
        <img
          src="/weighing.webp"
          srcSet="/weighing-640.webp 640w, /weighing.webp 1448w"
          sizes="(max-width: 767px) calc(100vw - 36px), 590px"
          alt="Nhân viên chuẩn bị cân giấy carton đã phân loại, ảnh minh họa"
          width="1448"
          height="1086"
          loading="lazy"
        />
      </div>
      <div className="material-list">
        {materials.map(({ title, description, icon: Icon }) => (
          <article className="material-row" key={title}>
            <div className="material-symbol">
              <Icon size={38} weight="light" aria-hidden="true" />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
        <div className="materials-note">
          <p>Danh sách tiếp nhận và đơn giá có thể thay đổi theo từng thời điểm.</p>
          <Link className="text-link" to="/bang-gia">
            Xem vật liệu & giá hiện hành <ArrowUpRightIcon size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
