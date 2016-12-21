var userService = require('../services/user_service.js');

module.exports.create = function (user, role) {
  return userService.create(user, role)
    .then((u) => {
      console.log('User created');

      return u;
    });
};
