var logger          = require('winston');
var csrf            = require('csrf');


module.exports.index = function (req, res) {
  res.send('hello');
};
