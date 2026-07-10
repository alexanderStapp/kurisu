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
		.setName('set-song-channel')
		.setDescription('Set the admin channel where Arisu posts submitted Now Playing song links.')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The admin-only text channel for song submissions.')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel', true);
		if (channel.type !== ChannelType.GuildText) {
			return interaction.reply({ content: 'That channel is not a text channel.', flags: MessageFlags.Ephemeral });
		}
		await GuildSetting.upsert({
			guild_id: interaction.guildId,
			song_channel_id: channel.id
		});
		return interaction.reply({ content: `Song submissions will be posted to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
	}
};
