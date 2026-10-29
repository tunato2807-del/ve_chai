import { useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { ListIcon } from '@phosphor-icons/react/List'
import { RecycleIcon } from '@phosphor-icons/react/Recycle'
import { XIcon } from '@phosphor-icons/react/X'
import AccountNav from '../features/auth/AccountNav'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [open, setOpen] = useState(false)
  const trigger = useRef(null)
  const { pathname, hash } = useLocation()
  function closeMenu() {
    setOpen(false)
  }
  function handleKeyDown(event) {
    if (event.key === 'Escape' && open) {
      closeMenu()
      trigger.current?.focus()
    }
  }

  return (
    <header className="site-header" onKeyDown={handleKeyDown}>
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="VCoi, trang chủ" onClick={closeMenu}>
          <RecycleIcon size={35} weight="bold" aria-hidden="true" />
          <span>
            VCoi<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="header-actions">
          <ThemeToggle />
          <div className="desktop-account">
            <AccountNav closeMenu={closeMenu} iconOnly />
          </div>
          <button
            ref={trigger}
            className="icon-button menu-toggle"
            type="button"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <XIcon size={24} aria-hidden="true" />
            ) : (
              <ListIcon size={24} aria-hidden="true" />
            )}
          </button>
        </div>
        <nav
          id="main-navigation"
          className={`navigation ${open ? 'is-open' : ''}`}
          aria-label="Điều hướng chính"
        >
          <Link
            to="/"
            onClick={closeMenu}
            aria-current={pathname === '/' && !hash ? 'page' : undefined}
          >
            Trang chủ
          </Link>
          <Link
            to="/#thu-mua"
            onClick={closeMenu}
            aria-current={pathname === '/' && hash === '#thu-mua' ? 'location' : undefined}
          >
            Vật liệu thu mua
          </Link>
          <NavLink to="/bang-gia" end onClick={closeMenu}>
            Bảng giá
          </NavLink>
          <Link
            to="/#quy-trinh"
            onClick={closeMenu}
            aria-current={pathname === '/' && hash === '#quy-trinh' ? 'location' : undefined}
          >
            Quy trình
          </Link>
          <Link
            to="/#cau-hoi"
            onClick={closeMenu}
            aria-current={pathname === '/' && hash === '#cau-hoi' ? 'location' : undefined}
          >
            Câu hỏi thường gặp <ArrowUpRightIcon size={17} aria-hidden="true" />
          </Link>
          <div className="mobile-account">
            <AccountNav closeMenu={closeMenu} />
          </div>
        </nav>
      </div>
    </header>
  )
}
