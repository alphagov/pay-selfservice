'use strict'

module.exports = (req, res, next) => {
  if (req.seen_cookie_message.seen) {
    res.locals.seen_cookie_message = true
  } else {
    req.seen_cookie_message.seen = true
    res.locals.seen_cookie_message = false
  }
  next()
}
