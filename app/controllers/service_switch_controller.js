const q = require('q');
const urlParse = require('url').parse;
const _ = require('lodash');
const logger = require('winston');

const paths = require('../paths');
const responses = require('../utils/response');
const ConnectorClient = require('../services/clients/connector_client').ConnectorClient;

var successResponse = responses.response;
var errorResponse = responses.renderErrorView;

var connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL);

const validAccountId = (accountId, user) => accountId && user.gatewayAccountIds.indexOf(accountId) !== -1;

module.exports = {
  /**
   *
   * @param req
   * @param res
   */
  index: (req, res) => {
    let gatewayAccountIds = _.get(req, 'user.gatewayAccountIds', null);

    if (!gatewayAccountIds || !gatewayAccountIds.length) {
      logger.info(`[${req.correlationId}] No accounts found for user`);
      return errorResponse(req, res, 'No accounts found for user');
    }

    return q.allSettled(gatewayAccountIds
      .map(gatewayAccountId => connectorClient().getAccount({
        gatewayAccountId: gatewayAccountId,
        correlationId: req.correlationId
      })))
      .then(gatewayAccountPromises => gatewayAccountPromises
        .filter(promise => promise.state === 'fulfilled')
        .map(promise => promise.value))
      .then(gatewayAccounts => {
        successResponse(req, res, 'services/index', {
          navigation: false,
          gatewayAccounts: gatewayAccounts});
      })
      .catch(() => errorResponse(req, res, 'Unable to display accounts'));
  },

  /**
   *
   * @param req
   * @param res
   */
  switch: (req, res) => {
    let newAccountId = _.get(req, 'body.gatewayAccountId');

    if (validAccountId(newAccountId, req.user)) {
      req.gateway_account.currentGatewayAccountId = newAccountId;
      res.redirect(302, '/');
    } else {
      logger.warn(`Attempted to switch to invalid account ${newAccountId}`);
      res.redirect(302, paths.serviceSwitcher.index);
    }
  }
};
