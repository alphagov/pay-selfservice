'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface, Sequelize,done) {
    return queryInterface.addColumn(
      'users',
      'login_counter',
      {
        type: Sequel.INTEGER,
        allowNull: false,
        defaultValue: 0
      }).then(done,()=> {console.log(arguments); done()});
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.removeColumn('users', 'login_counter').then(done,
      ()=> {console.log(arguments); done(); })
  }
};
