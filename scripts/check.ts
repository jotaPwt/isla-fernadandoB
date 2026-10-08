// Os números do deck batem com os arquivos? `npm run check`
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { buildData, FAIXAS } from '../src/data.ts'

const read = (f: string) => readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8')
const d = buildData({
  todas: read('todas_empresas_icp_joinville.csv'),
  comDecisor: read('empresas_com_decisor_joinville.csv'),
  decisores: read('decisores_joinville.csv'),
  metricas: read('metricas.json'),
})
const m = d.metricas
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

assert.equal(d.totais.empresasIcp, m.empresas_icp_universo)
assert.equal(d.totais.empresasComDecisor, m.empresas_com_decisor)
assert.equal(d.totais.decisores, m.decisores)
assert.equal(d.totais.donosEFundadores, m.por_senioridade.founder + m.por_senioridade.owner)
assert.equal(sum(m.por_segmento), m.empresas_com_decisor)
assert.equal(sum(m.por_senioridade), m.decisores)
for (const f of FAIXAS) assert.equal(d.porFaixa[f].empresas, m.por_porte[f], `faixa ${f}`)
assert.equal(d.senioridade.reduce((a, [, v]) => a + v, 0), m.decisores)
assert.equal(d.amostra.length, 50)
assert.ok(d.amostra.every((e) => e.decisor.linkedin.includes('linkedin.com/in/')))
assert.equal(new Set(d.amostra.map((e) => e.empresa)).size, 50)

console.log('ok', d.totais)
for (const [i, e] of d.amostra.entries()) console.log(String(i + 1).padStart(2), e.empresa, '|', e.funcionarios, '|', e.decisor.nome, '-', e.decisor.cargo, `(+${e.outros})`)
