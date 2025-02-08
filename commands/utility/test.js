const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('this is a test')
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		await interaction.reply({ content: 'the test worked.', flags: MessageFlags.Ephemeral });
	}
};