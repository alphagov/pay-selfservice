import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import * as transactionService from '@services/ledger.service'
import { dateToDefaultFormat } from '@utils/dates'
import * as responseUtils from '@utils/response'
import StreamClient from '@services/clients/stream.client'
import { ParsedQs as ParsedQsType } from 'qs'

interface Account {
  id: string
  payment_provider?: string
  allow_moto?: boolean
  type?: string
}

type ControllerUser = Record<string, unknown>

type CsvFilters = Record<string, string | boolean | ParsedQsType | (string | ParsedQsType)[] | undefined>

function get(req: ServiceRequest, res: ServiceResponse): void {
  const account = req.account as unknown as Account
  const accountId = account.id

  const filters: CsvFilters = { ...(req.query as unknown as CsvFilters) }

  const filename = `GOVUK_Pay_${dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`

  if (account.payment_provider === 'stripe') {
    filters.feeHeaders = true
  }

  filters.motoHeader = Boolean(account.allow_moto)

  const url = transactionService.csvSearchUrl(filters, [accountId])
  const startedAt = Date.now()

  const onData = (chunk: Buffer | string) => res.write(chunk)

  const onComplete = () => {
    const user = (req.user ?? {}) as unknown as ControllerUser
    transactionService.logCsvFileStreamComplete(startedAt, filters, [accountId], user, false, account.type === 'live')
    res.end()
  }

  const onError = () => responseUtils.renderErrorView(req, res, 'Unable to download list of transactions.')

  const client = new StreamClient(onData, onComplete, onError)

  res.setHeader('Content-disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Type', 'text/csv')

  client.request(url)
}

export { get }
