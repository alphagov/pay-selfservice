var express           = require('express');
var app               = express();
var bodyParser     =        require("body-parser");

var Client            = require('node-rest-client').Client;
var client            = new Client();
var _                 = require('lodash');
var emptyResource     = { headers : { "Content-Type": "application/json" }, data: {} };
var connectorAccount  = process.env.CONNECTOR_URL + "/v1/api/accounts";
var publicAuthUrl     = process.env.PUBLIC_AUTH_URL;
var password          = "password";
var User              = require('./app/models/user.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.get('/', function (req, res) {
  res.send('<form action="/create_account" method="post"><input type="submit" /> </form>');
});


var generateRandomUsername = function(){
  return  Math.random().toString(36).substring(7);
};

var sendHTML = function(res,token,email,password,gatewayID){
          res.send(['<p id="token">token:<span><br/>',
          token,
          "</span></p><p id='email'>email: <span><br/>",
          email,
          "</span></p><p id='password'>password: <span><br/>",
          password,
          "</span></p><p id='GatewayAccountID'>gateway account id: <span><br/>",
          gatewayID,
          "</span></p>"
          ].join(""));
};
var sendJSON = function(res, token,email,password,gatewayID){

          res.json({
            token: token,
            email: email,
            password: password,
            gatewayAccountID: gatewayID
          });
};



app.post('/create_account', function (req, res) {
  var connector = _.merge({},emptyResource);
  var auth      = _.merge({},emptyResource);
  var authToken = _.merge({},emptyResource);
  var randomUserName = generateRandomUsername();
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
        if (req.headers['content-type'].indexOf('application/json') >= 0) {
          sendJSON(res, data.token,randomEmail,password,gateway_account_id);
        } else {
          sendHTML(res, data.token,randomEmail,password,gateway_account_id);
        }



      }, function(){ throw new Error('WAAAA'); });

    },function(){
      defer.reject();
    });

  });
});


app.post('/create_user_account_with_token', function (req, res) {
  var connector = _.merge({},emptyResource);
  var auth      = _.merge({},emptyResource);
  var authToken = _.merge({},emptyResource);
  var randomUserName = generateRandomUsername();
  var randomEmail = req.body.email ? req.body.email : randomUserName + "@foo.com";
  connector.data.payment_provider = req.body.provider ? req.body.provider : "sandbox";
  var gatewayAccountID = req.body.gatewayAccountID;

  authToken.data = {
    account_id: String(gatewayAccountID),
    description: req.body.token_description ? req.body.token_description : "generated for pay-accept"
  };

  User.create({
    username: randomUserName,
    password: password,
    gateway_account_id: gatewayAccountID,
    email: randomEmail
  }).then(function(user){
    client.post(publicAuthUrl, authToken, function (data, response) {
      if (req.headers['content-type'].indexOf('application/json') >= 0) {
        sendJSON(res, data.token,randomEmail,password,gatewayAccountID);
      } else {
        sendHTML(res, data.token,randomEmail,password,gatewayAccountID);
      }
    }, function(){ throw new Error('An error occurred while creating a user.'); });
  },function(){
    defer.reject();
  });

});


app.post('/create_user_account_without_token', function (req, res) {
  var connector = _.merge({},emptyResource);
  var auth      = _.merge({},emptyResource);
  var authToken = _.merge({},emptyResource);
  var randomUserName = generateRandomUsername();
  var randomEmail = req.body.email ? req.body.email : randomUserName + "@foo.com";
  connector.data.payment_provider = req.body.provider ? req.body.provider : "sandbox";
  var gatewayAccountID = req.body.gatewayAccountID;

  authToken.data = {
    account_id: String(gatewayAccountID),
    description: req.body.token_description ? req.body.token_description : "generated for pay-accept"
  };
    console.log('HIE')

  User.create({
    username: randomUserName,
    password: password,
    gateway_account_id: gatewayAccountID,
    email: randomEmail
  })
  .then(function(user){
    var isJSON = req.headers['content-type'].indexOf('application/json') >= 0;
      console.log('HIeE',req.headers['content-type'])

    if (isJSON) {
      sendJSON(res, undefined, randomEmail, password, gatewayAccountID);
    } else {
      sendHTML(res, undefined, randomEmail, password, gatewayAccountID);
    }
  }, function(){
    defer.reject();
  });

});




var port = process.env.PORT || 3001;

app.listen(port, function () {
  console.log('listening on port ' + port);
});
