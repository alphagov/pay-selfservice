'use strict'

module.exports = (req, res) => {
  const setError = function (errorMessages) {
    res.locals.flash.error = {'messages': errorMessages}
  }
  if (res.locals.flash.hasOwnProperty('error')) {
    switch (res.locals.flash.error[0]) {
      case 'invalid':
        setError({username: 'You must enter a valid email address', password: 'You must enter a valid password'})
        break
      case 'empty_all':
        setError({username: 'You must enter an email address', password: 'You must enter a password'})
        break
      case 'empty_username':
        setError({username: 'You must enter an email address'})
        break
      case 'empty_password':
        setError({password: 'You must enter a password'})
        break
    }
  }
  res.render('login/login')
}
