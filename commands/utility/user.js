const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Who are you?'),
	async execute(interaction) {
		await interaction.reply(`${interaction.user.username}, you joined on ${interaction.member.joinedAt}.`);
	}
};