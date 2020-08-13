const getGatewayAccountStripeSetupSuccess = function (opts) {
  let stubOptions = {
    gateway_account_id: opts.gatewayAccountId
  }

  if (opts.responsiblePerson !== undefined) {
    stubOptions.responsible_person = opts.responsiblePerson
  }
  if (opts.bankAccount !== undefined) {
    stubOptions.bank_account = opts.bankAccount
  }
  if (opts.vatNumber !== undefined) {
    stubOptions.vat_number = opts.vatNumber
  }
  if (opts.companyNumber !== undefined) {
    stubOptions.company_number = opts.companyNumber
  }

  return {
    name: 'getGatewayAccountStripeSetupSuccess',
    opts: stubOptions
  }
}

const getGatewayAccountStripeSetupFlagForMultipleCalls = function (opts) {
  let data

  if (opts.companyNumber) {
    data = opts.companyNumber.map(completed => (
      {
        company_number: completed
      }
    ))
  }
  if (opts.vatNumber) {
    data = opts.vatNumber.map(completed => (
      {
        vat_number: completed
      }
    ))
  }
  if (opts.bankAccount) {
    data = opts.bankAccount.map(completed => (
      {
        bank_account: completed
      }
    ))
  }
  if (opts.responsiblePerson) {
    data = opts.responsiblePerson.map(completed => (
      {
        responsible_person: completed
      }
    ))
  }

  return {
    name: 'getGatewayAccountStripeSetupFlagChanged',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      data: data
    }
  }
}

module.exports = {
  getGatewayAccountStripeSetupSuccess,
  getGatewayAccountStripeSetupFlagForMultipleCalls
}
