const { createLogger, format, transports } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports.naxsiError = function (req, res) {
  res.status(400)
  logger.error('NAXSI ERROR:- ' + req.headers['x-naxsi_sig'])
  res.render('error', { message: 'Please try again later' })
}
