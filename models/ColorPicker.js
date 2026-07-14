module.exports = (sequelize, DataTypes) => {
	return sequelize.define('color_pickers', {
		guild_id: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		channel_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		message_id: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
};
