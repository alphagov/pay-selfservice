import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import lodash from 'lodash'
import { response } from '@utils/response'
import { SESSION_KEY } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const prototypeLink = lodash.get(req, SESSION_KEY, '')

  const context = {
    prototypeLink,
    prototypesLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.testWithYourUsers.links,
      req.service.externalId,
      req.account.type
    ),
  }

  return response(req, res, 'simplified-account/services/test-with-your-users/confirm', context)
}

export { get }
