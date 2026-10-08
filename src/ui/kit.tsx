import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { MARK_PATH } from '../islaMark'

type Variant = 'primary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-500 ease-heavy active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'
const variants: Record<Variant, string> = {
  primary:
    'bg-porcelain text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:shadow-[0_0_40px_rgb(245_245_242/0.22)]',
  ghost: 'border border-line-strong text-porcelain hover:border-porcelain/50 hover:bg-porcelain/[0.04]',
  quiet: 'text-grey-1 hover:text-porcelain',
}
const sizes: Record<Size, string> = { sm: 'h-9 px-4 text-[13px]', md: 'h-11 px-5 text-[14px]', lg: 'h-[52px] px-7 text-[15px]' }

export function Button({
  variant = 'primary', size = 'md', arrow, className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  )
}

export const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-500 ease-heavy group-hover:translate-x-0.5">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.25" />
  </svg>
)

export const Mark = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 840 805" className={className} aria-hidden>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d={MARK_PATH}
    />
  </svg>
)

/** Heading whose words rise out of a mask. Wrap the emphasised phrase in *asterisks*. */
export function Rise({ text, as: Tag = 'h1', className = '' }: { text: string; as?: 'h1' | 'h2'; className?: string }) {
  const parts = text.split(/(\*[^*]+\*)/).filter(Boolean)
  let i = 0
  const words = (s: string, italic: boolean): ReactNode[] =>
    s.split(/(\s+)/).map((w, k) =>
      /^\s+$/.test(w) ? (
        w
      ) : (
        <span key={`${i}-${k}`} className="rise-mask">
          <span className="rise-word" style={{ animationDelay: `${i++ * 60}ms` }}>
            {italic ? <em>{w}</em> : w}
          </span>
        </span>
      ),
    )
  return (
    <Tag className={className}>
      {parts.map((p) => (p.startsWith('*') ? words(p.slice(1, -1), true) : words(p, false)))}
    </Tag>
  )
}

export function LinkButton({
  variant = 'primary', size = 'md', arrow, className = '', children, ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
      {arrow && <Arrow />}
    </a>
  )
}
