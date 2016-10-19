var response              = require('../utils/response.js').response;
var auth                  = require('../services/auth_service.js');
var router                = require('../routes.js');
var ConnectorClient       = require('../services/connector_client.js').ConnectorClient;
var renderErrorView       = require('../utils/response.js').renderErrorView;
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;

var connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL);
};

module.exports.index = function (req, res) {
  var correlationId = req.headers[CORRELATION_HEADER] ||'';

  var init = function () {
    var accountId = auth.get_gateway_account_id(req);
    var params = {
      gatewayAccountId: accountId,
      correlationId: correlationId
    };
    // MOVE PARAMS DOWN, COULD THIS BE PART GATEWAY ACCOUNT, AS THIS IS ALL THIS IS DOING?
    connectorClient()
      .withGetAccount(params, onSuccess)
      .on('connectorError', onError);
  };

  var onSuccess = function (data) {
    // THIS IS DUE TO HOGAN JS I THINK
    var model = {
      serviceName: data.service_name,
      editMode: !(req.query.edit === undefined)
    };

    response(req.headers.accept, res, 'service_name', model);
  };

  var onError = function (connectorError) {
    if (connectorError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    }

    renderErrorView(req, res, 'Unable to retrieve the service name.');
  };

  init();
};
// SAME AS ABOVE, THIS IS JUST UPDATING A FIELD ON A GATEWAY ACCOUNT,
// SERVICE NAME AS AN OBJECT IN ITS OWN RIGHT DOES NOT EXIST I DONT THINK
// THE API SHOULD MAYBE REFLECT THIS?

module.exports.update = function (req, res) {

  var correlationId = req.headers[CORRELATION_HEADER] ||'';

  var init = function () {
    var accountId = auth.get_gateway_account_id(req);

    var payload = {
      service_name: req.body['service-name-input']
    };

    var params = {
      gatewayAccountId: accountId,
      payload : payload,
      correlationId: correlationId
    };

    connectorClient()
      .withPatchServiceName(params, onSuccess)
      .on('connectorError', onError);
  };

  var onSuccess = function () {
    res.redirect(303, router.paths.serviceName.index);
  };

  var onError = function (connectorError) {
    if (connectorError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    }
    renderErrorView(req, res, 'Unable to update the service name.');
  };

  init();
};
