import { AuthenticatedRequest } from '@utils/types/express'
import express from 'express'
import { response } from '@utils/response'
import formatPathFor from '@utils/replace-params-in-path'
import paths from '@root/paths'

function get(req: AuthenticatedRequest, res: express.Response) {
  return response(req, res, 'simplified-account/home/all-service-transactions/timeout', {
    noSearchLink: formatPathFor(paths.allServiceTransactions.simplifiedAccount.nosearch, req.params.modeFilter),
  })
}

export { get }
