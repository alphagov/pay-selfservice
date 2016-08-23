'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'users',
      'disabled',
      {
        type: Sequel.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.removeColumn('users', 'disabled')
  }
};
