const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const GatewayAccount = require('@models/gateway-account/GatewayAccount.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const PaymentProviders = require('@models/constants/payment-providers')
const CredentialState = require('@models/constants/credential-state')
const WorldpayTaskIdentifiers = require('@models/task-workflows/task-identifiers/worldpay-task-identifiers')
const TaskStatus = require('@models/constants/task-status')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')

const mockResponse = sinon.stub()

const ACCOUNT_TYPE = GatewayAccountType.LIVE
const SERVICE_EXTERNAL_ID = 'service123abc'
const CREDENTIAL_EXTERNAL_ID = 'credential456def'

const { req, res, call, nextRequest } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/worldpay-details.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    allow_moto: false,
    gateway_account_id: 1,
    gateway_account_credentials: [{
      external_id: CREDENTIAL_EXTERNAL_ID,
      payment_provider: PaymentProviders.WORLDPAY,
      state: CredentialState.CREATED,
      created_date: '2024-11-29T11:58:36.214Z',
      gateway_account_id: 1,
      credentials: {}
    }]
  }))
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/worldpay-details', () => {

  describe('get', () => {
    describe('for one-off card payments gateway account', () => {
      it('should call the response method', async () => {
        await call('get')
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', async () => {
        await call('get')
        expect(mockResponse.args[0][0]).to.deep.equal(req)
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/worldpay-details/index')
      })

      it('should pass context data to the response method', async () => {
        await call('get')
        const tasks = [{
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID),
          id: WorldpayTaskIdentifiers.CRED,
          linkText: 'Link your Worldpay account with GOV.UK Pay',
          status: TaskStatus.NOT_STARTED
        }, {
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          id: WorldpayTaskIdentifiers.FLEX,
          linkText: 'Configure 3DS',
          status: TaskStatus.NOT_STARTED
        }]
        expect(mockResponse.args[0][3]).to.have.property('tasks').to.deep.equal(tasks)
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
      })
    })

    describe('for a moto-enabled gateway account', () => {
      beforeEach(async () => {
        nextRequest({
          account: {
            allowMoto: true
          }
        })
      })
      it('should call the response method', async () => {
        await call('get')
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', async () => {
        await call('get')
        expect(mockResponse.args[0][0]).to.deep.equal(req)
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/worldpay-details/index')
      })

      it('should pass context data to the response method', async () => {
        await call('get')
        const tasks = [{
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID),
          id: WorldpayTaskIdentifiers.CRED,
          linkText: 'Link your Worldpay account with GOV.UK Pay',
          status: TaskStatus.NOT_STARTED
        }]
        expect(mockResponse.args[0][3]).to.have.property('tasks').to.deep.equal(tasks)
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
      })
    })

    describe('for a recurring card payments gateway account', () => {
      beforeEach(async () => {
        nextRequest({
          account: {
            recurringEnabled: true,
            allowMoto: false
          }
        })
      })
      it('should call the response method', async () => {
        await call('get')
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', async () => {
        await call('get')
        expect(mockResponse.args[0][0]).to.deep.equal(req)
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/worldpay-details/index')
      })

      it('should pass context data to the response method', async () => {
        await call('get')
        const tasks = [{
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID),
          id: WorldpayTaskIdentifiers.CIT,
          linkText: 'Recurring customer initiated transaction (CIT) credentials',
          status: TaskStatus.NOT_STARTED
        }, {
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID),
          id: WorldpayTaskIdentifiers.MIT,
          linkText: 'Recurring merchant initiated transaction (MIT) credentials',
          status: TaskStatus.NOT_STARTED
        }, {
          href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          id: WorldpayTaskIdentifiers.FLEX,
          linkText: 'Configure 3DS',
          status: TaskStatus.NOT_STARTED
        }]
        expect(mockResponse.args[0][3]).to.have.property('tasks').to.deep.equal(tasks)
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
      })
    })
  })
})
