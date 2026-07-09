const { Events } = require('discord.js');
const { findSubmissionByAdminMessage, resolveSubmission } = require('../services/nowPlayingService');

module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		if (user.bot) {
			return;
		}
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Failed to fetch partial reaction:', error.message);
				return;
			}
		}

		const emoji = reaction.emoji.name;
		if (emoji !== '✅' && emoji !== '❌') {
			return;
		}

		const submission = await findSubmissionByAdminMessage(reaction.message.id);
		if (!submission || submission.status !== 'pending') {
			return;
		}

		const success = emoji === '✅';
		await resolveSubmission(submission, success ? 'added' : 'failed');

		try {
			const client = reaction.client;
			const channel = await client.channels.fetch(submission.thread_channel_id);
			const userMessage = await channel.messages.fetch(submission.thread_message_id);
			const pending = userMessage.reactions.cache.get('⏳');
			if (pending) {
				await pending.users.remove(client.user.id);
			}
			await userMessage.react(success ? '✅' : '❌');
		} catch (error) {
			console.error('Failed to relay admin decision to user message:', error.message);
		}
	}
};
