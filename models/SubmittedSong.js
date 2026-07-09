module.exports = (sequelize, DataTypes) => {
	return sequelize.define('submitted_songs', {
		guild_id: {
			type: DataTypes.STRING
		},
		year: {
			type: DataTypes.INTEGER
		},
		month: {
			type: DataTypes.INTEGER
		},
		track_id: {
			type: DataTypes.STRING
		},
		thread_channel_id: {
			type: DataTypes.STRING
		},
		thread_message_id: {
			type: DataTypes.STRING
		},
		admin_message_id: {
			type: DataTypes.STRING
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: 'pending'
		}
	}, {
		indexes: [
			{
				unique: true,
				fields: ['guild_id', 'year', 'month', 'track_id']
			}
		]
	});
};
