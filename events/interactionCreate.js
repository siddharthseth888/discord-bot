const { Events, MessageFlags } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const msg = { content: 'Something went wrong.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
      else await interaction.reply(msg);
    }
  },
};