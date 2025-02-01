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
		const otherUser = await interaction.options.getUser('user');
		if (otherUser) {
			const guildMember = await interaction.guild.members.fetch(user.id);
			if (otherUser.id == '1333524063888343070') {
				reply = `My name is Kurisu. I am a bot that lives in discord. I have been a part of this server since ${guildMember.joinedAt}`;
			} else {
				reply = `${otherUser}, they joined this server on ${guildMember.joinedAt}.`;
			}
		} else {
			reply = `You are ${interaction.user.username}. you joined on ${interaction.member.joinedAt}.`;
		}
		await interaction.reply(reply);
	}
};