const { Configuration, OpenAIApi } = require("openai");
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const axios = require('axios');

const config = new Configuration({
    apiKey: process.env.OPENAI_TOKEN,
});

const openai = new OpenAIApi(config);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    if (command === 'question') {
        let prompt = interaction.options._hoistedOptions[0].value;
        await interaction.deferReply();

        try {
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: generatePrompt(prompt),
                temperature: 0.6,
                max_tokens: 100
            });

           let embed = createEmbed({title: prompt, content: response.data.choices[0].text});

            return editInteration(embed, interaction)

        } catch (err) {
            let errEmbed = createEmbed({title: "Error", content: "An error has occured. Try again in a few seconds."});

            return editInteration(errEmbed, interaction)
        }
    }
});

function createEmbed({title: title, content: content}) {
    return new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(title)
    .setDescription(content);
}

function editInteration(content, interaction) {
    const data = typeof content === 'object' ? { embeds: [content] } : { content: content.trim() };
    return axios
        .patch(`https://discord.com/api/v8/webhooks/${process.env.IT_BOT_CLIENT}/${interaction.token}/messages/@original`, data);
}

function generatePrompt(animal) {
    const capitalizedAnimal =
        animal[0].toUpperCase() + animal.slice(1).toLowerCase();
    return `Answer this IT Question with discord text formatting (without using backticks).
  
  
  Question: ${capitalizedAnimal}
  Answer:`;
}

client.login(process.env.IT_BOT_TOKEN);