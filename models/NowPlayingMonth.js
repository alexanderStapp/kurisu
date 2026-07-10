module.exports = (sequelize, DataTypes) => {
	return sequelize.define('now_playing_months', {
		guild_id: {
			type: DataTypes.STRING
		},
		year: {
			type: DataTypes.INTEGER
		},
		month: {
			type: DataTypes.INTEGER
		},
		sequence: {
			type: DataTypes.INTEGER
		},
		forum_thread_id: {
			type: DataTypes.STRING
		}
	}, {
		indexes: [
			{
				unique: true,
				fields: ['guild_id', 'year', 'month']
			}
		]
	});
};
