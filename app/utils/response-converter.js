const requestLogger = require('./request-logger')

const SUCCESS_CODES = [200, 201, 202, 204, 206]

module.exports = {
  /**
   * Creates a callback that can be used to log the stuff we're interested
   * in and converts the response/error into a promise.
   *
   * @private
   * @param {Object} context
   * @returns {function}
   */
  createCallbackToPromiseConverter: (context, transformer) => {
    const defer = context.defer

    return (error, response, body) => {
      requestLogger.logRequestEnd(context)
      if (error) {
        // TODO : Once anything using response converter has a segment passed, the 'if' test can be removed, with just the .close() function call remaining
        if (context.subsegment) { context.subsegment.close(error) }
        requestLogger.logRequestError(context, error)
        defer.reject({ error })
        return
      }
      // TODO : Same as above
      if (context.subsegment) { context.subsegment.close() }

      if (response && SUCCESS_CODES.indexOf(response.statusCode) !== -1) {
        if (body && transformer && typeof transformer === 'function') {
          defer.resolve(transformer(body))
        } else {
          defer.resolve(body)
        }
      } else {
        requestLogger.logRequestFailure(context, response)
        defer.reject({
          errorCode: response.statusCode,
          message: response.body
        })
      }
    }
  },

  successCodes: () => {
    return SUCCESS_CODES
  }
}
