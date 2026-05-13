import { AuthenticatedRequest } from '@utils/types/express'
import express from 'express'
import { response } from '@utils/response'
import { ViewMode } from '@models/view-mode/ViewMode.class'

function get(req: AuthenticatedRequest & { viewMode: ViewMode }, res: express.Response) {
  return response(req, res, 'simplified-account/home/all-service-transactions/timeout')
}

export { get }
