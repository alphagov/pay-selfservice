var response              = require('../utils/response.js').response;
var router                = require('../routes.js');
var getAdminUsersClient   = require('../services/clients/adminusers_client');
var renderErrorView       = require('../utils/response.js').renderErrorView;
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;


module.exports.edit = function (req, res) {

  if(!req.account) {
    return renderErrorView(req, res, 'Unable to retrieve the service name.');
  }

  var model = {
    currentServiceName: req.user.currentServiceName
  };

  return response(req, res, 'services/update_service_name', model);
};

module.exports.update = function (req, res) {

  let correlationId = req.headers[CORRELATION_HEADER] || req.correlationId || '';

  let init = function () {
    let serviceId = req.user.serviceIds[0];

    let newServiceName = req.body['service-name-input'];

    let payload = {
      service_name: newServiceName
    };

    let params = {
      serviceId: serviceId,
      payload : payload,
      correlationId: correlationId
    };

    getAdminUsersClient({correlationId: correlationId})
      .updateServiceName(params, onSuccess)
      .on('adminUserError', onError);
  };

  let onSuccess = function () {
    req.flash('generic', 'Service name has been updated');
    res.redirect(303, req.user.replace(':currentServiceName', newServiceName));
  };

  let onError = function (adminUserError) {
    if (adminUserError) {
      renderErrorView(req, res, 'Internal server error');
      return;
    }
    console.log(">>>>> " + req.body);
    renderErrorView(req, res, req.body + 'Unable to update the service name.');
  };

  init();
};
