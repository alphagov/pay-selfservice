import express from 'express'
import { ServiceRequest } from '@utils/types/express'
import _ from 'lodash'
import Service from '@models/service/Service.class'
import GoLiveStage from '@models/constants/go-live-stage'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import PaymentProviders from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import paths from '@root/paths'
import formatServicePathsFor from '@utils/format-service-paths-for'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

const GoLiveInProgressStages = [
  GoLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GoLiveStage.CHOSEN_PSP_STRIPE,
  GoLiveStage.ENTERED_ORGANISATION_ADDRESS,
  GoLiveStage.ENTERED_ORGANISATION_NAME,
  GoLiveStage.GOV_BANKING_MOTO_OPTION_COMPLETED,
]

const GoLiveRequestedStages = [GoLiveStage.TERMS_AGREED_STRIPE, GoLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY]

const ServiceStatus = {
  LIVE: {
    tag: 'Live',
    colour: 'govuk-tag--green',
  },
  GO_LIVE_REQUESTED: {
    tag: 'Not live yet',
    colour: 'govuk-tag--blue',
    text: "Your service is not live. You've requested a live account from the GOV.UK Pay team.",
  },
  GO_LIVE_IN_PROGRESS: (href: string) => {
    return {
      tag: 'Not live yet',
      colour: 'govuk-tag--blue',
      text: 'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.',
      action: {
        href,
        text: 'Continue your request to go live',
      },
    }
  },
  WORLDPAY_TEST: {
    tag: 'Worldpay test',
    colour: 'govuk-tag--blue',
  },
  PSP_ONBOARDING: (href: string) => {
    return {
      tag: 'Not live yet',
      colour: 'govuk-tag--blue',
      text: 'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.',
      action: {
        href,
        text: 'Complete go live',
      },
    }
  },
  NOT_LIVE_YET: (href: string) => {
    return {
      tag: 'Not live yet',
      colour: 'govuk-tag--blue',
      text: 'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.',
      action: {
        href,
        text: 'Ask to go live',
      },
    }
  },
  SANDBOX_MODE: (href: string) => {
    return {
      tag: 'Sandbox mode',
      colour: 'govuk-tag--blue',
      text: "You're in sandbox mode. Some settings are not available. Only test payment data is shown.",
      action: {
        href,
        text: 'Exit sandbox mode',
      },
    }
  },
}

function isServiceRequest(req: express.Request): req is ServiceRequest {
  return 'service' in req && 'account' in req && req.service instanceof Service && req.account instanceof GatewayAccount
}

const determineServiceStatus = (service: Service, account: GatewayAccount) => {
  if (service.currentGoLiveStage === GoLiveStage.LIVE && account.type !== GatewayAccountType.TEST) {
    if (account.getActiveCredential() !== undefined) {
      return ServiceStatus.LIVE
    } else {
      switch (account.paymentProvider) {
        case PaymentProviders.WORLDPAY:
          return ServiceStatus.PSP_ONBOARDING(
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.index,
              service.externalId,
              account.type
            )
          )
        case PaymentProviders.STRIPE:
          return ServiceStatus.PSP_ONBOARDING(
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.stripeDetails.index,
              service.externalId,
              account.type
            )
          )
      }
    }
  }

  if (GoLiveInProgressStages.includes(service.currentGoLiveStage)) {
    return ServiceStatus.GO_LIVE_IN_PROGRESS(
      formatServicePathsFor(paths.service.requestToGoLive.index, service.externalId) as string
    )
  }

  if (account.paymentProvider === PaymentProviders.WORLDPAY && account.type === GatewayAccountType.TEST) {
    return ServiceStatus.WORLDPAY_TEST
  }

  if (service.currentGoLiveStage === GoLiveStage.LIVE && account.type === GatewayAccountType.TEST) {
    return ServiceStatus.SANDBOX_MODE(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        service.externalId,
        GatewayAccountType.LIVE
      )
    )
  }

  if (GoLiveRequestedStages.includes(service.currentGoLiveStage)) {
    return ServiceStatus.GO_LIVE_REQUESTED
  }

  return ServiceStatus.NOT_LIVE_YET(
    formatServicePathsFor(paths.service.requestToGoLive.index, service.externalId) as string
  )
}

const prepareTemplateData = (req: express.Request, controllerData: Record<string, unknown>) => {
  const templateData = _.clone(controllerData)
  if (isServiceRequest(req)) {
    const additionalContext = {
      serviceHeader: {
        serviceName: req.service.serviceName,
        serviceStatus: determineServiceStatus(req.service, req.account),
        serviceUserIsAdmin: req.user.isAdminUserForService(req.service.externalId),
      },
    }
    _.assign(templateData, additionalContext)
  }
  return templateData
}

export { prepareTemplateData }
