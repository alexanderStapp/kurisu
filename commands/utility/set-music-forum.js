const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const GuildSetting = require('../../models/GuildSetting')(sequelize, Sequelize.DataTypes);

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('set-music-forum')
		.setDescription('Set the forum channel Arisu watches for Now Playing song links.')
		.addChannelOption(option =>
			option.setName('forum')
				.setDescription('The music forum channel.')
				.addChannelTypes(ChannelType.GuildForum)
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		const channel = interaction.options.getChannel('forum', true);
		if (channel.type !== ChannelType.GuildForum) {
			return interaction.reply({ content: 'That channel is not a forum channel.', flags: MessageFlags.Ephemeral });
		}
		await GuildSetting.upsert({
			guild_id: interaction.guildId,
			music_forum_channel_id: channel.id
		});
		return interaction.reply({ content: `Now watching <#${channel.id}> for Now Playing song links. Use /init-now-playing to create this month's post.`, flags: MessageFlags.Ephemeral });
	}
};
