module.exports = (sequelize, DataTypes) => {
	return sequelize.define('guild_settings', {
		guild_id: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		music_forum_channel_id: {
			type: DataTypes.STRING
		},
		song_channel_id: {
			type: DataTypes.STRING
		}
	});
};
