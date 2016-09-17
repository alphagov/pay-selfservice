var logger    = require('winston');
var paths     = require('../paths.js');
var errorView = require('../utils/response.js').renderErrorView;
// var Gateway   = require('../models/gateway.js');
var e         = module.exports;



e.index = function(req,res){
  res.render('gateways/index');
}