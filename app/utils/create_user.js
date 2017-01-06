var User = require('../models/user.js');

module.exports.create = function (user, role) {

  return User.create(user, role)
    .then((u) => {
      console.log('User created');

      return u;
    });

};
