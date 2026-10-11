require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const commands = fs.readdirSync(path.join(__dirname, 'commands'))
  .filter(f => f.endsWith('.js'))
  .map(f => require(`./commands/${f}`).data.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log(`Registered ${commands.length} commands`))
  .catch(console.error);