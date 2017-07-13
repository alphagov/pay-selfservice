const auth          = require('../services/auth_service.js');
const Connector     = require('../services/clients/connector_client.js').ConnectorClient;
const paths = require('../paths');
const connectorClient = new Connector(process.env.CONNECTOR_URL);

module.exports = function (req, res, next) {
  if(!req.user.serviceRoles || req.user.serviceRoles.length <= 0) {
    return res.redirect(paths.serviceSwitcher.index);
  }
  const accountId = auth.getCurrentGatewayAccountId(req);
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  };
  return connectorClient.getAccount(params)
    .then(data => {
      req.account = data;
      next();
    })
    .catch(() => {
      next()
    });
};
