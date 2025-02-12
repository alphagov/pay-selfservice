const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const { STRIPE } = require('@models/constants/payment-providers')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const paths = require('@root/paths')

const mockResponse = sinon.spy()
const mockWorldpayTasks = {
  tasks: ['foo', 'bar', 'baz'],
  incompleteTasks: true
}
const ACCOUNT_TYPE = 'live'
const ACCOUNT_EXTERNAL_ID = 'account-id-123abc'
const SERVICE_ID = 'service-id-123abc'

const {
  req,
  res,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/switch-psp/switch-to-worldpay/switch-to-worldpay.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccount({
    externalId: ACCOUNT_EXTERNAL_ID,
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: STRIPE,
    allowMoto: true
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@models/WorldpayTasks.class': { WorldpayTasks: sinon.stub().returns(mockWorldpayTasks) }
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/switch-psp/switch-to-worldpay/index')
    })

    it('should pass the context data to the response method', () => {
      const context = mockResponse.args[0][3]
      expect(context.isMoto).to.equal(true)
      expect(context.currentPsp).to.equal(STRIPE)
      expect(context.incompleteTasks).to.equal(true)
      expect(context.tasks).to.deep.equal(['foo', 'bar', 'baz'])
      expect(context.transactionsUrl).to.equal(formatAccountPathsFor(paths.account.transactions.index, ACCOUNT_EXTERNAL_ID))
    })
  })
})
