var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var client =        new ConnectorClient(process.env.CONNECTOR_URL);
var auth            = require('../services/auth_service.js');

module.exports.index = function (req, res) {
      var accountId = auth.get_account_id(req);
      client.withGetAccount(accountId, function(data){
        console.log(data);
        response(req.headers.accept, res, "email_notifications/index", {
          serviceName: data.service_name
        });
      })
      .on('connectorError', ()=>{});



};
