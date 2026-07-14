module.exports = (sequelize, DataTypes) => {
	return sequelize.define('command_cooldowns', {
		user_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		command_name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}, {
		indexes: [
			{
				unique: true,
				fields: ['user_id', 'command_name']
			}
		]
	});
};
