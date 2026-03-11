const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('d20')
		.setDescription('Test fate'),
	async execute(interaction) {
		let reply = '';
		const result = Math.floor(Math.random() * 20) + 1;
		if (result === 20) {
			reply = `You rolled ${result}. Congratulations.`;
		} else if (result === 1) {
			reply = `You rolled ${result}. Sorry.`;
		} else {
			reply = `You rolled ${result}.`;
		}
		await interaction.reply(reply);
	}
};