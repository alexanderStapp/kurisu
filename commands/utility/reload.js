const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`I failed to locate a command with name \`${commandName}\`!`);
		}

		delete require.cache[require.resolve(`./${command.data.name}.js`)];

		try {
			const newCommand = require(`./${command.data.name}.js`);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			await interaction.reply(`I have reloaded the command called \`${newCommand.data.name}\`.`);
		} catch (error) {
			console.error(error);
			await interaction.reply(`Error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
		}

	}
};