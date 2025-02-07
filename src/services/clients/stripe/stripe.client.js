const ProxyAgent = require('https-proxy-agent')

const StripeBankAccount = require('./StripeBankAccount.class')
const StripeCompany = require('./StripeCompany.class')
const StripePerson = require('./StripePerson.class')
const StripeDirector = require('./StripeDirector.class')
const StripeAccount = require('./StripeAccount.class')
const StripeOrganisationDetails = require('./StripeOrganisationDetails.class')

// Constants
const STRIPE_HOST = process.env.STRIPE_HOST
const STRIPE_FILES_HOST = process.env.STRIPE_FILES_HOST
const STRIPE_PORT = process.env.STRIPE_PORT
const STRIPE_PROTOCOL = process.env.STRIPE_PROTOCOL

// Setup
const stripeConfig = {
  apiVersion: '2020-08-27'
}

if (process.env.http_proxy) {
  stripeConfig.httpAgent = new ProxyAgent(process.env.http_proxy)
}

// only expect host, port and protocol environment variables to be set when running tests
if (STRIPE_HOST) {
  stripeConfig.host = STRIPE_HOST
}
if (STRIPE_PORT) {
  stripeConfig.port = STRIPE_PORT
}
if (STRIPE_PROTOCOL) {
  stripeConfig.protocol = STRIPE_PROTOCOL
}

const stripe = require('stripe')(process.env.STRIPE_ACCOUNT_API_KEY, stripeConfig)

module.exports = {
  updateBankAccount: function (stripeAccountId, body) {
    const bankAccount = new StripeBankAccount(body)
    return stripe.accounts.update(stripeAccountId, bankAccount.basicObject())
  },

  updateOrganisationDetails: function (stripeAccountId, body) {
    const organisationDetails = new StripeOrganisationDetails(body)
    return stripe.accounts.update(stripeAccountId, organisationDetails.basicObject())
  },

  updateCompany: function (stripeAccountId, body) {
    const company = new StripeCompany(body)
    return stripe.accounts.update(stripeAccountId, company.basicObject())
  },

  listPersons: function (stripeAccountId) {
    return stripe.accounts.listPersons(stripeAccountId)
  },

  listBankAccount: function (stripeAccountId) {
    return stripe.accounts.listExternalAccounts(
      stripeAccountId,
      { object: 'bank_account', limit: 1 }
    )
  },

  /**
   * @param stripeAccountId {string}
   * @param stripePersonId {string}
   * @param body {StripePersonParams}
   * @returns {Promise<Stripe.Response<Stripe.Person>>}
   */
  updatePerson: function (stripeAccountId, stripePersonId, body) {
    const stripePerson = new StripePerson(body)
    return stripe.accounts.updatePerson(stripeAccountId, stripePersonId, stripePerson.basicObject())
  },

  /**
   * @param stripeAccountId {string}
   * @param body {StripePersonParams}
   * @returns {Promise<Stripe.Response<Stripe.Person>>}
   */
  createPerson: function (stripeAccountId, body) {
    const stripePerson = new StripePerson(body)
    return stripe.accounts.createPerson(stripeAccountId, stripePerson.basicObject())
  },

  /**
   * @param stripeAccountId {string}
   * @param stripeDirectorId {string}
   * @param body {StripeDirectorParams}
   * @returns {Promise<Stripe.Response<Stripe.Person>>}
   */
  updateDirector: function (stripeAccountId, stripeDirectorId, body) {
    const stripeDirector = new StripeDirector(body)
    return stripe.accounts.updatePerson(stripeAccountId, stripeDirectorId, stripeDirector.basicObject())
  },

  /**
   * @param stripeAccountId {string}
   * @param body {StripeDirectorParams}
   * @returns {Promise<Stripe.Response<Stripe.Person>>}
   */
  createDirector: function (stripeAccountId, body) {
    const stripeDirector = new StripeDirector(body)
    return stripe.accounts.createPerson(stripeAccountId, stripeDirector.basicObject())
  },

  retrieveAccountDetails: function (stripeAccountId) {
    return stripe.accounts.retrieve(stripeAccountId, {
      timeout: 1000
    })
  },

  updateAccount: function (stripeAccountId, body) {
    const stripeAccount = new StripeAccount(body)
    return stripe.accounts.update(stripeAccountId, stripeAccount.basicObject())
  },

  uploadFile: function (fileName, fileType, fileBuffer) {
    return stripe.files.create({
      file: {
        name: fileName,
        data: fileBuffer,
        type: fileType
      },
      purpose: 'identity_document'
    }, STRIPE_FILES_HOST && {
      host: STRIPE_FILES_HOST
    })
  }
}
