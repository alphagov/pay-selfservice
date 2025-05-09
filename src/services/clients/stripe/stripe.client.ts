import StripeBankAccount, { StripeBankAccountParams } from './StripeBankAccount.class'
import StripeCompany, { StripeCompanyParams } from './StripeCompany.class'
import StripePerson, { StripePersonParams } from './StripePerson.class'
import StripeDirector, { StripeDirectorParams } from './StripeDirector.class'
import StripeAccount, { StripeAccountParams } from './StripeAccount.class'
import StripeOrganisationDetails, { StripeOrganisationDetailsParams } from './StripeOrganisationDetails.class'
import createHttpsProxyAgent from 'https-proxy-agent'
import Stripe from 'stripe'

// Constants
const STRIPE_HOST = process.env.STRIPE_HOST
const STRIPE_FILES_HOST = process.env.STRIPE_FILES_HOST
const STRIPE_PORT = process.env.STRIPE_PORT
const STRIPE_PROTOCOL = process.env.STRIPE_PROTOCOL

// Setup
const stripeConfig: Stripe.StripeConfig = {
  // @ts-expect-error this api version is not directly compatible with the stripe type defs
  apiVersion: '2020-08-27',
}

if (process.env.http_proxy) {
  stripeConfig.httpAgent = createHttpsProxyAgent(process.env.http_proxy)
}

// only expect host, port and protocol environment variables to be set when running tests
if (STRIPE_HOST) {
  stripeConfig.host = STRIPE_HOST
}
if (STRIPE_PORT) {
  stripeConfig.port = STRIPE_PORT
}
if (STRIPE_PROTOCOL && (STRIPE_PROTOCOL === 'http' || STRIPE_PROTOCOL === 'https')) {
  stripeConfig.protocol = STRIPE_PROTOCOL
}

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY!, stripeConfig)

export = {
  updateBankAccount: function (stripeAccountId: string, body: StripeBankAccountParams) {
    const bankAccount = new StripeBankAccount(body)
    return stripe.accounts.update(stripeAccountId, bankAccount.basicObject() as Stripe.AccountUpdateParams)
  },

  updateOrganisationDetails: function (stripeAccountId: string, body: StripeOrganisationDetailsParams) {
    const organisationDetails = new StripeOrganisationDetails(body)
    return stripe.accounts.update(stripeAccountId, organisationDetails.basicObject() as Stripe.AccountUpdateParams)
  },

  updateCompany: function (stripeAccountId: string, body: StripeCompanyParams) {
    const company = new StripeCompany(body)
    return stripe.accounts.update(stripeAccountId, company.basicObject() as Stripe.AccountUpdateParams)
  },

  listPersons: function (stripeAccountId: string) {
    return stripe.accounts.listPersons(stripeAccountId)
  },

  listBankAccount: function (stripeAccountId: string) {
    return stripe.accounts.listExternalAccounts(stripeAccountId, {
      object: 'bank_account',
      limit: 1,
    }) as Stripe.ApiListPromise<Stripe.BankAccount>
  },

  updatePerson: function (stripeAccountId: string, stripePersonId: string, body: StripePersonParams) {
    const stripePerson = new StripePerson(body)
    return stripe.accounts.updatePerson(
      stripeAccountId,
      stripePersonId,
      stripePerson.basicObject() as Stripe.PersonUpdateParams
    )
  },

  createPerson: function (stripeAccountId: string, body: StripePersonParams) {
    const stripePerson = new StripePerson(body)
    return stripe.accounts.createPerson(stripeAccountId, stripePerson.basicObject() as Stripe.PersonCreateParams)
  },

  updateDirector: function (stripeAccountId: string, stripeDirectorId: string, body: StripeDirectorParams) {
    const stripeDirector = new StripeDirector(body)
    return stripe.accounts.updatePerson(
      stripeAccountId,
      stripeDirectorId,
      stripeDirector.basicObject() as Stripe.PersonUpdateParams
    )
  },

  createDirector: function (stripeAccountId: string, body: StripeDirectorParams) {
    const stripeDirector = new StripeDirector(body)
    return stripe.accounts.createPerson(stripeAccountId, stripeDirector.basicObject() as Stripe.PersonCreateParams)
  },

  retrieveAccountDetails: function (stripeAccountId: string) {
    return stripe.accounts.retrieve(stripeAccountId, {
      timeout: 1000,
    })
  },

  updateAccount: function (stripeAccountId: string, body: StripeAccountParams) {
    const stripeAccount = new StripeAccount(body)
    return stripe.accounts.update(stripeAccountId, stripeAccount.basicObject() as Stripe.AccountUpdateParams)
  },

  uploadFile: function (fileName: string, fileType: string, fileBuffer: Buffer) {
    const fileCreateRequestOptions =
      STRIPE_FILES_HOST && STRIPE_FILES_HOST !== '' ? { host: STRIPE_FILES_HOST } : undefined
    return stripe.files.create(
      {
        file: {
          name: fileName,
          data: fileBuffer,
          type: fileType,
        },
        purpose: 'identity_document',
      },
      fileCreateRequestOptions
    )
  },
}
