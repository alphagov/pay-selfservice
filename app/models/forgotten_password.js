var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
// CLEAN ALTHOUGH I THINK SOME STUFF IN THE USER CAN BE PUT IN HERE

var forgottenPassword = sequelizeConnection.define('forgotten_password', {
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
  }
});


var destroy = function(code){
  return forgottenPassword.destroy({ where: { code: code } });
};

module.exports = {
  sequelize: forgottenPassword,
  destroy: destroy
};
