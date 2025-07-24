import { AgreementData } from '@models/agreements/dto/Agreement.dto'

export interface AgreementsSearchData {
  total: number
  count: number
  page: number
  results: AgreementData[]
  _links: Record<string, Record<string, string>>
}
