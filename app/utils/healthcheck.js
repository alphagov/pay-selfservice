var response        = require(__dirname + '/response.js').response;
var sequelizeConfig = require(__dirname + '/sequelize_config.js').sequelizeConfig;

module.exports = function () {

  function selfServiceHealthCheck(req, res) {
    var data = {'ping': {'healthy': true}, 'database': {'healthy': true}};
    sequelizeConfig
      .authenticate()
      .then(function(err) {
        console.log('Connection has been established successfully.');
        response(req.headers.accept, res, null, data);
      }, function (err) {
        console.log('Unable to connect to the database:', err);
        data.database.healthy = false;
        response(req.headers.accept, res, null, data);
      });
  }

  return {
    selfServiceHealthCheck: selfServiceHealthCheck
  }

}();