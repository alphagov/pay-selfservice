'use strict'

const proxyquire = require('proxyquire')
const { assert, expect } = require('chai')
const { validateMandatoryField } = require('../../utils/validation/server-side-form-validations')

let addNewCapabilitiesMock, retrieveAccountDetailsMock
let setStripeAccountSetupFlagMock, disableCollectAdditionalKycMock

describe('Stripe setup util', () => {
  const account = {
    gateway_account_id: 'account-123',
    gateway_account_credentials: [
      {
        payment_provider: 'worldpay',
        state: 'ACTIVE'
      },
      {
        payment_provider: 'stripe',
        state: 'VERIFIED_WITH_LIVE_PAYMENT',
        credentials: {
          stripe_account_id: 'new-stripe-account-id-123'
        }
      }
    ]
  }

  describe('Get Stripe account ID', () => {
    it('should return stripe account ID for the account from connector', async () => {
      const stripeAccountId = await getStripeSetupUtil().getStripeAccountId(account, false, 'req-id')
      assert(stripeAccountId === 'acct_123example123')
    })

    it('should return stripe account ID from switching credential when switching PSP', async () => {
      const stripeAccountId = await getStripeSetupUtil().getStripeAccountId(account, true, 'req-id')
      assert(stripeAccountId === 'new-stripe-account-id-123')
    })
  })

  describe('Validate DOB', () => {
    it('should return error message for invalid date of birth', () => {
      const result = getStripeSetupUtil().validateDoB(1, 1, 1)
      assert(result === 'Year must have 4 numbers')
    })
    it('should not return error message for valid date of birth', () => {
      const result = getStripeSetupUtil().validateDoB(1, 1, 1990)
      assert(result === null)
    })
  })

  describe('Get form fields from request body', () => {
    it('should return form fields specified', () => {
      const requestBody = {
        first_name: 'Jane',
        last_name: 'Doe',
        csrfToken: 'csrf_123'
      }
      const formFields = ['first_name', 'last_name']
      const result = getStripeSetupUtil().getFormFields(requestBody, formFields)

      expect(result).to.deep.equal({ first_name: 'Jane', last_name: 'Doe' })
    })
    it('should return fields with spaces trimmed', () => {
      const requestBody = {
        first_name: '   Jane    ',
        csrfToken: 'csrf_123'
      }
      const formFields = ['first_name']
      const result = getStripeSetupUtil().getFormFields(requestBody, formFields)

      expect(result).to.deep.equal({ first_name: 'Jane' })
    })
    it('should return empty value if field does not exist', () => {
      const requestBody = {
        csrfToken: 'csrf_123'
      }
      const formFields = ['non_existing_form_field']
      const result = getStripeSetupUtil().getFormFields(requestBody, formFields)

      expect(result).to.deep.equal({ non_existing_form_field: '' })
    })
    it('should return empty value for form field when request body is empty ', () => {
      const formFields = ['first_name']
      const result = getStripeSetupUtil().getFormFields(null, formFields)

      expect(result).to.deep.equal({ first_name: '' })
    })
  })

  describe('Validate field', () => {
    it('should return error message if field validator returns value as not valid', () => {
      const result = getStripeSetupUtil().validateField('', validateMandatoryField, 1)
      assert(result === 'This field cannot be blank')
    })
    it('should not return error message for valid value', () => {
      const result = getStripeSetupUtil().validateField('field_value_1', validateMandatoryField, 13)
      assert(result === null)
    })
  })
})

function getStripeSetupUtil () {
  return proxyquire('./stripe-setup.util', {
    '../../services/clients/stripe/stripe.client': {
      addNewCapabilities: addNewCapabilitiesMock,
      retrieveAccountDetails: retrieveAccountDetailsMock
    },
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccount = () => Promise.resolve({
          stripeAccountId: 'acct_123example123'
        })
        this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        this.disableCollectAdditionalKyc = disableCollectAdditionalKycMock
      }
    }
  })
}
