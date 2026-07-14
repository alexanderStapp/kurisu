const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const CommandCooldown = require('../models/CommandCooldown')(sequelize, Sequelize.DataTypes);

async function getCooldownExpiry(userId, commandName) {
	const row = await CommandCooldown.findOne({ where: { user_id: userId, command_name: commandName } });
	if (!row) {
		return null;
	}

	const expiresAt = new Date(row.expires_at).getTime();
	if (expiresAt <= Date.now()) {
		await row.destroy();
		return null;
	}

	return expiresAt;
}

async function startCooldown(userId, commandName, durationMs) {
	const expiresAt = new Date(Date.now() + durationMs);
	const [row, created] = await CommandCooldown.findOrCreate({
		where: { user_id: userId, command_name: commandName },
		defaults: { expires_at: expiresAt }
	});

	if (!created) {
		row.expires_at = expiresAt;
		await row.save();
	}
}

module.exports = { getCooldownExpiry, startCooldown };
