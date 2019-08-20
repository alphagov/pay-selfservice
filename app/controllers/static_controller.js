const logger = require('../utils/logger')

module.exports.naxsiError = function (req, res) {
  res.status(400)
  logger.error('NAXSI ERROR:- ' + req.headers['x-naxsi_sig'])
  res.render('error', { message: 'Please try again later' })
}
