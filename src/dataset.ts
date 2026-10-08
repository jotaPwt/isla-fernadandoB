import todas from '../data/todas_empresas_icp_joinville.csv?raw'
import comDecisor from '../data/empresas_com_decisor_joinville.csv?raw'
import decisores from '../data/decisores_joinville.csv?raw'
import metricas from '../data/metricas.json?raw'
import { buildData } from './data.ts'

export const DATA = buildData({ todas, comDecisor, decisores, metricas })
