module.exports = {
  /**
   * @param {Object} user
   * @param {Object} session

   *
   * @returns {boolean}
   */
  validate: function(user, session) {
    return user.getSessionVersion() === session.version;
  },

  incrementSessionVersion: function(user) {
    user.incrementSessionVersion();
  }
};