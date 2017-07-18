module.exports.excludingPaths = function (paths, middleware) {
  return function (req, res, next) {
    if (paths.indexOf(req.url) >= 0) {
      next()
    } else {
      return middleware(req, res, next)
    }
  }
}
