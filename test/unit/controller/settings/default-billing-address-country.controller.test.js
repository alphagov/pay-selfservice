const proxyquire = require('proxyquire')
const sinon = require('sinon')

const Service = require('../../../../app/models/Service.class')
const serviceFixtures = require('../../../fixtures/service.fixtures')
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

const updateDefaultBillingAddressCountrySpy = sinon.spy()
const adminuUsersClientStub = () => {
    return {
        updateDefaultBillingAddressCountry: updateDefaultBillingAddressCountrySpy
    }
}
const controller = proxyquire('../../../../app/controllers/settings/default-billing-address-country.controller',
    {
        '../../services/clients/adminusers.client': adminuUsersClientStub
    }
)

const service = new Service(serviceFixtures.validServiceResponse())
const account = gatewayAccountFixtures.validGatewayAccountResponse()
const correlationId = 'a-request-id'


describe('Default billing address country settings controller', () => {
    let res, next
    beforeEach(() => {
        updateDefaultBillingAddressCountrySpy.resetHistory()
        res = {
            redirect: sinon.spy()
        }
        next = sinon.spy()
    })

    it('should set country code to GB when UK as default is true', async () => {
        const req = {
            service,
            account,
            correlationId,
            body: {
                'uk-as-default-billing-address-country': 'on'
            },
            flash: sinon.spy()
        }
        await controller.updateDefaultBillingAddressCountry(req, res, next)
        sinon.assert.calledWith(updateDefaultBillingAddressCountrySpy, service.externalId, 'GB', req.correlationId)
        sinon.assert.calledWith(req.flash, 'generic', 'United Kingdom as the default billing address: On')
        sinon.assert.calledWith(res.redirect, `/account/${account.external_id}/settings`)
    })

    it('should set country code to null when UK as default is false', async () => {
        const req = {
            service,
            account,
            correlationId,
            body: {
                'uk-as-default-billing-address-country': 'off'
            },
            flash: sinon.spy()
        }
        await controller.updateDefaultBillingAddressCountry(req, res, next)
        sinon.assert.calledWith(updateDefaultBillingAddressCountrySpy, service.externalId, null, req.correlationId)
        sinon.assert.calledWith(req.flash, 'generic', 'United Kingdom as the default billing address: Off')
        sinon.assert.calledWith(res.redirect, `/account/${account.external_id}/settings`)
    })
})