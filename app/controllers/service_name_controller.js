var response = require('../utils/response.js').response;
var auth = require('../services/auth_service.js');
var router = require('../routes.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var renderErrorView = require('../utils/response.js').renderErrorView;

var connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL);
}

module.exports.index = function (req, res) {

  var init = function () {
    var accountId = auth.get_account_id(req);

    connectorClient()
      .withGetAccountServiceName(accountId, onSuccess)
      .on('connectorError', onError);
  };

  var onSuccess = function (data) {
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

module.exports.update = function (req, res) {

  var init = function () {
    var accountId = auth.get_account_id(req);

    var payload = {
      service_name: req.body['service-name-input']
    };

    connectorClient()
      .withPatchServiceName(accountId, payload, onSuccess)
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
    ;

    renderErrorView(req, res, 'Unable to update the service name.');
  };

  init();
};
