import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Mark } from './ui/kit'
import { SLIDES, Still } from './slides'
import { CLIENTE } from './config'

const TOTAL = SLIDES.length
const pad = (n: number) => String(n).padStart(2, '0')

// O slide atual mora no hash (#3) para dar para compartilhar um slide específico.
const subscribe = (l: () => void) => {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}
const useIndex = () => {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  const n = Number(hash.match(/^#(\d+)/)?.[1] ?? 1)
  return Math.min(Math.max(n, 1), TOTAL) - 1
}
const go = (i: number) => {
  const n = Math.min(Math.max(i, 0), TOTAL - 1) + 1
  if (location.hash !== `#${n}`) location.hash = String(n)
}

export function Deck() {
  const index = useIndex()
  const [overview, setOverview] = useState(false)
  const prev = useRef(index)
  const dir = index >= prev.current ? 1 : -1
  useEffect(() => {
    prev.current = index
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      // Campos (busca, filtros, sliders) ficam com as próprias teclas.
      if (target.closest('input, textarea, select, [contenteditable]')) {
        if (e.key === 'Escape') target.blur()
        return
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        setOverview((v) => !v)
      } else if (e.key === 'Escape') setOverview(false)
      else if (overview) return
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        go(index + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(TOTAL - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, overview])

  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.target as HTMLElement
    touch.current = t.closest('input, [data-noswipe]') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1))
  }

  const { title, Component } = SLIDES[index]

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="grain" />
      <header className="relative z-20 shrink-0 border-b border-line">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <a href="#1" className="flex items-center gap-2.5" aria-label="isla, voltar à capa">
            <Mark className="h-[18px] w-auto text-porcelain" />
            <span className="text-[15px] font-medium tracking-[-0.01em]">isla</span>
          </a>
          <span className="text-[12px] text-grey-1">
            Para {CLIENTE.nome}
          </span>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-px bg-porcelain/70 transition-[width] duration-700 ease-heavy" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
      </header>

      <main
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-roledescription="apresentação"
      >
        <div
          key={index}
          className="slide-in absolute inset-0 overflow-y-auto overscroll-contain"
          style={{ '--dir': dir } as React.CSSProperties}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} de ${TOTAL}: ${title}`}
        >
          <Component go={go} />
        </div>
      </main>

      <footer className="relative z-20 shrink-0 border-t border-line">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <a href="https://isla.to" target="_blank" rel="noreferrer" className="flex items-center gap-2 justify-self-start text-[13px] text-grey-1 transition-colors duration-500 hover:text-porcelain">
            <Mark className="h-[14px] w-auto" />
            isla.to
          </a>
          <div className="flex items-center gap-3">
            <NavButton label="Slide anterior" disabled={index === 0} onClick={() => go(index - 1)} flip />
            <span className="min-w-[64px] text-center text-[13px] tabular-nums text-grey-1" aria-live="polite">
              <span className="text-porcelain">{pad(index + 1)}</span> / {pad(TOTAL)}
            </span>
            <NavButton label="Próximo slide" disabled={index === TOTAL - 1} onClick={() => go(index + 1)} />
          </div>
          <button
            onClick={() => setOverview(true)}
            className="flex cursor-pointer items-center gap-2 justify-self-end text-[13px] text-grey-1 transition-colors duration-500 hover:text-porcelain"
            aria-label="Abrir visão geral"
          >
            <GridIcon />
            <span className="hidden md:inline">
              <kbd className="mr-1 rounded border border-line-strong px-1.5 py-0.5 font-sans text-[11px]">O</kbd> visão geral
            </span>
          </button>
        </div>
      </footer>

      {overview && <Overview index={index} onPick={(i) => (go(i), setOverview(false))} onClose={() => setOverview(false)} />}
    </div>
  )
}

function NavButton({ label, onClick, disabled, flip }: { label: string; onClick: () => void; disabled: boolean; flip?: boolean }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-10 cursor-pointer place-items-center rounded-full border border-line-strong text-porcelain transition-all duration-500 ease-heavy hover:border-porcelain/50 hover:bg-porcelain/[0.04] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={flip ? 'rotate-180' : ''} aria-hidden>
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </button>
  )
}

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" />
  </svg>
)

function Overview({ index, onPick, onClose }: { index: number; onPick: (i: number) => void; onClose: () => void }) {
  const current = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    current.current?.focus({ preventScroll: true })
    current.current?.scrollIntoView({ block: 'center' })
  }, [])
  return (
    <div className="fade-in fixed inset-0 z-50 overflow-y-auto bg-ink/95 backdrop-blur-xl" role="dialog" aria-modal aria-label="Visão geral dos slides">
      <div className="container-page py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <p className="eyebrow">Visão geral</p>
          <button onClick={onClose} className="cursor-pointer text-[13px] text-grey-1 transition-colors hover:text-porcelain">
            Fechar <kbd className="ml-1 rounded border border-line-strong px-1.5 py-0.5 font-sans text-[11px]">Esc</kbd>
          </button>
        </div>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SLIDES.map((s, i) => (
            <li key={s.title}>
              <button ref={i === index ? current : undefined} onClick={() => onPick(i)} className="group block w-full cursor-pointer text-left">
                <Thumb active={i === index}>
                  <s.Component go={() => {}} />
                </Thumb>
                <span className="mt-3 flex items-baseline gap-3 text-[13px]">
                  <span className="tabular-nums text-grey-2">{pad(i + 1)}</span>
                  <span className={i === index ? 'text-porcelain' : 'text-grey-1 transition-colors group-hover:text-porcelain'}>{s.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// A miniatura é o próprio slide renderizado em 1440×810 e reduzido, parado e sem interação.
const W = 1440
const H = 810
function Thumb({ active, children }: { active: boolean; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  useLayoutEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      ref={box}
      className={`relative aspect-video overflow-hidden rounded-xl border bg-ink transition-colors duration-500 ${active ? 'border-porcelain/70' : 'border-line group-hover:border-line-strong'}`}
    >
      <div className="thumb pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }} inert>
        <Still.Provider value>{children}</Still.Provider>
      </div>
    </div>
  )
}
