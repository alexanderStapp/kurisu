const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');
const colorsSource = require('../sources/colorsSource');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const ColorPicker = require('../models/ColorPicker')(sequelize, Sequelize.DataTypes);

const COLOR_SELECT_ID = 'color-select';
const CLEAR_VALUE = 'clear';
const PICKER_CONTENT = 'pick a color';

function resolveColorRoles(guild) {
	const found = new Map();
	const missing = [];

	for (const name of colorsSource) {
		const role = guild.roles.cache.find(candidate => candidate.name === name);
		if (role) {
			found.set(name, role);
		} else {
			missing.push(name);
		}
	}

	return { found, missing };
}

function unassignableRoles(guild, roles) {
	const ceiling = guild.members.me.roles.highest.position;
	return [...roles.values()].filter(role => role.position >= ceiling);
}

function buildComponents(roles) {
	const options = [...roles.keys()].map(name => new StringSelectMenuOptionBuilder()
		.setLabel(name)
		.setValue(name));

	options.push(new StringSelectMenuOptionBuilder()
		.setLabel('clear')
		.setDescription('remove your color')
		.setValue(CLEAR_VALUE));

	const select = new StringSelectMenuBuilder()
		.setCustomId(COLOR_SELECT_ID)
		.setPlaceholder('pick a color')
		.addOptions(options);

	return [new ActionRowBuilder().addComponents(select)];
}

async function savePicker(guildId, channelId, messageId) {
	const [row, created] = await ColorPicker.findOrCreate({
		where: { guild_id: guildId },
		defaults: { channel_id: channelId, message_id: messageId }
	});

	if (!created) {
		row.channel_id = channelId;
		row.message_id = messageId;
		await row.save();
	}
}

async function getPicker(guildId) {
	return ColorPicker.findByPk(guildId);
}

async function handleColorSelect(interaction) {
	const choice = interaction.values[0];
	const { found } = resolveColorRoles(interaction.guild);

	const paletteIds = new Set([...found.values()].map(role => role.id));
	const held = interaction.member.roles.cache.filter(role => paletteIds.has(role.id));

	if (choice === CLEAR_VALUE) {
		if (held.size > 0) {
			await interaction.member.roles.remove(held, 'Color picker: cleared');
		}
		return interaction.reply({ content: 'your color has been cleared.', flags: MessageFlags.Ephemeral });
	}

	const target = found.get(choice);

	if (!target) {
		return interaction.reply({ content: `the \`${choice}\` role no longer exists. ask an admin to re-run \`/post-colors\`.`, flags: MessageFlags.Ephemeral });
	}

	const stale = held.filter(role => role.id !== target.id);
	if (stale.size > 0) {
		await interaction.member.roles.remove(stale, 'Color picker: swapping color');
	}

	if (!held.has(target.id)) {
		await interaction.member.roles.add(target, 'Color picker: selected color');
	}

	return interaction.reply({ content: `your color is now **${choice}**.`, flags: MessageFlags.Ephemeral });
}

module.exports = {
	COLOR_SELECT_ID,
	PICKER_CONTENT,
	resolveColorRoles,
	unassignableRoles,
	buildComponents,
	savePicker,
	getPicker,
	handleColorSelect
};
