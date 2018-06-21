'use strict'

module.exports = {
  reflect: promise => {
    return promise.then(function (v) {
      return {v: v, status: 'resolved'}
    },
    function (e) {
      return {e: e, status: 'rejected'}
    })
  }
}
