'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')
const assert = require('assert')

describe('Government entity document POST controller', () => {
  const postBody = {
    'mimetype': 'image/jpeg',
    'size': 100000
  }

  let req
  let next
  let res
  let setStripeAccountSetupFlagMock
  let uploadFileMock
  let updateAccountMock
  let completeKycMock

  function getControllerWithMocks (isKycTaskListComplete) {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        uploadFile: uploadFileMock,
        updateAccount: updateAccountMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve('acct_123example123')
        },
        completeKyc: completeKycMock
      },
      '../../../controllers/your-psp/kyc-tasks.service': {
        isKycTaskListComplete: () => isKycTaskListComplete
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
        }
      }
    }
    next = sinon.spy()
  })

  it('should upload file to Stripe, update account, update connector, then redirect to add psp account details route', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.buffer = '0A 0B'

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.calledWith(uploadFileMock, 'entity_document_for_account_1', 'image/jpeg', '0A 0B')
    sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { 'entity_verification_document_id': 'file_id_123' })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should render error if file size is greater than 10MB', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.size = 1000000001

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['government-entity-document'], 'File size must be less than 10MB')
  })

  it('should render error if file is not selected', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = undefined

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['government-entity-document'], 'Select a file to upload')
  })

  it('should render error if file type is not supported', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.mimetype = 'text/html'

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['government-entity-document'], 'File type must be pdf, jpeg or png')
  })

  it('should render error page when stripe setup is not available on request', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = undefined

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error if Government entity document is already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { governmentEntityDocument: true }

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should display an error message, when Stripe returns error for file, not call connector', async function () {
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'file'
    }
    uploadFileMock = sinon.spy(() => Promise.reject(errorFromStripe))

    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.called(uploadFileMock)
    sinon.assert.notCalled(updateAccountMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['government-entity-document'],
      'Error uploading file to stripe. Try uploading a file with one of the following types: pdf, jpeg, png')
  })

  it('should render error when Stripe returns unknown error, not call connector, and not redirect', async function () {
    uploadFileMock = sinon.spy(() => Promise.reject(new Error()))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.called(uploadFileMock)
    sinon.assert.notCalled(updateAccountMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.file = { ...postBody }

    await controller.postGovernmentEntityDocument(req, res, next)

    sinon.assert.called(uploadFileMock)
    sinon.assert.called(updateAccountMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  describe('Switching PSP', () => {
    it('should redirect to switch PSP route for valid payload', async function () {
      req.url = `/switch-psp/new-stripe-account-id-123/government-entity-document`

      req.account.provider_switch_enabled = true
      req.account.gateway_account_credentials = [
        {
          payment_provider: 'worldpay',
          state: 'ACTIVE'
        },
        {
          payment_provider: 'stripe',
          state: 'ENTERED',
          credentials: {
            stripe_account_id: 'new-stripe-account-id-123'
          }
        }
      ]

      uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
      updateAccountMock = sinon.spy(() => Promise.resolve())
      setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.file = { ...postBody }
      req.file.buffer = '0A 0B'

      await controller.postGovernmentEntityDocument(req, res, next)

      sinon.assert.calledWith(uploadFileMock, 'entity_document_for_account_1', 'image/jpeg', '0A 0B')
      sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { 'entity_verification_document_id': 'file_id_123' })
      sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
      sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.switchPSP.index}`)
    })
  })
  describe('Collecting additional KYC data', () => {
    beforeEach(() => {
      req.url = `/kyc/new-stripe-account-id-123/government-entity-document`

      req.account.requires_additional_kyc_data = true
      req.account.gateway_account_credentials = [
        {
          external_id: 'credential-external-id',
          payment_provider: 'stripe',
          state: 'ACTIVE',
          credentials: {
            stripe_account_id: 'new-stripe-account-id-123'
          }
        }
      ]
      req.file = { ...postBody }
      req.file.buffer = '0A 0B'
      req.service = { external_id: 'service-id' }

      uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
      updateAccountMock = sinon.spy(() => Promise.resolve())
      setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
      completeKycMock = sinon.spy(() => Promise.resolve())
    })

    it('should redirect to your PSP route for valid payload', async function () {
      const controller = getControllerWithMocks(true)

      await controller.postGovernmentEntityDocument(req, res, next)

      sinon.assert.calledWith(uploadFileMock, 'entity_document_for_account_1', 'image/jpeg', '0A 0B')
      sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { 'entity_verification_document_id': 'file_id_123' })
      sinon.assert.calledWith(completeKycMock, req.account.gateway_account_id, req.service, res.locals.stripeAccount.stripeAccountId, 'correlation-id')
      sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
      sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/your-psp/credential-external-id`)
    })

    it('should not complete KYC if kyc task list is not complete', async function () {
      const controller = getControllerWithMocks(false)

      await controller.postGovernmentEntityDocument(req, res, next)

      sinon.assert.notCalled(completeKycMock)

      sinon.assert.calledWith(uploadFileMock, 'entity_document_for_account_1', 'image/jpeg', '0A 0B')
      sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { 'entity_verification_document_id': 'file_id_123' })
      sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
      sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/your-psp/credential-external-id`)
    })
  })
})
