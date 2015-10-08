var transaction_list_controller = require('./transaction_list_controller.js');

// bind all controller routes to the app:
module.exports.bindRoutesTo = function(app) {
    transaction_list_controller.bindRoutesTo(app);
}