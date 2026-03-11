module.exports = (sequelize, DataTypes) => {
	return sequelize.define('characters', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			unique: true
		},
		fighter_number: {
			type: DataTypes.INTEGER
		},
		name: {
			type: DataTypes.STRING
		},
		code_name: {
			type: DataTypes.STRING,
			unique: true
		},
		full: {
			type: DataTypes.STRING
		},
		thumb: {
			type: DataTypes.STRING
		},
		icon: {
			type: DataTypes.STRING
		},
		current_round_votes: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false
		},
		is_out: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		has_played: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	});
};