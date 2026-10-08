import { createContext, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Mark, Rise } from './ui/kit'
import { DATA } from './dataset'
import { FAIXAS, FAIXA_LABEL, type Faixa } from './data'
import { CLIENTE } from './config'

const { totais, porFaixa, segmentos, senioridade, amostra } = DATA

/** Miniaturas da visão geral: tudo parado, já no valor final. */
export const Still = createContext(false)

const num = (n: number) => n.toLocaleString('pt-BR')
const share = (a: number, b: number) => Math.round((a / b) * 100)
// As contagens vêm de uma varredura em fonte pública: mostramos o piso arredondado ("400+"), nunca o número cravado.
const piso = (n: number) => (n >= 1000 ? Math.floor(n / 1000) : n >= 100 ? Math.floor(n / 10) * 10 : Math.floor(n / 5) * 5)
const sufixo = (n: number) => (n >= 1000 ? ' mil+' : '+')
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function useCountUp(to: number, ms = 1600) {
  const still = useContext(Still) || reducedMotion()
  const [v, setV] = useState(still ? to : 0)
  useEffect(() => {
    if (still) return setV(to)
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, still])
  return v
}
const Aprox = ({ n }: { n: number }) => (
  <>
    {num(useCountUp(piso(n)))}
    {sufixo(n)}
  </>
)

// ---------- Layout ----------

function Frame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`container-page flex min-h-full flex-col justify-center py-10 md:py-14 ${className}`}>{children}</section>
}

function Head({ eyebrow, title, lede, className = '' }: { eyebrow: string; title: string; lede?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow fade-up">{eyebrow}</p>
      <Rise as="h2" text={title} className="text-h2 mt-5" />
      {lede && (
        <p className="text-lede fade-up mt-5 max-w-xl" style={{ animationDelay: '180ms' }}>
          {lede}
        </p>
      )}
    </div>
  )
}

function Bars({ rows, delay = 200 }: { rows: [string, number][]; delay?: number }) {
  const max = Math.max(...rows.map(([, v]) => v))
  return (
    <ul className="space-y-3.5">
      {rows.map(([label, v], i) => (
        <li key={label} className="grid grid-cols-[minmax(0,8.5rem)_1fr_3rem] items-center gap-4 sm:grid-cols-[minmax(0,11rem)_1fr_3rem]">
          <span className={`truncate text-[14px] ${i < 2 ? 'text-porcelain' : 'text-grey-1'}`} title={label}>
            {label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-porcelain/[0.06]">
            <span
              className={`bar-grow block h-full rounded-full ${i < 2 ? 'bg-porcelain' : 'bg-porcelain/35'}`}
              style={{ width: `${(v / max) * 100}%`, animationDelay: `${delay + 120 + i * 60}ms` }}
            />
          </span>
          <span className="text-right font-display text-[22px] leading-none tabular-nums">{v}%</span>
        </li>
      ))}
    </ul>
  )
}

type SlideProps = { go: (i: number) => void }

// ---------- 01 Capa ----------

function Capa() {
  return (
    <Frame className="relative">
      <Mark className="pointer-events-none absolute right-[var(--gutter)] top-1/2 hidden h-[min(52vh,440px)] w-auto -translate-y-1/2 text-porcelain/[0.05] lg:block" />
      <p className="eyebrow fade-up">Joinville, SC</p>
      <Rise text={`${CLIENTE.nome}, o seu ICP *está no LinkedIn*.`} className="text-h1 mt-6 max-w-4xl" />
      <p className="text-lede fade-up mt-8 max-w-lg" style={{ animationDelay: '500ms' }}>
        Depois da nossa call, fomos ver quem decide nas empresas que você quer atender em Joinville. Olha o que apareceu.
      </p>
      <p className="fade-up mt-12 text-[13px] text-grey-2" style={{ animationDelay: '700ms' }}>
        Use as setas ou deslize para avançar.
      </p>
    </Frame>
  )
}

// ---------- 02 Números ----------

function Painel() {
  const cards: { n: number; label: string }[] = [
    { n: totais.empresasIcp, label: 'indústrias de Joinville no perfil' },
    { n: totais.empresasComDecisor, label: 'com quem decide identificado' },
    { n: totais.decisores, label: 'decisores com perfil ativo' },
    { n: totais.donosEFundadores, label: 'donos ou fundadores' },
  ]
  return (
    <Frame>
      <Head eyebrow="O que a gente achou" title="Quem decide *já está lá*." className="max-w-3xl" />
      <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <li key={c.label} className="card fade-up flex flex-col rounded-3xl p-6 md:p-7" style={{ animationDelay: `${200 + i * 90}ms` }}>
            <span className="font-display text-[72px] leading-[0.9] tracking-[-0.035em] tabular-nums md:text-[96px]">
              <Aprox n={c.n} />
            </span>
            <span className="mt-6 text-[15px] text-grey-1">{c.label}</span>
          </li>
        ))}
      </ul>
      <p className="fade-up mt-6 text-[13px] text-grey-2" style={{ animationDelay: '600ms' }}>
        Primeira leitura em perfis públicos. Os números são aproximados.
      </p>
    </Frame>
  )
}

// ---------- 03 Perfil ----------

const TOP_SETORES = 5

function Perfil() {
  const base = totais.empresasComDecisor
  const outros = segmentos.slice(TOP_SETORES).reduce((a, [, v]) => a + v, 0)
  const setores = [...segmentos.slice(0, TOP_SETORES), ['Outros', outros] as [string, number]].map(([k, v]) => [k, share(v, base)] as [string, number])
  const cargos = senioridade.map(([k, v]) => [k, share(v, totais.decisores)] as [string, number])
  const pequenas = Math.round((porFaixa['10-50'].empresas / base) * 10)
  return (
    <Frame>
      <Head
        eyebrow="Quem são"
        title="Indústria pequena, *com dono por perto*."
        lede={`${pequenas} em cada 10 têm até 50 pessoas. A maior parte trabalha com máquinas e metal.`}
        className="max-w-3xl"
      />
      <div className="mt-12 grid gap-3 lg:grid-cols-2">
        <div className="card fade-up rounded-3xl p-6 md:p-8" style={{ animationDelay: '250ms' }}>
          <p className="mb-6 text-[13px] text-grey-1">Setor das empresas</p>
          <Bars rows={setores} delay={250} />
        </div>
        <div className="card fade-up rounded-3xl p-6 md:p-8" style={{ animationDelay: '350ms' }}>
          <p className="mb-6 text-[13px] text-grey-1">Cargo de quem decide</p>
          <Bars rows={cargos} delay={350} />
        </div>
      </div>
    </Frame>
  )
}

// ---------- 04 Amostra ----------

const POR_PAGINA = 10
const SENIORIDADE_TAG: Record<string, string> = { founder: 'Fundador', owner: 'Dono', c_suite: 'C-level', partner: 'Sócio', vp: 'VP', director: 'Diretoria' }
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function Amostra() {
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState('')
  const [faixa, setFaixa] = useState<Faixa | ''>('')
  const [page, setPage] = useState(0)
  const segs = useMemo(() => [...new Set(amostra.map((e) => e.segmento))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [])
  const shown = useMemo(() => {
    const t = norm(q.trim())
    return amostra
      .map((e, i) => ({ ...e, rank: i + 1 }))
      .filter((e) => (!seg || e.segmento === seg) && (!faixa || e.faixa === faixa) && (!t || norm(`${e.empresa} ${e.decisor.nome} ${e.decisor.cargo}`).includes(t)))
  }, [q, seg, faixa])
  const pages = Math.max(1, Math.ceil(shown.length / POR_PAGINA))
  const p = Math.min(page, pages - 1)
  const rows = shown.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA)
  const filtering = !!(q || seg || faixa)
  const reset = () => (setQ(''), setSeg(''), setFaixa(''), setPage(0))

  return (
    <Frame className="lg:py-8">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Head
            eyebrow="Uma amostra"
            title="Com nome, cargo *e perfil*."
            lede={`Separamos ${amostra.length} empresas em que quem decide é dono, fundador ou C-level. Pode clicar e conferir.`}
          />
          <p className="fade-up mt-6 max-w-sm text-[13px] leading-relaxed text-grey-2" style={{ animationDelay: '250ms' }}>
            A lista completa vai à parte.
          </p>
        </div>

        <div className="fade-up min-w-0 lg:col-span-8" style={{ animationDelay: '200ms' }} data-noswipe>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input className="field" type="search" placeholder="Buscar empresa ou pessoa" value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} aria-label="Buscar empresa ou pessoa" />
            <select className="field sm:w-52" value={seg} onChange={(e) => (setSeg(e.target.value), setPage(0))} aria-label="Filtrar por setor">
              <option value="">Todos os setores</option>
              {segs.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="field sm:w-44" value={faixa} onChange={(e) => (setFaixa(e.target.value as Faixa | ''), setPage(0))} aria-label="Filtrar por porte">
              <option value="">Todos os portes</option>
              {FAIXAS.map((f) => (
                <option key={f} value={f}>
                  {FAIXA_LABEL[f]} pessoas
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <div className="hidden grid-cols-[2.25rem_minmax(0,1.15fr)_minmax(0,1fr)_6.5rem] gap-4 border-b border-line bg-ink-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-grey-2 md:grid">
              <span>#</span>
              <span>Empresa</span>
              <span>Quem decide</span>
              <span className="text-right">Perfil</span>
            </div>
            {rows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-display text-[24px]">Nenhuma empresa com esses filtros.</p>
                <button onClick={reset} className="mt-3 cursor-pointer text-[13px] text-grey-1 underline underline-offset-4 hover:text-porcelain">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((e) => (
                  <li key={e.empresa} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 gap-y-2 px-4 py-2 leading-snug transition-colors duration-300 hover:bg-porcelain/[0.025] md:grid-cols-[2.25rem_minmax(0,1.15fr)_minmax(0,1fr)_6.5rem] md:items-center">
                    <span className="pt-0.5 text-[12px] tabular-nums text-grey-2 md:pt-0">{String(e.rank).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <a href={e.linkedinEmpresa} target="_blank" rel="noreferrer" className="block truncate text-[14px] text-porcelain hover:underline hover:underline-offset-4" title={e.empresa}>
                        {e.empresa}
                      </a>
                      <p className="truncate text-[12px] text-grey-2">
                        {e.segmento}, {num(e.funcionarios)} pessoas
                      </p>
                    </div>
                    <div className="col-start-2 min-w-0 md:col-start-auto">
                      <p className="flex items-center gap-2 text-[14px]">
                        <span className="truncate" title={e.decisor.nome}>{e.decisor.nome}</span>
                        <span className="shrink-0 rounded-full border border-line px-1.5 py-px text-[10px] text-grey-1">{SENIORIDADE_TAG[e.decisor.senioridade] ?? e.decisor.senioridade}</span>
                      </p>
                      <p className="truncate text-[12px] text-grey-2" title={e.decisor.cargo}>
                        {e.decisor.cargo}
                      </p>
                    </div>
                    <div className="col-start-2 md:col-start-auto md:text-right">
                      <a
                        href={e.decisor.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[12px] text-porcelain transition-all duration-500 ease-heavy hover:border-porcelain/50 hover:bg-porcelain/[0.04]"
                        aria-label={`Abrir LinkedIn de ${e.decisor.nome}`}
                      >
                        LinkedIn
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                          <path d="M3 7l4-4M3.5 3H7v3.5" stroke="currentColor" strokeWidth="1.1" />
                        </svg>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-[13px] text-grey-1">
            <span>{filtering ? `${shown.length} de ${amostra.length} empresas` : `${amostra.length} empresas`}</span>
            <div className="flex items-center gap-1">
              <button disabled={p === 0} onClick={() => setPage(p - 1)} className="h-8 cursor-pointer rounded-full px-3 transition-colors hover:text-porcelain disabled:pointer-events-none disabled:opacity-30">
                Anterior
              </button>
              <span className="min-w-[56px] text-center tabular-nums text-porcelain">
                {p + 1} de {pages}
              </span>
              <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="h-8 cursor-pointer rounded-full px-3 transition-colors hover:text-porcelain disabled:pointer-events-none disabled:opacity-30">
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

// ---------- 05 Por onde começar ----------

function PorOndeComecar() {
  const passos: [string, string][] = [
    [`Os ${piso(totais.donosEFundadores)}+ donos e fundadores`, 'São a primeira leva, porque a decisão costuma estar na mão deles.'],
    ['Conteúdo para quem toca a fábrica', 'Posts no seu perfil pensados para quem cuida de gente na indústria, que é onde está a maior parte da lista.'],
    ['Abordagem quando eles te notarem', 'Quando alguém da lista interagir com você, a conversa começa com contexto, sem cara de prospecção fria.'],
  ]
  return (
    <Frame>
      <Head eyebrow="Com esta lista" title="Por onde a gente *começaria*." className="max-w-3xl" />
      <ol className="mt-12 grid gap-3 md:grid-cols-3">
        {passos.map(([t, d], i) => (
          <li key={t} className="card fade-up flex flex-col rounded-3xl p-7" style={{ animationDelay: `${250 + i * 100}ms` }}>
            <span className="font-display text-[44px] leading-none text-grey-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-h3 mt-8">{t}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-grey-1">{d}</p>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

// ---------- 06 Fechamento ----------

function Fechamento({ go }: SlideProps) {
  return (
    <Frame className="items-start">
      <Mark className="fade-up h-10 w-auto text-porcelain" />
      <Rise text={`Valeu, *${CLIENTE.nome}*.`} className="text-h1 mt-10" />
      <p className="text-lede fade-up mt-6 max-w-lg" style={{ animationDelay: '300ms' }}>
        Foi bom conversar com você. Seguimos daqui.
      </p>
      <button onClick={() => go(0)} className="fade-up mt-10 cursor-pointer text-[14px] text-grey-1 underline-offset-4 transition-colors duration-500 hover:text-porcelain hover:underline" style={{ animationDelay: '450ms' }}>
        Voltar ao início
      </button>
    </Frame>
  )
}

export const SLIDES: { title: string; Component: ComponentType<SlideProps> }[] = [
  { title: 'O seu ICP está no LinkedIn', Component: Capa },
  { title: 'Quem decide já está lá', Component: Painel },
  { title: 'Quem são', Component: Perfil },
  { title: 'Uma amostra', Component: Amostra },
  { title: 'Por onde começar', Component: PorOndeComecar },
  { title: 'Fechamento', Component: Fechamento },
]
