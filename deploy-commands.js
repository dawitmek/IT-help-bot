const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
	new SlashCommandBuilder().setName('question').setDescription('Ask me an IT related question!')
	.addStringOption(option => 
		option.setName('text')
		.setDescription('Enter your question.')
		.setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(process.env.IT_BOT_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands("1075556987707850882"), { body: commands });

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();