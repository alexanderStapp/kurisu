const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const { PICKER_CONTENT, resolveColorRoles, unassignableRoles, buildComponents, savePicker, getPicker } = require('../../services/colorRoleService');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('post-colors')
		.setDescription('Post (or refresh) the color picker message in a channel')
		.addChannelOption(option => option
			.setName('channel')
			.setDescription('The channel the color picker lives in')
			.addChannelTypes(ChannelType.GuildText)
			.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const channel = interaction.options.getChannel('channel');
		const { found, missing } = resolveColorRoles(interaction.guild);

		if (missing.length > 0) {
			return interaction.editReply(`I could not find these roles: ${missing.join(', ')}. Create them (exact lowercase names) and run this again.`);
		}

		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.editReply('I need the Manage Roles permission before I can hand out colors.');
		}

		const blocked = unassignableRoles(interaction.guild, found);

		if (blocked.length > 0) {
			return interaction.editReply(`these roles sit at or above my highest role, so I cannot assign them: ${blocked.map(role => role.name).join(', ')}. Move my role above them and run this again.`);
		}

		const existing = await getPicker(interaction.guild.id);
		const components = buildComponents(found);
		let message;

		if (existing) {
			try {
				const previousChannel = await interaction.client.channels.fetch(existing.channel_id);
				const previousMessage = await previousChannel.messages.fetch(existing.message_id);

				if (previousChannel.id === channel.id) {
					message = await previousMessage.edit({ content: PICKER_CONTENT, components });
				} else {
					await previousMessage.delete();
				}
			} catch (error) {
				console.error('Could not reuse the previous color picker message:', error.message);
			}
		}

		if (!message) {
			message = await channel.send({ content: PICKER_CONTENT, components });
		}

		await savePicker(interaction.guild.id, channel.id, message.id);

		return interaction.editReply(`color picker is live in ${channel} with ${found.size} colors.`);
	}
};
