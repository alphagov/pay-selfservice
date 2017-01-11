const _ = require('lodash');

module.exports = {
  /**
   * @param {User} user
   * @param {Object} session
   *
   * @returns {boolean}
   */
  validate: function(user, session) {
    return _.get(user, 'session_version', 0) === session.version;
  },

  /**
   * @param {bobby.User} user
   */
  incrementSessionVersion: function(user) {
    user.incrementSessionVersion();
  }
};
