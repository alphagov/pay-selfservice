'use strict'

// NPM dependencies
const passport = require('passport')

module.exports = (req, res, next) => {
  let error = ''

  // username gets trimmed in middleware
  if (!req.body.username) {
    error = 'empty_username'
  }

  if (!req.body.password.trim()) {
    error = (error === 'empty_username') ? 'empty_all' : 'empty_password'
  }

  if (error !== '') {
    req.flash('error', error)
    res.redirect('/login')
  } else {
    return passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'invalid'
    })(req, res, next)
  }
}
