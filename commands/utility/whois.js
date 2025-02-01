const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whois')
		.setDescription('Who are you?')
		.addUserOption(option => option.setName('user')
			.setDescription('The user. Leave blank for self.')
		),
	async execute(interaction) {
		let reply = '';
		const inputUser = await interaction.options.getUser('user');
		console.log(inputUser);
		if (inputUser) {
			const guildMember = await interaction.guild.members.fetch(inputUser.id);
			if (inputUser.id == '1333524063888343070') {
				reply = `My name is Kurisu. I am a bot that lives in discord. I have been alive in this server since ${guildMember.joinedAt}`;
			} else if ((inputUser.id == interaction.user.id)) {
				reply = `You are ${interaction.user.username}. you joined on ${interaction.member.joinedAt}.`;
			} else {
				reply = `${inputUser}, they joined this server on ${guildMember.joinedAt}.`;
			}
		} else {
			reply = `You are ${interaction.user.username}. you joined on ${interaction.member.joinedAt}.`;
		}
		await interaction.reply(reply);
	}
};