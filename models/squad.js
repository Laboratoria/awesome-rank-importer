'use strict';
module.exports = function(sequelize, DataTypes) {
  var Squad = sequelize.define('Squad', {
    name: DataTypes.STRING,
		userId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
				models.User.hasOne(Squad, { foreignKey: 'userId' });
      }
    }
  });
  return Squad;
};
