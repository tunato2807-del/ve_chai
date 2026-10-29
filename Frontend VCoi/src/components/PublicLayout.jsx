import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import MotionMain from './MotionMain'

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <Header />
      <MotionMain>
        <Outlet />
      </MotionMain>
      <Footer />
    </div>
  )
}
