'use strict'

module.exports = function allServicesMiddleware (req, res, next) {
  // @TODO(sfount) we should sync this setting with the user backend state, that will
  //               allow us to set a default based on usage when releasing the feature

  console.log('env', req.query.environment)
  if (req.query.environment) {
    const environmentMap = {
      'live': true,
      'test': false
    }
    if (environmentMap[req.query.environment] !== undefined) {
      console.log('setting env')
      req.session.liveMode = environmentMap[req.query.environment]
    }
  }
  console.log('env set', req.session.liveMode)
  req.session.liveMode = req.session.liveMode === undefined ? true : req.session.liveMode
  res.locals.liveMode = req.session.liveMode
  next()
}
