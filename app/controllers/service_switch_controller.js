const q = require('q');
const _ = require('lodash');
const logger = require('winston');

const paths = require('../paths');
const responses = require('../utils/response');
const serviceService = require('../services/service_service');

const successResponse = responses.response;

const validAccountId = (accountId, user) => {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.services.map(service => service.gatewayAccountIds)));
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
};

const displayNameOf = (service) => service.name === 'System Generated' ? '' : service.name;

module.exports = {
  /**
   *
   * @param req
   * @param res
   */
  index: (req, res) => {
    const services = _.get(req, 'user.services', []);

    return q.allSettled(services.map(service => {
      let defer = q.defer();

      serviceService.getGatewayAccounts(service.gatewayAccountIds, req.correlationId)
        .then(accounts => {
          defer.resolve({
            name: displayNameOf(service),
            external_id: service.externalId,
            gateway_accounts: accounts
          })
        })
        .catch(() => defer.reject());
      return defer.promise;
    }))
      .then(serviceDataPromises =>
        serviceDataPromises
          .filter(promise => promise.state === 'fulfilled')
          .map(promise => promise.value))
      .then(servicesData => {
        return successResponse(req, res, 'services/index', {
            navigation: false,
            services: servicesData
          }
        );
      });
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
}
;
