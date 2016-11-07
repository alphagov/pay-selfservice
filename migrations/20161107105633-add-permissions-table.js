var Sequelize = require('sequelize');

const permissionsTable = {
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

  permission: {
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
  }
};


module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable('user_permissions',permissionsTable)
    .then(
      ()=> { console.log('made permissions table'); done(); },
      ()=> { console.log('problem creating permissions') }
    );
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface
    .dropTable('user_permissions')
      .then(
        ()=> { console.log('dropped permissions table'); done(); },
        ()=> { console.log('problem dropping permissions'); }
      );
    }
  };
