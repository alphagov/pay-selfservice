'use strict'

module.exports = (req, res, next) => {
  if (req.account &&
    req.account.type &&
    req.account.payment_provider &&
    req.account.type.toLowerCase() === 'live' &&
    req.account.payment_provider.toLowerCase() === 'stripe'
  ) {
    next()
  } else {
    res.status(404)
    res.render('404')
  }
}
