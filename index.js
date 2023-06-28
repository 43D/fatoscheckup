const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
const Comandos = require('./comandos.js');
const fs = require('fs');

const client = new Client(
    {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildIntegrations
        ],
        partials: [Partials.Channel, Partials.ThreadMember]
    }
);

const rawData = fs.readFileSync('configs.json');
var config = JSON.parse(rawData);
const comm = new Comandos();
const comando_list = comm.getListName();
const commands = comm.getComando();


client.once('ready', () => {
    console.log('Bot está online!');
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    commands.forEach((v, k) => client.application.commands.create(v.data))
});

client.on('guildCreate', (guild) => {
    const filePath = `./configs.${guild.id}.json`;

    if (fs.existsSync(filePath)) {
        console.log('O arquivo já existe.');
    } else {
        fs.writeFileSync(filePath, JSON.stringify(config), 'utf-8');
        console.log('O arquivo foi criado com sucesso.');
    }

    console.log(`nova guilda: ${guild.id}`);
});

client.on('interactionCreate', (interaction) => {
    const filePath = `./configs.${interaction.guildId}.json`;
    const rawData = fs.readFileSync(filePath);
    var configGuild = JSON.parse(rawData);

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    if (!comando_list.includes(commandName)) return;

    const index = comando_list.indexOf(commandName);

    commands[index].execute(interaction, configGuild, saveConfig(filePath));
});

client.on('messageCreate', (message) => {
    const filePath = `./configs.${message.guildId}.json`;
    const rawData = fs.readFileSync(filePath);
    var configGuild = JSON.parse(rawData);


    if (!configGuild.channel.all) {
        if (!configGuild.channel.list.includes(message.channel.id))
            return;
    }

    console.log("message");
    const rngs = rng();

    if (configGuild.user.hasOwnProperty(message.author.id)) {
        rngs.rng_custom(message.author.id, message, configGuild);
    } else if (configGuild.random_user.pass) {
        rngs.rng_default(message, configGuild);
    }

    console.log("message reply");
});

client.login(config.token); // Substitua "TOKEN_DO_SEU_BOT" pelo token do seu bot

function saveConfig(filePath) {
    function save(jsons) {
        const jsonString = JSON.stringify(jsons);
        fs.writeFileSync(filePath, jsonString);
    }

    return { save }
}

function rng() {
    function rng_custom(id, message, configs) {
        taxa = configs.user[id].taxa;
        check = configs.user[id].checking;
        if (verificaSucesso(taxa))
            if (verificaSucesso(check))
                fake_news(message);
            else
                real_news(message);
    }

    function rng_default(message, configs) {
        if (verificaSucesso(configs.random_user.rng))
            if (verificaSucesso(50))
                fake_news(message);
            else
                real_news(message);
    }

    async function real_news(message) {
        try {
            const valorAleatorio = config.img.real[Math.floor(Math.random() * config.img.real.length)];
            // Fazer a solicitação para obter a imagem da Imgur
            const response = await axios.get(valorAleatorio, { responseType: 'arraybuffer' });

            // Enviar a imagem como resposta usando reply
            await message.reply({ files: [{ attachment: response.data, name: 'imagem.png' }] });
        } catch (error) {
            message.reply("Real news");
        }
    }


    // 

    async function fake_news(message) {
        try {
            const valorAleatorio = config.img.fake[Math.floor(Math.random() * config.img.fake.length)];
            // Fazer a solicitação para obter a imagem da Imgur
            const response = await axios.get(valorAleatorio, { responseType: 'arraybuffer' });

            console.log(response);
            // Enviar a imagem como resposta usando reply
            await message.reply({ files: [{ attachment: response.data, name: 'imagem.png' }] });
        } catch (error) {
            message.reply("Fake news");
        }

    }

    function verificaSucesso(taxaSucesso) {
        if (taxaSucesso >= 0 && taxaSucesso <= 100) {
            const random = Math.random() * 10000;
            return random <= (taxaSucesso * 100);
        }
        return false;
    }

    return { rng_custom, rng_default }
}