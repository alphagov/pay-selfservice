'use strict'

const sessionValidator = require('./../../services/session-validator')

function getPage (req, res) {
  const loggedIn = sessionValidator.validate(req.user, req.session)

  return res.render('privacy/privacy', {
    loggedIn,
    hideServiceNav: true
  })
}

module.exports = {
  getPage
}
