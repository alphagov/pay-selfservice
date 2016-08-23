'use strict';
var Sequelize = require('sequelize');

const userTable = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },

  username: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },

  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },

  email: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },

  gateway_account_id: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },

  otp_key: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },

  telephone_number: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  }
},

forgottenPasswordsTable = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },

  date: {
    type: Sequelize.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'cascade',
    onDelete: 'cascade'
  },

};


module.exports = {
  up: function (queryInterface, Sequelize, done) {
    return queryInterface
    .describeTable('users')
      .then(
        ()=> console.log('users table exists'),
        ()=> { return queryInterface.createTable('users',userTable);}
      )
      .then(
        ()=> { return queryInterface.describeTable('forgotten_passwords');},
        ()=> { console.log('problem creating users table');}
      )
      .then(
        ()=> console.log('forgotten password table exists'),
        ()=> { return queryInterface.createTable('forgotten_passwords',forgottenPasswordsTable);}
      ).then(
        ()=> { done(); console.log('made forgotten passwords and users table');},
        ()=> console.log('problem creating forgotten passwords'));



  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface
    .dropTable('forgotten_passwords')
      .then(
        ()=> { return queryInterface.dropTable('users'); },
        ()=> { console.log('problem dropping forgotten passwords');}
      )
      .then(
        ()=> { done(); console.log('dropped forgotten passwords and users table');},
        ()=> { console.log('problem dropping users');}
      );
    }
  };
