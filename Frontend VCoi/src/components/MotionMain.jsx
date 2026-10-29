import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

// Keep navigation, focus and forms mounted; query-string filters do not replay motion.
export default function MotionMain({ children, className, motionPreset = 'page' }) {
  const root = useRef(null)
  const { pathname } = useLocation()
  useGSAP(
    () => {
      if (pathname === '/' || !window.matchMedia) return
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        if (motionPreset === 'admin') {
          const page = root.current.firstElementChild
          const sections = page ? Array.from(page.children) : Array.from(root.current.children)

          gsap.fromTo(
            root.current,
            { y: 7, opacity: 0.96 },
            {
              y: 0,
              opacity: 1,
              duration: 0.34,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
          )
          if (sections.length) {
            gsap.fromTo(
              sections,
              { y: 9, opacity: 0.9 },
              {
                y: 0,
                opacity: 1,
                duration: 0.38,
                delay: 0.04,
                stagger: 0.055,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
              },
            )
          }
          return
        }

        gsap.fromTo(
          root.current,
          { y: 10, opacity: 0.96 },
          { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out', clearProps: 'transform,opacity' },
        )
      })
      return () => media.revert()
    },
    { scope: root, dependencies: [pathname, motionPreset], revertOnUpdate: true },
  )
  return (
    <main ref={root} className={className} id="main-content" tabIndex={-1} data-page-motion="ready">
      {children}
    </main>
  )
}
