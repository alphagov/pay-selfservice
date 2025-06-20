import { STRIPE, WORLDPAY } from '@models/constants/payment-providers'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'
import WorldpayTasks from '@models/task-workflows/WorldpayTasks.class'
import StripeTasks from '@models/StripeTasks.class'
import { getConnectorStripeAccountSetup } from '@services/stripe-details.service'
import { InvalidConfigurationError, TaskAccessedOutOfSequenceError } from '@root/errors'
import TaskStatus from '@models/constants/task-status'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

async function canStartPspPaymentVerificationTask(req: ServiceRequest, _: ServiceResponse, next: NextFunction) {
  const gatewayAccount = req.account
  const service = req.service
  const credential = gatewayAccount.getSwitchingCredential()
  let tasks: WorldpayTasks | StripeTasks
  let errorPath: string
  switch (credential.paymentProvider) {
    case WORLDPAY:
      tasks = new WorldpayTasks(gatewayAccount, service.externalId, credential)
      errorPath = paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      break
    case STRIPE:
      tasks = new StripeTasks(
        await getConnectorStripeAccountSetup(service.externalId, gatewayAccount.type),
        gatewayAccount,
        service.externalId
      )
      errorPath = paths.simplifiedAccount.settings.switchPsp.switchToStripe.index
      break
    default:
      return next(
        new InvalidConfigurationError(
          `Could not determine switching payment provider for service [service_external_id: ${service.externalId}]`
        )
      )
  }
  const thisTask = tasks.findTaskById('make-a-live-payment')
  if (thisTask.status === TaskStatus.NOT_STARTED) {
    return next()
  } else {
    return next(
      new TaskAccessedOutOfSequenceError(
        `Attempted to access task page before completing requisite tasks [task: ${thisTask.id}, serviceExternalId: ${service.externalId}]`,
        formatServiceAndAccountPathsFor(errorPath, service.externalId, gatewayAccount.type)
      )
    )
  }
}

export = canStartPspPaymentVerificationTask
