import * as oneOffCustomerInitiatedCredentials from './credentials/worldpay-credentials.controller'
import * as flexCredentials from './flex-credentials/worldpay-flex-credentials.controller'
import * as recurringCustomerInitiatedCredentials from './recurring-customer-initiated-credentials/recurring-customer-initiated-credentials.controller'
import * as recurringMerchantInitiatedCredentials from './recurring-merchant-initiated-credentials/recurring-merchant-initiated-credentials.controller'

import { response } from '@utils/response'
import WorldpayTasks from '@models/task-workflows/WorldpayTasks.class'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import {
  SESSION_KEY,
  WorldpayDetailsSessionData,
} from '@controllers/simplified-account/settings/worldpay-details/constants'
import _ from 'lodash'

function get(req: ServiceRequest, res: ServiceResponse) {
  const credential = req.account.getCurrentCredential()
  if (!credential) {
    throw new Error(`No valid Worldpay credential found [gateway_account_id: ${req.account.id}]`)
  }
  const worldpayTasks = new WorldpayTasks(req.account, req.service.externalId, credential)

  const context = {
    answers: {},
    currentPsp: req.account.paymentProvider,
    tasks: worldpayTasks.tasks,
    incompleteTasks: worldpayTasks.incompleteTasks(),
    messages: res.locals.flash?.messages ?? [],
    providerSwitchEnabled: req.account.providerSwitchEnabled,
    ...(req.account.providerSwitchEnabled && {
      switchingPsp: req.account.getSwitchingCredential().paymentProvider,
    }),
  }

  if (!worldpayTasks.incompleteTasks()) {
    const { TASK_COMPLETED } = _.get(req, SESSION_KEY, {} as WorldpayDetailsSessionData)
    if (TASK_COMPLETED) {
      context.messages.push({
        state: 'success',
        icon: '&check;',
        heading: 'Service connected to Worldpay',
        body: 'This service can now take payments',
      })
    }
    _.unset(req, SESSION_KEY)

    Object.assign(context.answers, {
      worldpay3dsFlex: req.account.worldpay3dsFlex && {
        href: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
          req.service.externalId,
          req.account.type
        ),
        organisationalUnitId: req.account.worldpay3dsFlex.organisationalUnitId,
        issuer: req.account.worldpay3dsFlex.issuer,
      },
    })
    if (worldpayTasks.hasRecurringTasks()) {
      Object.assign(context.answers, {
        tasksWithMerchantCodeAndUsername: [
          {
            title: 'Recurring customer initiated transaction (CIT) credentials',
            href: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
              req.service.externalId,
              req.account.type,
              credential.externalId
            ),
            merchantCode: credential.credentials.recurringCustomerInitiated!.merchantCode,
            username: credential.credentials.recurringCustomerInitiated!.username,
          },
          {
            title: 'Recurring merchant initiated transaction (MIT) credentials',
            href: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
              req.service.externalId,
              req.account.type,
              credential.externalId
            ),
            merchantCode: credential.credentials.recurringMerchantInitiated!.merchantCode,
            username: credential.credentials.recurringMerchantInitiated!.username,
          },
        ],
      })
    } else {
      Object.assign(context.answers, {
        tasksWithMerchantCodeAndUsername: [
          {
            title: 'Account credentials',
            href: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
              req.service.externalId,
              req.account.type,
              credential.externalId
            ),
            merchantCode: credential.credentials.oneOffCustomerInitiated!.merchantCode,
            username: credential.credentials.oneOffCustomerInitiated!.username,
          },
        ],
      })
    }
  }

  return response(req, res, 'simplified-account/settings/worldpay-details/index', context)
}

export {
  get,
  oneOffCustomerInitiatedCredentials,
  flexCredentials,
  recurringCustomerInitiatedCredentials,
  recurringMerchantInitiatedCredentials,
}
