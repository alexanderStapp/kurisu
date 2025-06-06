const { REST, Routes } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { CLIENT_ID, TOKEN, GUILD_ID, GUILD_ID_TEST } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Grab command folders
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN);

// deploy commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Refresh all commands in guild
		const data = await rest.put(
			// Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID_TEST),
			{ body: commands }
		);

		// Refresh all commands globally
		// const data = await rest.put(
		// 	Routes.applicationCommands(CLIENT_ID),
		// 	{ body: commands }
		// );

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
