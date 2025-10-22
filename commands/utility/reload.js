const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	category: 'utility',
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
			return interaction.reply({ content: `I failed to locate a command with name \`${commandName}\`!`, flags: MessageFlags.Ephemeral });
		}

		delete require.cache[require.resolve(`../${command.category}/${command.data.name}.js`)];

		try {
	        const newCommand = require(`../${command.category}/${command.data.name}.js`);
	        interaction.client.commands.set(newCommand.data.name, newCommand);
	        interaction.reply({ content: `I have reloaded the command called \`${newCommand.data.name}\`.`, flags: MessageFlags.Ephemeral });
		} catch (error) {
	        console.error(error);
	        await interaction.reply({ content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``, flags: MessageFlags.Ephemeral });
		}
	}
};