'use strict'

module.exports = (req, res) => {
  let errors = {}
  if (res.locals.flash.hasOwnProperty('error')) {
    switch (res.locals.flash.error[0]) {
      case 'invalid':
        errors = { username: 'Enter a valid email address', password: 'Enter a valid password' }
        break
      case 'empty_all':
        errors = { username: 'Enter an email address', password: 'Enter a password' } // pragma: allowlist secret
        break
      case 'empty_username':
        errors = { username: 'Enter an email address' }
        break
      case 'empty_password':
        errors = { password: 'Enter a password' } // pragma: allowlist secret
        break
    }
  }
  res.render('login/login', { errors })
}
