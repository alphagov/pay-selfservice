'use strict'
const paths = require('../../../paths')

const controller = require('./post.controller')
const { updateBankAccount } = require('../../../services/clients/stripe/stripe.client')
const { ConnectorClient } = require('../../../services/clients/connector.client')

jest.mock('../../../services/clients/stripe/stripe.client')

describe('Bank details post controller', () => {
  const rawAccountNumber = '00012345'
  const rawSortCode = '10 - 88 - 00'
  const sanitisedAccountNumber = '00012345'
  const sanitisedSortCode = '108800'

  let req
  let res

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      },
      body: {
        'account-number': rawAccountNumber,
        'sort-code': rawSortCode,
        'answers-checked': true
      }
    }
    res = {
      setHeader: jest.fn(),
      status: jest.fn(),
      redirect: jest.fn(),
      render: jest.fn(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
        }
      }
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call stripe and connector and redirect to add psp account details redirect route', async () => {
    updateBankAccount.mockResolvedValue()
    const setStripeAccountFlagSpy = jest.spyOn(ConnectorClient.prototype, 'setStripeAccountSetupFlag')
      .mockResolvedValue()

    await controller(req, res)

    expect(updateBankAccount).toHaveBeenCalledWith(res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    expect(setStripeAccountFlagSpy).toHaveBeenCalledWith(req.account.gateway_account_id, 'bank_account', req.correlationId)
    expect(res.redirect).toHaveBeenCalledWith(303, paths.stripe.addPspAccountDetails)

    setStripeAccountFlagSpy.mockRestore()
  })

  it('should render error page when Stripe returns unknown error', async () => {
    updateBankAccount.mockRejectedValue(new Error())
    const setStripeAccountFlagSpy = jest.spyOn(ConnectorClient.prototype, 'setStripeAccountSetupFlag')
      .mockResolvedValue()

    await controller(req, res)

    expect(updateBankAccount).toHaveBeenCalledWith(res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    expect(setStripeAccountFlagSpy).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith('error', { message: 'Please try again or contact support team' })
  })

  it('should re-render the form page when Stripe returns "routing_number_invalid" error', async () => {
    updateBankAccount.mockRejectedValue(() => {
      const error = new Error()
      error.code = 'routing_number_invalid'
      return error
    })
    const setStripeAccountFlagSpy = jest.spyOn(ConnectorClient.prototype, 'setStripeAccountSetupFlag')
      .mockResolvedValue()

    await controller(req, res)

    expect(updateBankAccount).toHaveBeenCalledWith(res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })

    expect(setStripeAccountFlagSpy).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalled()
  })

  it('should re-render the form page when Stripe returns "account_number_invalid" error', async () => {
    updateBankAccount.mockRejectedValue(() => {
      const error = new Error()
      error.code = 'account_number_invalid'
      return error
    })
    const setStripeAccountFlagSpy = jest.spyOn(ConnectorClient.prototype, 'setStripeAccountSetupFlag')
      .mockResolvedValue()

    await controller(req, res)

    expect(updateBankAccount).toHaveBeenCalledWith(res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    expect(setStripeAccountFlagSpy).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalled()
  })

  it('should render error page when connector returns error', async () => {
    updateBankAccount.mockResolvedValue()
    const setStripeAccountFlagSpy = jest.spyOn(ConnectorClient.prototype, 'setStripeAccountSetupFlag')
      .mockRejectedValue(new Error())

    await controller(req, res)

    expect(updateBankAccount).toHaveBeenCalledWith(res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    expect(setStripeAccountFlagSpy).toHaveBeenCalledWith(req.account.gateway_account_id, 'bank_account', req.correlationId)
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith('error', { message: 'Please try again or contact support team' })
  })
})
