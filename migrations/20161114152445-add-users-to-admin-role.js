'use strict';
var User = require(__dirname + '/../app/models/user.js').sequelize;
var _ = require('lodash');

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    var roleAdminId = 2;
    var date = new Date();
    queryInterface.select(User, 'users')
      .then((users)=> {
        var bulkUserRole = _.map(users, function (user) {
          return {
            user_id: user.id,
            role_id: roleAdminId,
            createdAt: date,
            updatedAt: date
          };
        });
        queryInterface.bulkInsert('user_role', bulkUserRole).then(()=>done())
      });
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.bulkDelete('user_role', {}, {truncate: true}).then(()=>done());
  }
};
