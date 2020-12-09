'use strict'

exports.getStart = require('./get-start.controller')
exports.getInformation = require('./get-information.controller')
exports.postInformation = require('./post-information.controller')
exports.getWebAddress = require('./get-web-address.controller')
exports.postWebAddress = require('./post-web-address.controller')
exports.getReference = require('./get-reference.controller')
exports.postReference = require('./post-reference.controller')
exports.getAmount = require('./get-amount.controller')
exports.postAmount = require('./post-amount.controller')
exports.getReview = require('./get-review.controller')
exports.postReview = require('./post-review.controller')
exports.getAddReportingColumn = require('./get-update-reporting-column.controller')
exports.postUpdateReportingColumn = require('./post-update-reporting-column.controller')
exports.getManage = require('./get-manage.controller')
exports.getDisable = require('./get-disable.controller')
exports.getDelete = require('./get-delete.controller')
exports.getEdit = require('./get-edit.controller')
exports.postEdit = require('./post-edit.controller')
exports.getEditInformation = require('./get-edit-information.controller')
exports.postEditInformation = require('./post-edit-information.controller')
exports.getEditReference = require('./get-edit-reference.controller')
exports.postEditReference = require('./post-edit-reference.controller')
exports.getEditAmount = require('./get-edit-amount.controller')
exports.postEditAmount = require('./post-edit-amount.controller')

exports.metadata = {
  add: require('./metadata/resource.controller').addMetadataPage,
  post: require('./metadata/resource.controller').postMetadataPage,
  editPage: require('./metadata/resource.controller').editMetadataPage,
  editPagePost: require('./metadata/resource.controller').editMetadataPost,
  deletePagePost: require('./metadata/resource.controller').deleteMetadataPost
}
