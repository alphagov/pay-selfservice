'use strict'

const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function toggleWorldpay3dsFlex (req, res) {
    const accountId = req.account.gateway_account_id
    const toggleWorldpay3dsFlex = req.body['toggle-worldpay-3ds-flex']

    if (req.body['toggle-worldpay-3ds-flex'] === 'on' || req.body['toggle-worldpay-3ds-flex'] === 'off') {
        const enabling3dsFlex = toggleWorldpay3dsFlex === 'on'
        const message = enabling3dsFlex ? '3DS Flex turned on' : '3DS Flex turned off'
        const integrationVersion3ds = enabling3dsFlex ? 2 : 1
        try {
            await connector.updateIntegrationVersion3ds(accountId, integrationVersion3ds, req.correlationId)
            req.flash('generic', message)
            return res.redirect(303, paths.yourPsp.index)
        } catch (error) {
            return renderErrorView(req, res, false, error.errorCode)
        }
    } else {
        return renderErrorView(req, res, false, 400)
    }
  }
