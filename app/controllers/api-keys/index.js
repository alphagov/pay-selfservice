'use strict'

const getIndex = require('./get-index-controller')
const getShow = require('./get-show-controller')
const postCreate = require('./post-create-controller')
const postDelete = require('./post-delete-controller')
const postRevoked = require('./post-revoked-controller')
const postUpdate = require('./post-update-controller')

module.exports = {
  getIndex,
  getShow,
  postCreate,
  postDelete,
  postRevoked,
  postUpdate
}
