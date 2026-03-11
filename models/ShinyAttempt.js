module.exports = (sequelize, DataTypes) => {
	return sequelize.define('shiny_attempts', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		attempts: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_time: {
			type: DataTypes.INTERGER,
			defaultValue: 0
		},
		pokemon_id: {
			type: DataTypes.STRING
		},
		game_id: {
			type: DataTypes.STRING
		},
		status: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	});
};