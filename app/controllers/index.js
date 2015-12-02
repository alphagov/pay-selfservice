var transaction_list_controller = require('./transaction_list_controller.js');
var dev_tokens_controller = require('./dev_tokens_controller.js');
var credentials_controller = require('./credentials_controller.js');

// bind all controller routes to the app:
module.exports.bindRoutesTo = function(app) {
    transaction_list_controller.bindRoutesTo(app);
    dev_tokens_controller.bindRoutesTo(app);
    credentials_controller.bindRoutesTo(app);
}