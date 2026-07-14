const { Events, MessageFlags } = require('discord.js');
const { getCooldownExpiry, startCooldown } = require('../services/cooldownService');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`I am sorry, ${interaction.commandName} isn't a command in my memory.`);
			return;
		}

		const defaultCooldownDuration = 3;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

		const bypasses = command.cooldownBypassPermission
			&& interaction.memberPermissions
			&& interaction.memberPermissions.has(command.cooldownBypassPermission);

		if (!bypasses) {
			const expirationTime = await getCooldownExpiry(interaction.user.id, command.data.name);

			if (expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1_000);
				return interaction.reply({ content: `You are on cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
			}

			await startCooldown(interaction.user.id, command.data.name, cooldownAmount);
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error('there was an error: ', error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'Error while executing your command.', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'Error while executing your command.', flags: MessageFlags.Ephemeral });
			}
		}
	}
};
