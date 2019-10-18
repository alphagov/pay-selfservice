const { createLogger, format, transports } = require('winston')
const { json, splat, prettyPrint } = format
const { govUkPayLoggingFormat } = require('@govuk-pay/pay-js-commons').logging

const logger = createLogger({
  format: format.combine(
    splat(),
    prettyPrint(),
    govUkPayLoggingFormat({ container: 'selfservice' }),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = (loggerName) => {
  return logger.child({ logger_name: loggerName })
}
