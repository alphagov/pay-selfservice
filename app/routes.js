var response = require(__dirname + '/utils/response.js').response;

var controllers = require('./controllers');

module.exports.bind = function (app) {
  app.get('/greeting', function (req, res) {
    var data = {'greeting': 'Hello', 'name': 'World'};
    response(req.headers.accept, res, 'greeting', data);
  });

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  controllers.bindRoutesTo(app);
};
