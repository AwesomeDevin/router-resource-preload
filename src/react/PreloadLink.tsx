import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'


interface IProps {
  to: string
  preload?: boolean
  inview?: boolean
  children: React.ReactNode
  basename?: string
}

interface IFile {
  type: string
  href: string
}


declare global{
  interface Window {
    routerManifest: any
  }
}


export default function PreloadLink(props: IProps) {
  const { to, children, preload, inview, basename } = props

  const [loaded, setLoaded] = useState(false)
  const [preloadFiles, setPreloadFiles] = useState<IFile[]>([])
  const ref = useRef<HTMLAnchorElement>(null)

  const init = useCallback(() => {
    if (!preloadFiles.length) return

    const appendLink = (href: string, type: string) => {
      const mfInfo = href.split('/')
      let dom
      switch (type) {
        case 'script':
          dom = document.createElement('script')
          dom.src = href
          break
        case 'mf':
          // @ts-ignore
          mfInfo[0] && window[mfInfo[0]].get('./' + mfInfo[1])
          break
        default:
          dom = document.createElement('link')
          dom.as = type
          dom.rel = 'prefetch'
          dom.href = `${href}`
          break
      }
      dom && document.head.appendChild(dom)
    }

    preloadFiles.forEach(file => {
      appendLink(file.href, file.type)
    })

    setLoaded(true)
  }, [preloadFiles])

  const getPreloadFiles = useCallback((to: string) => {
    if (!to) return
    const files = window.routerManifest && window.routerManifest[to]
    if (files && files.length && files instanceof Array) {
      setPreloadFiles(files)
    }
  }, [])

  const load = () => {
    requestIdleCallback(init, { timeout: 1000 })
  }

  const handleMouseEnter = useCallback(() => {
    if (loaded) return
    load()
  }, [preload, load, loaded])

  useEffect(() => {
    if (!preload || loaded) return
    load()
  }, [preload, load, loaded])

  useEffect(() => {
    if (
      !inview ||
      loaded ||
      !ref.current ||
      typeof IntersectionObserver === 'undefined' ||
      !preloadFiles.length
    )
      return
    let observer = new IntersectionObserver(entries => {
      if (entries.length && entries[0].isIntersecting) {
        load()
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inview, preloadFiles, loaded])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.routerManifest) {
      getPreloadFiles(to)
      return
    }
    fetch(basename + './router-manifest.json')
      .then(res => res.json())
      .then(res => {
        window.routerManifest = res
        getPreloadFiles(to)
      })
  }, [to])

  return (
    Link ? <Link to={to} onMouseEnter={handleMouseEnter} ref={ref}>
      {children}
    </Link>:
    <a href={basename + to} onMouseEnter={handleMouseEnter} ref={ref}>
      {children}
    </a>
  )
}
