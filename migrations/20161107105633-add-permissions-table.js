var Sequelize = require('sequelize');

const permission = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
};

const userPermission = {

  permissionId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'permission',
      key: 'id'
    },
    onDelete: 'cascade'
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
    onDelete: 'cascade'
  }
};

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable('permission', permission)
      .then(
        ()=> {
          console.log('table permission created');
          return queryInterface.createTable('user_permission', userPermission);
        },
        ()=> {
          console.log('problem creating permission table');
        }
      )
      .then(
        ()=> {
          console.log('table user_permission created');
          return queryInterface.addIndex('user_permission', ['userId', 'permissionId'], {
            indexName: 'userPermissionIndex',
            indicesType: 'UNIQUE'
          });
        },
        ()=> {
          console.log('problem creating permission table');
        }
      )
      .then(
        ()=> {
          console.log('index userPermissionIndex --> user_permission[userId, permissionId] created');
          done();
        },
        ()=> {
          console.log('problem creating userPermissionIndex --> user_permission[userId, permissionId] index')
        }
      );
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface
      .removeIndex('user_permission', 'userPermissionIndex')
      .then(
        ()=> {
          console.log('index userPermissionIndex --> user_permission[userId, permissionId] removed');
          return queryInterface.dropTable('user_permission');
        },
        ()=> {
          console.log('problem dropping user_permission');
        }
      )
      .then(
        ()=> {
          console.log('table user_permission dropped');
          return queryInterface.dropTable('permission');
        },
        ()=> {
          console.log('problem dropping user_permission');
        }
      )
      .then(
        ()=> {
          console.log('table permission dropped');
          done();
        },
        ()=> {
          console.log('problem dropping permission table');
        }
      );
  }
};
