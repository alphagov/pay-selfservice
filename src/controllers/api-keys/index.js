'use strict'

const getCreate = require('./get-create.controller')
const getIndex = require('./get-index.controller')
const getRevoked = require('./get-revoked.controller')
const postCreate = require('./post-create.controller')
const postRevoke = require('./post-revoke.controller')
const postUpdate = require('./post-update.controller')

module.exports = {
  getCreate,
  getIndex,
  getRevoked,
  postCreate,
  postRevoke,
  postUpdate
}
