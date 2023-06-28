const { SlashCommandBuilder, EmbedBuilder, MessagePayload } = require('discord.js');

class Comandos {
    constructor() {
        this.comando_list = [];
        this.comando = [];
        this.createCommands();
    }

    getComando() {
        return this.comando;
    }
    getListName() {
        return this.comando_list;
    }

    createCommands() {
        this.comando.push(this.createAddUser());
        this.comando.push(this.createRemoveUser());
        this.comando.push(this.createListUser());
        this.comando.push(this.createSetMethodChecking());
        this.comando.push(this.createAddChannel());
        this.comando.push(this.createRemoveChannel());
        this.comando.push(this.createListChannel());
        this.comando.push(this.createSetAllChannel());
        this.comando.push(this.createAllowRandomUserChecking());
    }

    createAddUser() {
        this.comando_list.push("add_user");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_user')
                .setDescription('Adicione um usuário para ser checkado!!! Taxa de comentários: 5%, checkagem: 50%')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Marcação de usuário ou ID de usuário')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const member = options.getMember('target');
                const id = member.user.id;
                const name = member.user.username;
                if (!id) {
                    await interaction.reply('Usuario não reconhecido!!');
                    return;
                }

                if (config.user.hasOwnProperty(id)) {
                    await interaction.reply('Usuario já cadastrado!!');
                    return;
                }

                config.user[id] = {
                    "user_id": id,
                    "name": name,
                    "taxa": 5,
                    "checking": 50
                };

                saveConfig.save(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createRemoveUser() {
        this.comando_list.push("remove_user");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_user')
                .setDescription('Remova um usuário das chackagem')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Marcação de usuário ou ID de usuário')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const member = options.getMember('target');
                const id = member.user.id;
                if (!id) {
                    await interaction.reply('Usuario não reconhecido!!');
                    return;
                }

                if (!config.user.hasOwnProperty(id)) {
                    await interaction.reply('Usuario não emcontrado!!');
                    return;
                }
                delete config.user[id];
                saveConfig.save(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createListUser() {
        this.comando_list.push("list_users");
        const data = {
            data: new SlashCommandBuilder()
                .setName('list_users')
                .setDescription('Liste os usuário que são checkados'),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const emb = new EmbedBuilder()
                    .setColor(0x002842)
                    .setTitle('Lista de Usuarios');

                if (config.random_user.pass)
                    emb.setDescription(`Todos usuários que não estão na lista possuem ${config.random_user.rng}% de serem checkados!!!`)
                else
                    emb.setDescription("Apenas esses usuários são checkados:");

                let name = {
                    name: "**Name**",
                    value: "-----------\n",
                    inline: true
                };
                let taxa = {
                    name: "**Taxa**",
                    value: "-----\n",
                    inline: true
                };
                let checking = {
                    name: "**Checkagem**",
                    value: "-----\n",
                    inline: true
                };

                for (let chave in config.user) {
                    const objeto = config.user[chave];
                    name.value += `\n<@!${objeto.user_id}>`;
                    taxa.value += `\n${objeto.taxa}%`;
                    checking.value += `\n${objeto.checking}%`;
                }
                emb.addFields(name, taxa, checking);
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });

                await interaction.reply(replyPayload);
            }
        };
        return data;
    }
    createSetMethodChecking() {
        this.comando_list.push("set_custom_checking");
        const data = {
            data: new SlashCommandBuilder()
                .setName('set_custom_checking')
                .setDescription('Adicione ou mude os RNG de checkagem de certos usuário')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Marcação de usuário ou ID de usuário')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('taxa')
                        .setDescription('Valor entre 0.0001 e 100. Taxa de comentarios que vão ser checados!!')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('checking')
                        .setDescription('Valor entre 0.0001 e 100. Probabilidade de uma mensagem ser considerado FakeNews!')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;

                const member = options.getMember('target');
                const taxa = options.getNumber('taxa');
                const checking = options.getNumber('checking');
                const id = member.user.id;
                const name = member.user.username;

                if (!id) {
                    await interaction.reply('Usuario não reconhecido!!');
                    return;
                }

                if (!taxa || taxa <= 0 || taxa > 101) {
                    await interaction.reply('Configuração negada! Insira um valor entre 0.0001 e 100');
                    return;
                }

                if (!checking || checking <= 0 || checking > 101) {
                    await interaction.reply('Configuração negada! Insira um valor entre 0.0001 e 100');
                    return;
                }

                config.user[id] = {
                    "user_id": id,
                    "name": name,
                    "taxa": taxa,
                    "checking": checking
                };

                saveConfig.save(config);

                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createAddChannel() {
        this.comando_list.push("add_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_channel')
                .setDescription('Adicione um canal que poderá ser checkado')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to echo into')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const channelOption = options.get('channel');
                if (!channelOption) {
                    await interaction.reply('Channel não reconhecido!!');
                    return;
                }

                const channelId = channelOption.channel.id;

                if (config.channel.list.includes(channelId)) {
                    await interaction.reply('Channel já cadastrado!!');
                    return;
                }

                config.channel.list.push(channelId);

                saveConfig.save(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createRemoveChannel() {
        this.comando_list.push("remove_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_channel')
                .setDescription('Remova um canal da checkagem')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to echo into')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const channelOption = options.get('channel');

                if (!channelOption) {
                    await interaction.reply('Channel não reconhecido!!');
                    return;
                }

                const channelId = channelOption.channel.id;

                const indice = config.channel.list.indexOf(channelId);
                if (indice === -1) {
                    await interaction.reply('Channel não encontrado!!');
                    return;
                }
                config.channel.list.splice(indice, 1);

                saveConfig.save(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createListChannel() {
        this.comando_list.push("list_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('list_channel')
                .setDescription('Liste todos os canais que serão checkados (caso set_all_channel esteja desabilitado)'),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const emb = new EmbedBuilder()
                    .setColor(0x002842)
                    .setTitle('Lista de Canais permitidos');

                if (config.channel.all)
                    emb.setDescription('Todos canais estão ativos pelo comando /set_all_channel')
                else
                    emb.setDescription("* <#" + config.channel.list.join(">\n* <#") + ">");
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });

                await interaction.reply(replyPayload);
            }
        };
        return data;
    }
    createSetAllChannel() {
        this.comando_list.push("set_all_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('set_all_channel')
                .setDescription('Permitir que o bot checke todos os chats (desabilita lista de filtro)')
                .addBooleanOption(option =>
                    option.setName('status')
                        .setDescription('Whether or not the echo should be ephemeral')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                config.channel.all = options.getBoolean('status');
                saveConfig.save(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createAllowRandomUserChecking() {
        this.comando_list.push("allow_random_user_checking");
        const data = {
            data: new SlashCommandBuilder()
                .setName('allow_random_user_checking')
                .setDescription('Permitir checkagem de usuários aleatórios que não estejam na lista de filtro')
                .addBooleanOption(option =>
                    option.setName('status')
                        .setDescription('Habilitar?')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('valor')
                        .setDescription('Valor entre 0.0001 e 100')),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const valor = options.getNumber('valor');
                const status = options.getBoolean('status');

                config.random_user.pass = status;

                if (!status) {
                    saveConfig.save(config);
                    await interaction.reply('Pong! Tudo Certo');
                    return;
                }
                if (!valor || valor <= 0 || valor > 101) {
                    await interaction.reply('Configuração negada! Insira um valor entre 0.0001 e 100');
                    return;
                }

                config.random_user.rng = valor;
                saveConfig.save(config);
                await interaction.reply('Pong! Tudo Certo');
            }
        };
        return data;
    }
}

module.exports = Comandos;