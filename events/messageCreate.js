const { Events } = require('discord.js');
const { findMonthForThread, getSongChannelId, createPendingSubmission, setAdminMessageId, parseTrackIds, formatMonth } = require('../services/nowPlayingService');

const SPOTIFY_MENTION = /open\.spotify\.com|spotify:/i;

async function react(message, emoji) {
	try {
		await message.react(emoji);
	} catch (error) {
		console.error('Failed to react to Now Playing message:', error.message);
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) {
			return;
		}
		const channel = message.channel;
		if (typeof channel.isThread !== 'function' || !channel.isThread()) {
			return;
		}

		const month = await findMonthForThread(channel.id);
		if (!month) {
			return;
		}

		const trackIds = parseTrackIds(message.content);
		if (trackIds.length === 0) {
			if (SPOTIFY_MENTION.test(message.content)) {
				await react(message, '❌');
			}
			return;
		}

		const songChannelId = await getSongChannelId(message.guildId);
		if (!songChannelId) {
			console.error(`No song channel configured for guild ${message.guildId}; cannot forward submissions.`);
			await react(message, '❌');
			return;
		}

		let songChannel;
		try {
			songChannel = await message.client.channels.fetch(songChannelId);
		} catch (error) {
			console.error('Failed to fetch song channel:', error.message);
			await react(message, '❌');
			return;
		}

		const label = formatMonth(month.year, month.month);
		let pending = false;
		let duplicate = false;
		let failed = false;
		for (const trackId of trackIds) {
			try {
				const submission = await createPendingSubmission(message.guildId, month.year, month.month, trackId, channel.id, message.id);
				if (!submission) {
					duplicate = true;
					continue;
				}
				const adminMessage = await songChannel.send(`new song for ${label} playlist: https://open.spotify.com/track/${trackId} (from ${message.author})`);
				await adminMessage.react('✅');
				await adminMessage.react('❌');
				await setAdminMessageId(submission, adminMessage.id);
				pending = true;
			} catch (error) {
				console.error('Failed to forward Now Playing submission:', error.message);
				failed = true;
			}
		}

		if (pending) {
			await react(message, '⏳');
		}
		if (duplicate) {
			await react(message, '🔁');
		}
		if (failed) {
			await react(message, '❌');
		}
	}
};
