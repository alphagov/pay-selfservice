'use strict'

module.exports.getUserStub = (userExternalId, gatewayAccountIds, serviceExternalId = 'a-service-id', goLiveStage = 'NOT_STARTED') => {
  return {
    name: 'getUserSuccess',
    opts: {
      external_id: userExternalId,
      service_roles: [{
        service: {
          gateway_account_ids: gatewayAccountIds,
          current_go_live_stage: goLiveStage
        }
      }]
    }
  }
}

module.exports.getUserStubWithServiceName = (userExternalId, gatewayAccountIds, serviceName, serviceExternalId = 'a-service-id') => {
  return {
    name: 'getUserSuccess',
    opts: {
      external_id: userExternalId,
      service_roles: [{
        service: {
          external_id: serviceExternalId,
          gateway_account_ids: gatewayAccountIds,
          service_name: serviceName
        }
      }]
    }
  }
}

module.exports.getUserWithNoPermissionsStub = (userExternalId, gatewayAccountIds, serviceExternalId = 'a-service-id', goLiveStage = 'NOT_STARTED') => {
  return {
    name: 'getUserSuccess',
    opts: {
      external_id: userExternalId,
      service_roles: [{
        service: {
          gateway_account_ids: gatewayAccountIds,
          current_go_live_stage: goLiveStage
        },
        role: {
          permissions: []
        }
      }]
    }
  }
}

module.exports.getGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider,
      requires3ds: true
    }
  }
}

module.exports.getGatewayAccountsStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getGatewayAccountsSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}

module.exports.stripeSetupComplete = (gatewayAccountId, bankAccountSubmitted) => {
  return {
    name: 'getGatewayAccountStripeSetupSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      bank_account: true,
      vat_number_company_number: true,
      responsible_person: true
    }
  }
}

module.exports.getDirectDebitGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getDirectDebitGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}

module.exports.getDashboardStatisticsStub = () => {
  return {
    name: 'getDashboardStatisticsStub',
    opts: {}
  }
}

module.exports.getGatewayAccountStripeSetupSuccess = (gatewayAccountId, bankAccount, responsiblePerson, vatNumber) => {
  const stripeSetupStub = {
    name: 'getGatewayAccountStripeSetupSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      bank_account: bankAccount,
      responsible_person: responsiblePerson,
      vat_number_company_number: vatNumber
    }
  }
  return stripeSetupStub
}

module.exports.getStripeAccount = (gatewayAccountId, stripeAccountId) => {
  const stripeAccountStub = {
    name: 'getStripeAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      stripe_account_id: stripeAccountId
    }
  }
  return stripeAccountStub
}
