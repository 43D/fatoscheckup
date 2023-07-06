const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, EmbedBuilder, MessagePayload } = require('discord.js');
const fs = require('fs');
const Comandos = require('./comandos.js');
const RngService = require('./rngService.js');

class Bot {
    constructor() {
        this.config = this.loadConfig();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.GuildIntegrations
            ],
            partials: [Partials.Channel, Partials.ThreadMember]
        });
        this.commands = new Comandos(SlashCommandBuilder, EmbedBuilder, MessagePayload);
        this.rngService = new RngService();
    }

    loadConfig() {
        const rawData = fs.readFileSync('configs.json');
        return JSON.parse(rawData);
    }

    async start() {
        this.client.once('ready', () => {
            console.log('Bot está online!');
        });

        this.client.on('ready', async () => {
            console.log(`Logged in as ${this.client.user.tag}`);
            this.commands.registerCommands(this.client);
        });

        this.client.on('guildCreate', (guild) => {
            const filePath = `./configs.${guild.id}.json`;
            this.checkJson(filePath);
            console.log(`Nova guilda: ${guild.id}`);
        });

        this.client.on('interactionCreate', (interaction) => {
            const filePath = `./configs.${interaction.guildId}.json`;
            this.checkJson(filePath);
            let configGuild = this.loadConfigFile(filePath);

            if (!interaction.isCommand()) return;

            const { commandName } = interaction;
            if (!this.commands.getListName().includes(commandName)) return;

            const index = this.commands.getListName().indexOf(commandName);
            const comando = this.commands.getComando();
            comando[index].execute(interaction, configGuild, this.saveConfig.bind(this, filePath));
        });

        this.client.on('messageCreate', async (message) => {
            const filePath = `./configs.${message.guildId}.json`;
            this.checkJson(filePath);
            let configGuild = this.loadConfigFile(filePath);

            const isBotMessage = message.author.id === this.client.user.id;
            const isMentioned = message.mentions.has(this.client.user);
            const isReply = message.reference && message.reference.messageId;

            if (isMentioned && isReply && !isBotMessage) {
                const isReplyBot = message.mentions.repliedUser.id === this.client.user.id;
                if (isReplyBot) return;

                try {
                    const fetchedMessage = await message.channel.messages.fetch(message.reference.messageId);
                    this.rngService.handleMessageMentioned(fetchedMessage, configGuild);
                } catch (error) {
                    console.error('Ocorreu um erro ao buscar ou responder à mensagem:', error);
                    return;
                }
                return;
            }

            if (isMentioned && !isBotMessage) {
                try {
                    this.rngService.handleMessageMentioned(message, configGuild);
                } catch (error) {
                    console.log(`Error: ${error}`);
                    return;
                }
            }

            if (!configGuild.channel.all) {
                if (!configGuild.channel.list.includes(message.channel.id)) return;
            }

            if (configGuild.channel.deny.includes(message.channel.id))
                return;

            try {
                this.rngService.handleMessage(message, configGuild);
            } catch (error) {
                console.log(`Error: ${error}`);
            }

            console.log('Message reply');
        });

        await this.client.login(this.config.token);
    }

    checkJson(filePath) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(this.config), 'utf-8');
            console.log('O arquivo foi criado com sucesso.');
        }
    }

    loadConfigFile(filePath) {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    }

    saveConfig(filePath, jsons) {
        const jsonString = JSON.stringify(jsons);
        fs.writeFileSync(filePath, jsonString);
    }
}

const bot = new Bot();
bot.start();