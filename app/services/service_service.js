'use strict';

const q = require('q');
const logger = require('winston');
const {ConnectorClient} = require('../services/clients/connector_client');
const GatewayAccount = require('../models/GatewayAccount.class');

const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL);
// Exports
module.exports = {
  getGatewayAccounts,
};

/**
 * @method getServicesForUser
 * @param {string[]} gatewayAccountIds - The ids of interested gateway accounts.
 *
 * @returns {GatewayAccount[]} collection of gateway accounts which belong to this service
 */
function getGatewayAccounts(gatewayAccountIds, correlationId) {

  return q.allSettled(gatewayAccountIds
    .map(gatewayAccountId => connectorClient().getAccount({
      gatewayAccountId: gatewayAccountId,
      correlationId: correlationId
    })))
    .then(gatewayAccountPromises => gatewayAccountPromises
      .filter(promise => promise.state === 'fulfilled')
      .map(promise => promise.value))
    .then(gatewayAccountsData => gatewayAccountsData
      .map(accountData => new GatewayAccount(accountData).toMinimalJson()));
}

