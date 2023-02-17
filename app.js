const { Configuration, OpenAIApi } = require("openai");
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');

const axios = require('axios');
const cron = require('node-cron');
const fetchFile = require("./cronjob.js");

const uri = process.env.MongoClient;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const config = new Configuration({
    apiKey: process.env.OPENAI_TOKEN,
});

const openai = new OpenAIApi(config);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.IT_BOT_TOKEN);


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;
    await interaction.deferReply();

    switch (command) {
        case 'question':
            let prompt = interaction.options._hoistedOptions[0].value;
            try {
                const response = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: generatePrompt(prompt),
                    temperature: 0.6,
                    max_tokens: 100
                });

                let embed = createEmbed({ title: prompt, content: response.data.choices[0].text });

                return editInteration(embed, interaction)

            } catch (err) {
                let errEmbed = createEmbed({ title: "Error", content: "An error has occured. Try again in a few seconds." });

                return editInteration(errEmbed, interaction)
            }
            break;
        case 'upcoming-tasks':
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

            client.connect(err => {
                console.error("error:", err);
            });

            const collection = client.db("IT-Help-Bot").collection("upcoming-events");
            collection.findOne("")

            break;
        default:
            break;
    }
});

function createEmbed({ title: title, content: content, objList: objList }) {
    let embed = EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle(title)

    if (content) {
        embed.setDescription(content);
    }

    if (objList) {
        embed.addFields(objList);
    }
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

cron.schedule('* * */23 * * *', () => {
    fetchFile.fetchUpcomingEvents(Date.now());
    console.log('Exectued cron job at ' + Date.now());
})

