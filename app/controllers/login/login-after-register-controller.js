'use strict'

// NPM dependencies
const passport = require('passport')

module.exports = (req, res, next) => {
  return passport.authenticate('localDirect', {failureRedirect: '/login'})(req, res, next)
}
