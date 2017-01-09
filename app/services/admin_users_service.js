let User                   = require('../models/user');
let AdminUsersClient       = require('./admin_users_client').AdminUsersClient;
let adminUsers             = new AdminUsersClient(process.env.ADMIN_USERS_URL);
let isAdminUsersApiEnabled = process.env.ADMIN_USERS_API_ENABLED || false;

/**
 * @description Wraps users operations based on Users Admin API enabled or not (then using Sequelize models).
 * Defined by env var USERS_ADMIN_API_ENABLED (false by default)
 */
module.exports = {

  /**
   *
   * @param {String} username
   * @param {String} password
   *
   *  @returns {Promise}
   */
  authenticate: (username, password) => {
    if (isAdminUsersApiEnabled)
      return adminUsers.authenticate(username, password);
    return User.authenticate(username, password);
  },

  /**
   *
   * @param {String} username
   *
   *  @returns {Promise}
   */
  findByUsername: (username) => {
    return User.findByUsername(username);
  }
};
