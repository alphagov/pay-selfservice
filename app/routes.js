var response = require(__dirname + '/utils/response.js').response;

var controllers = require('./controllers');
var transactions_controller = require('./controllers/transaction_controller.js')
var auth = require('./services/auth_service.js');



var paths = {
    transactions: {
      index: '/selfservice/transactions',
      download: '/selfservice/transactions/download',
      show: '/selfservice/transactions/download/:chargeId'
    }
}

module.exports.bind = function (app) {

  auth.bind(app);

  app.get('/greeting', function (req, res) {
    var data = {'greeting': 'Hello', 'name': 'World'};
    response(req.headers.accept, res, 'greeting', data);
  });

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  var transactions = paths.transactions

  app.get(transactions.index, auth.enforce, transactions_controller.transactionsIndex);
  app.post(transactions.index, auth.enforce, transactions_controller.transactionsIndex);
  app.get(transactions.download, auth.enforce, transactions_controller.transactionsDownload);
  app.get(transactions.show, auth.enforce, transactions_controller.transactionsShow);


  controllers.bindRoutesTo(app);
};

module.exports.paths = paths
