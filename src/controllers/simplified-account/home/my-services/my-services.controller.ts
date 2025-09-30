import { response } from '@utils/response'
import express from 'express'
import paths, { formattedPathFor } from '@root/paths'
import { getGatewayAccountsByIds } from '@services/gateway-accounts.service'
import {
  sortByLiveThenName,
  ViewFlags,
  mergeServicesWithGatewayAccounts,
} from '@utils/simplified-account/home/my-services/service-presentation-utils'
import User from '@models/user/User.class'

async function get(
  req: express.Request & {
    user: User
  },
  res: express.Response & {
    locals: express.Response['locals'] & {
      flash?: Record<string, string[]>
    }
  }
) {
  const userServiceRoles = req.user.serviceRoles
  const flags = {} as ViewFlags

  if (res.locals.flash?.inviteSuccessServiceId?.[0]) {
    flags.recentlyInvitedServiceExternalId = res.locals.flash.inviteSuccessServiceId[0]
  }

  const gatewayAccountIds = userServiceRoles.flatMap((role) => {
    if (Array.isArray(role?.service?.gatewayAccountIds)) {
      return role.service.gatewayAccountIds.map((id) => parseInt(id))
    }
    return []
  })

  let services
  if (gatewayAccountIds.length > 0) {
    const gatewayAccounts = await getGatewayAccountsByIds(gatewayAccountIds)
    services = mergeServicesWithGatewayAccounts(userServiceRoles, gatewayAccounts, flags).sort((a, b) =>
      sortByLiveThenName(a, b)
    )
  }

  const pathFilter = flags.hasLiveAccount ? 'live' : 'test'

  return response(req, res, 'simplified-account/home/my-services/index', {
    createServicePath: paths.services.create.index,
    allServiceTransactionsPath: formattedPathFor(paths.allServiceTransactions.indexStatusFilter, pathFilter) as string,
    payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, pathFilter) as string,
    services,
    flags,
    messages: [
      ...(res.locals?.flash?.messages ?? []),
      ...(flags.recentlyInvitedServiceName
        ? [
            {
              state: 'success',
              icon: '&check;',
              heading: 'You have been added to ' + flags.recentlyInvitedServiceName,
            },
          ]
        : []),
    ],
  })
}

export { get }
