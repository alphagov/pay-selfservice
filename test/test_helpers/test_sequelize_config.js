'use strict';

var Sequelize = require('sequelize');

function createInstance() {
  return new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',

    // the storage engine for sqlite
    // - default ':memory:'
    storage: __dirname + '/database.sqlite',
    define: {
      syncOnAssociation: true
    }
  });
}


module.exports = function () {
  return {
    sequelize: createInstance()
  };

}();
