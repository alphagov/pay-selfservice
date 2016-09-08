'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface, Sequelize,done) {
    return queryInterface.addColumn(
      'users',
      'disabled',
      {
        type: Sequel.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }).then(done,()=> {console.log(arguments); done()});
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.removeColumn('users', 'disabled').then(done,
      ()=> {console.log(arguments); done(); })
  }
};
