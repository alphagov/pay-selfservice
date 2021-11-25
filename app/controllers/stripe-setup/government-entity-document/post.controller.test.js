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
  let updateAccountVerificationMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        uploadFile: uploadFileMock,
        updateAccountVerification: updateAccountVerificationMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve('acct_123example123')
        }
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

  it('should upload file to Stripe, update account and , then connector, then redirect to add psp account details route', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.buffer = '0A 0B'

    await controller(req, res, next)

    sinon.assert.calledWith(uploadFileMock, 'entity_document_for_account_1', 'image/jpeg', '0A 0B')
    sinon.assert.calledWith(updateAccountVerificationMock, res.locals.stripeAccount.stripeAccountId, 'file_id_123')
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should render error if file size is greater than 10MB', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.size = 1000000000

    await controller(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountVerificationMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['file-upload'], 'File size must be less than 10MB')
  })

  it('should render error if file is not selected', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = undefined

    await controller(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountVerificationMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['file-upload'], 'Select a file to upload')
  })

  it('should render error if file type is not supported', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }
    req.file.mimetype = 'text/html'

    await controller(req, res, next)

    sinon.assert.notCalled(uploadFileMock)
    sinon.assert.notCalled(updateAccountVerificationMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.render, `stripe-setup/government-entity-document/index`)

    assert.strictEqual(res.render.getCalls()[0].args[1].errors['file-upload'], 'File type must be pdf, jpeg or png')
  })

  it('should render error page when stripe setup is not available on request', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = undefined

    await controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error if Government entity document is already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { governmentEntityDocument: true }

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    uploadFileMock = sinon.spy(() => Promise.reject(new Error()))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.file = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(uploadFileMock)
    sinon.assert.notCalled(updateAccountVerificationMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error', async function () {
    uploadFileMock = sinon.spy(() => Promise.resolve({ id: 'file_id_123' }))
    updateAccountVerificationMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.file = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(uploadFileMock)
    sinon.assert.called(updateAccountVerificationMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'government_entity_document', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })
})
