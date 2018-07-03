'use strict'

module.exports = {
  reflect: promise => {
    return promise.then(result => ({v: result, status: 'resolved'}),
      error => ({e: error, status: 'rejected'})
    )
  }
}