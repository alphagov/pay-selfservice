var express           = require('express');
var app               = express();
var Client            = require('node-rest-client').Client;
var client            = new Client();
var _                 = require('lodash');
var emptyResource     = { headers : { "Content-Type": "application/json" }, data: {} };
var connectorAccount  = process.env.CONNECTOR_URL + "/v1/api/accounts";
var publicAuthUrl     = process.env.PUBLIC_AUTH_URL;
var password          = "password";
var User              = require('./app/models/user.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.get('/', function (req, res) {
  res.send('<form action="/create_account" method="post"><input type="submit" /> </form>');
});


var genereateRandomUsername = function(){
  return  Math.random().toString(36).substring(7);
};

var sendHTML = function(token,email,password){
          res.send(['<p id="token">token:<span><br/>',
          token,
          "</span></p><p id='email'>email: <span><br/>",
          email,
          "</span></p><p id='password'>password: <span><br/>",
          password,
          "</span></p>"
          ].join(""));
};
var sendJSON = function(token,email,password){
          res.json({
            token: token,
            email: email,
            password: password
          });
};



app.post('/create_account', function (req, res) {
  var connector = _.merge({},emptyResource);
  var auth      = _.merge({},emptyResource);
  var authToken = _.merge({},emptyResource);
  var randomUserName = genereateRandomUsername();
  var randomEmail = randomUserName + "@foo.com";
  connector.data.payment_provider = "sandbox";

  client.post(connectorAccount, connector, function (data, response) {
    var gateway_account_id = data.gateway_account_id;

    authToken.data = {
      account_id: String(gateway_account_id),
      description: "generated for pay-accept"
    };

    User.create({
      username: randomUserName,
      password: password,
      gateway_account_id: gateway_account_id,
      email: randomEmail
    }).then(function(user){
      client.post(publicAuthUrl, authToken, function (data, response) {
        if (req.headers['content-type'] == "application/json") {
          sendJSON(data.token,email,password);
        } else {
          sendHTML(data.token,email,password);
        }



      }, function(){ throw new Error('WAAAA'); });

    },function(){
      defer.reject();
    });

  });
});

var port = process.env.PORT || 3001
app.listen(port, function () {
  console.log('listening on port ' + port);
});
