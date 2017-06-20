const auth          = require('../services/auth_service.js');
const Connector     = require('../services/clients/connector_client.js').ConnectorClient;
let connectorClient = new Connector(process.env.CONNECTOR_URL);

module.exports = function (req, res, next) {
  let accountId = auth.getCurrentGatewayAccountId(req);
  let params = {
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
