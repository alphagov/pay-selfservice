import { Format, TransformableInfo } from 'logform'
import { createLogger, format, transports } from 'winston'

const { combine, timestamp, printf, colorize } = format

const debugLoggingFormat = printf(({ level, message, timestamp, ...metadata }: TransformableInfo) => {
  const metadataStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
  const isHealthcheck = metadata.url === '/healthcheck'

  if (isHealthcheck) {
    return `${timestamp as string} [${level}]: ${message as string} (Healthcheck)`
  }

  return metadataStr
    ? `${timestamp as string} [${level}]: ${message as string}\n${metadataStr}`
    : `${timestamp as string} [${level}]: ${message as string}`
})

const simpleLoggingFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp as string} [${level}]: ${message as string}`
})

function localLogger(loggingFormat: Format) {
  return createLogger({
    format: combine(
      colorize({
        colors: {
          error: 'red',
          warn: 'yellow',
          info: 'green',
          debug: 'blue',
        },
      }),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      loggingFormat
    ),
    transports: [
      new transports.Console({
        level: 'debug',
      }),
    ],
  })
}

export { debugLoggingFormat, simpleLoggingFormat, localLogger }
