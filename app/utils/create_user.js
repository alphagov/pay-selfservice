var userService = require('../services/user_service2.js');

module.exports.create = function (user, role) {
  return userService.create(user, role)
    .then((u) => {
      console.log('User created');

      return u;
    });
};
