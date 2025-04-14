'use strict'

const { postGovernmentEntityDocument } = require('./post.controller')

module.exports = {
  get: require('./get.controller'),
  post: postGovernmentEntityDocument
}
