const _ = require('lodash');

module.exports = {
  /**
   * @param {User} user
   * @param {Object} session
   *
   * @returns {boolean}
   */
  validate: function(user, session) {
    return _.get(user, 'sessionVersion', 0) === session.version;
  },

};
