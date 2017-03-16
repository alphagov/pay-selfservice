var auth                = require('../services/auth_service.js'),
  Connector               = require('../services/clients/connector_client.js').ConnectorClient,
  connectorClient                  = new Connector(process.env.CONNECTOR_URL);

module.exports = function (req, res, next) {
  var accountId = auth.getCurrentGatewayAccountId(req);
  var params = {
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
