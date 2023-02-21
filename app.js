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
            let doc = await collection.findOne({ "name": 'upcoming-events' });

            if (doc) {
                let eventData = [];

                for (let i = 0; i < doc.topic.length; i++) {
                    let indexTime = new Date(doc.times[i]);
                    let formattedHour = indexTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    let formattedDate = indexTime.toString().substring(0, indexTime.toString().indexOf(indexTime.getFullYear().toString())+4);
                    let formattedDateTime = formattedDate + " " + formattedHour;

                    eventData.push({ "name": doc.topic[i], "value": formattedDateTime });
                }
                let dataEmbed = createEmbed({title: "Upcoming events", objList: eventData});

                editInteration(dataEmbed, interaction);
            } else {
                editInteration(createEmbed({title: "ERROR: Try again later"}), interaction);
            }

            break;
        default:
            break;
    }
});

function createEmbed({ title: title, content: content, objList: objList }) {
    let embed = new EmbedBuilder()
        .setColor("#21cccc")
        .setTitle(title)

    if (content) {
        embed.setDescription(content);
    }

    if (objList) {
        objList.forEach(obj => embed.addFields(obj));
    }
    return embed;
}

function editInteration(content, interaction) {
    const data = typeof content === 'object' ? { embeds: [content] } : { content: content };
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

let task = cron.schedule('* * 23 * * *', () => {
    fetchFile(Date.now());
    console.log('Exectued cron job at ' + Date.now());
});

task.start();

