import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function HomeMotion({ children }) {
  const root = useRef(null)
  useGSAP(
    () => {
      if (!window.matchMedia) return
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', (motionContext) => {
        gsap.fromTo(
          '.hero-content > *',
          { y: 14, opacity: 0.94 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          },
        )
        // The LCP photograph stays visible; scrolling is entirely native.
        gsap.fromTo(
          '.hero-visual',
          { y: 14 },
          { y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'transform' },
        )
        if (!window.IntersectionObserver) return
        let active = true
        const reveal = motionContext.add('reveal', (entries) => {
          if (!active) return
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            observer.unobserve(entry.target)
            gsap.fromTo(
              entry.target,
              { y: 16, opacity: 0.94 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
              },
            )
          }
        })
        const observer = new IntersectionObserver(reveal, { threshold: 0.08 })
        root.current
          .querySelectorAll('.materials-section, .process-section, .faq-section, .closing-section')
          .forEach((el) => observer.observe(el))
        return () => {
          active = false
          observer.disconnect()
        }
      })
      return () => media.revert()
    },
    { scope: root },
  )
  return (
    <div className="home-page" ref={root}>
      {children}
    </div>
  )
}
