// Every number in the deck comes from here: the CSVs and metricas.json in /data, nothing typed by hand.
import { parseList, type RawRow } from './parse.ts'

export type Metricas = {
  empresas_icp_universo: number
  empresas_com_decisor: number
  decisores: number
  por_segmento: Record<string, number>
  por_porte: Record<string, number>
  por_senioridade: Record<string, number>
}

export type Raw = { todas: string; comDecisor: string; decisores: string; metricas: string }

export const FAIXAS = ['10-50', '51-200', '201-500'] as const
export type Faixa = (typeof FAIXAS)[number]
export const faixaDe = (n: number): Faixa => (n <= 50 ? '10-50' : n <= 200 ? '51-200' : '201-500')
export const FAIXA_LABEL: Record<Faixa, string> = { '10-50': '10 a 50', '51-200': '51 a 200', '201-500': '201 a 500' }

export const SENIORIDADE_LABEL: Record<string, string> = {
  director: 'Diretoria',
  c_suite: 'C-level',
  owner: 'Dono',
  founder: 'Fundador',
  partner: 'Sócio',
}

// Curadoria da amostra. Ficam de fora perfis que são a página da empresa, cargos sem decisão sobre
// benefício e empresas que não são indústria. ponytail: listas explícitas, revisar à mão se a base mudar.
const NOMES_DE_EMPRESA = new Set([
  'Adesso Plasticos', 'Brasiled Ltda', 'Azzo Brasil', 'Darc Caldeiraria', 'Relacionamento Hidrofiltros',
  'Industrial Ltda', 'Wox Pinturas', 'Unik Solucoes', 'Silkart Estamparia', 'Tecelagem Catarinense',
  'Vidracaria Castelo', 'Exclusiva Adriano', 'Eng Santos', 'Lourival', 'James Plasticoville', 'Fernando Opabier',
  'Olivio Soutex',
])
const CARGO_SEM_DECISAO = /business partner|people & culture|escritur|product owner|comptroller|conselho|board member/i
// Escritório de advocacia, equipe universitária, venda de arquivo digital e consultoria de engenharia.
const EMPRESAS_FORA_DO_ICP = new Set(['Caminha Advogados', 'Fórmula CEM', 'STLFLIX', 'Pixida do Brasil'])
const PESO: Record<string, number> = { founder: 1.5, owner: 1.5, c_suite: 1, partner: 1, vp: 1, director: 0 }
// Benefício costuma passar por gestão geral, administração ou pessoas; TI e engenharia ficam por último.
const CARGO_DE_GESTAO = /geral|general|managing|executiv|administrativ|rh|pessoas|people|operations|operac/i
const CARGO_TECNICO = /ti|técnic|technical|engenharia|engineering|creative|industrial director/i
const peso = (d: RawRow) => (PESO[d.senioridade] ?? 0) + (CARGO_DE_GESTAO.test(d.cargo) ? 0.3 : 0) - (CARGO_TECNICO.test(d.cargo) ? 0.3 : 0)
export const TAMANHO_AMOSTRA = 50

export type Decisor = { nome: string; cargo: string; senioridade: string; linkedin: string }
export type EmpresaAmostra = {
  empresa: string
  linkedinEmpresa: string
  segmento: string
  funcionarios: number
  faixa: Faixa
  decisor: Decisor
  outros: number
}

const decodeHtml = (s: string) => s.replace(/&amp;/g, '&')

export function buildData(raw: Raw) {
  const metricas = JSON.parse(raw.metricas) as Metricas
  const todas = parseList(raw.todas)
  const comDecisor = parseList(raw.comDecisor)
  const decisores = parseList(raw.decisores)

  const funcionarios = comDecisor.map((r) => Number(r.funcionarios_estimados))
  const ordenados = [...funcionarios].sort((a, b) => a - b)
  const mediana = ordenados[Math.floor(ordenados.length / 2)]

  const porFaixa = Object.fromEntries(FAIXAS.map((f) => [f, { empresas: 0, colaboradores: 0 }])) as Record<Faixa, { empresas: number; colaboradores: number }>
  for (const n of funcionarios) {
    porFaixa[faixaDe(n)].empresas++
    porFaixa[faixaDe(n)].colaboradores += n
  }

  const totais = {
    empresasIcp: todas.length,
    empresasComDecisor: comDecisor.length,
    decisores: decisores.length,
    donosEFundadores: decisores.filter((d) => d.senioridade === 'founder' || d.senioridade === 'owner').length,
    colaboradores: funcionarios.reduce((a, b) => a + b, 0),
    mediana,
    comMaisDeUmDecisor: comDecisor.filter((r) => Number(r.decisores_mapeados) > 1).length,
  }

  const segmentos = Object.entries(metricas.por_segmento).sort((a, b) => b[1] - a[1])
  const sen = metricas.por_senioridade
  const senioridade = Object.entries(sen)
    .filter(([k]) => k in SENIORIDADE_LABEL)
    .map(([k, v]) => [SENIORIDADE_LABEL[k], v] as [string, number])
    .sort((a, b) => b[1] - a[1])
  const outros = Object.entries(sen).filter(([k]) => !(k in SENIORIDADE_LABEL))
  if (outros.length) senioridade.push(['Outros', outros.reduce((a, [, v]) => a + v, 0)])

  return { metricas, totais, porFaixa, segmentos, senioridade, amostra: amostra(comDecisor, decisores) }
}

function amostra(comDecisor: RawRow[], decisores: RawRow[]): EmpresaAmostra[] {
  const porEmpresa = new Map<string, RawRow[]>()
  for (const d of decisores) porEmpresa.set(d.linkedin_empresa, [...(porEmpresa.get(d.linkedin_empresa) ?? []), d])

  const vistas = new Set<string>()
  return comDecisor
    .filter((e) => !EMPRESAS_FORA_DO_ICP.has(e.empresa))
    .flatMap((e) => {
      const validos = (porEmpresa.get(e.linkedin_empresa) ?? []).filter(
        (d) => !NOMES_DE_EMPRESA.has(d.nome) && !CARGO_SEM_DECISAO.test(d.cargo) && d.linkedin_pessoa.startsWith('https://'),
      )
      // Uma pessoa por nome: a base repete alguns decisores.
      const unicos = [...new Map(validos.map((d) => [d.nome, d])).values()].sort((a, b) => peso(b) - peso(a))
      if (!unicos.length) return []
      const n = Number(e.funcionarios_estimados)
      const best = unicos[0]
      // Quem decide sozinho pesa mais; empresa maior rende mais colaboradores. ponytail: heurística simples, ajustar com o Fernando.
      const score = Math.log(n) + peso(best)
      return [{
        score,
        empresa: e.empresa,
        linkedinEmpresa: e.linkedin_empresa,
        segmento: e.segmento,
        funcionarios: n,
        faixa: faixaDe(n),
        decisor: { nome: best.nome, cargo: decodeHtml(best.cargo), senioridade: best.senioridade, linkedin: best.linkedin_pessoa },
        outros: unicos.length - 1,
      }]
    })
    .sort((a, b) => b.score - a.score)
    .filter((e) => {
      // A mesma indústria aparece com duas páginas no LinkedIn (ex.: Cromotransfer); fica a de melhor nota.
      const key = e.empresa.toLowerCase().replace(/\b(ltda|s\/?a)\b\.?/g, '').trim()
      if (vistas.has(key)) return false
      vistas.add(key)
      return true
    })
    .slice(0, TAMANHO_AMOSTRA)
    .map(({ score: _score, ...e }) => e)
}

export type Data = ReturnType<typeof buildData>
