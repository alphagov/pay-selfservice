import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import policyBucket from '@controllers/policy/aws-s3-policy-bucket'
import supportedPolicyDocuments from '@controllers/policy/supported-policy-documents'
import createLogger from '@utils/logger'
import { NextFunction } from 'express'

const logger = createLogger(__filename)

async function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const key = 'adyen-fees-2026'
  try {
    const documentConfig: unknown = await supportedPolicyDocuments.lookup(key)
    const downloadLink = await policyBucket.generatePrivateLink(documentConfig)

    logger.info(`Generated link to download document - ${key}`)

    return response(req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/adyen-fees', {
      downloadLink,
    })
  } catch (err) {
    next(err)
  }
}

export = {
  get,
}
