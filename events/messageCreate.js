const { Events } = require('discord.js');
const { askGemini } = require('../utils/gemini');

const cooldowns = new Map();
const COOLDOWN_MS = 5000;

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // Only respond when the bot is directly @mentioned
    const mentioned = message.mentions.has(message.client.user, {
      ignoreEveryone: true,
      ignoreRoles: true,
    });
    if (!mentioned) return;

    // Remove the @mention from the text
    const prompt = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!prompt) return message.reply('Hi! Ask me something.');

    // Simple per-user cooldown
    const last = cooldowns.get(message.author.id) || 0;
    if (Date.now() - last < COOLDOWN_MS) {
      return message.reply('Give me a few seconds between questions.');
    }
    cooldowns.set(message.author.id, Date.now());

    try {
      await message.channel.sendTyping();
      const name = message.member?.displayName ?? message.author.username;
      const text = (await askGemini(prompt, name)) || 'I could not come up with a reply.';

      // Discord messages max out at 2000 characters
      const chunks = text.match(/[\s\S]{1,1900}/g) || [];
      for (const chunk of chunks) {
        await message.reply({ content: chunk, allowedMentions: { parse: [] } });
      }
    } catch (err) {
      console.error('Gemini error:', err);
      await message.reply('Sorry, something went wrong talking to Gemini.');
    }
  },
};