const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const GuildSetting = require('../../models/GuildSetting')(sequelize, Sequelize.DataTypes);
const { ensureMonthForGuild } = require('../../services/nowPlayingService');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('init-now-playing')
		.setDescription('Create this month\'s Now Playing forum post now, regardless of the date.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		const setting = await GuildSetting.findByPk(interaction.guildId);
		if (!setting || !setting.music_forum_channel_id) {
			return interaction.reply({ content: 'No music forum is set for this server. Use /set-music-forum first.', flags: MessageFlags.Ephemeral });
		}
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		try {
			await ensureMonthForGuild(interaction.client, interaction.guildId, setting.music_forum_channel_id);
			return interaction.editReply(`This month's Now Playing post is ready in <#${setting.music_forum_channel_id}>.`);
		} catch (error) {
			console.error('Failed to initialize Now Playing post:', error.message);
			return interaction.editReply(`Could not create this month's post: ${error.message}`);
		}
	}
};
