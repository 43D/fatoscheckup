const { SlashCommandBuilder, EmbedBuilder, MessagePayload } = require('discord.js');

class Comandos {
    constructor() {
        this.comando_list = [];
        this.comando = [];
        this.createCommands();
    }

    registerCommands(client) {
        this.getComando().forEach((v, k) =>
            client.application.commands.create(v.data));
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
        this.comando.push(this.createAddDenyUser());
        this.comando.push(this.createRemoveDenyUser());
        this.comando.push(this.createAddDenyChannel());
        this.comando.push(this.createRemoveDenyChannel());
        this.comando.push(this.createAddCustomImageSucess());
        this.comando.push(this.createAddCustomImageFail());
        this.comando.push(this.createListImage());
        this.comando.push(this.createRemoveCustomImageSucess());
        this.comando.push(this.createRemoveCustomImageFail());
        this.comando.push(this.createPathNote());
        this.comando.push(this.createHelp());
        this.comando.push(this.createInfo());
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
                    await interaction.reply('Usuário não reconhecido!!');
                    return;
                }

                if (config.user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário já cadastrado!!');
                    return;
                }

                if (config.deny_user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário está na deny list!!');
                    return;
                }

                config.user[id] = {
                    "user_id": id,
                    "name": name,
                    "taxa": 5,
                    "checking": 50
                };

                saveConfig(config);
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
                    await interaction.reply('Usuário não reconhecido!!');
                    return;
                }

                if (!config.user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário não emcontrado!!');
                    return;
                }
                delete config.user[id];
                saveConfig(config);
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
                    .setTitle('Lista de usuário');

                if (config.random_user.pass)
                    emb.setDescription(`Todos usuários que não estão na lista possuem ${config.random_user.rng}% de serem checkados!!!`)
                else
                    emb.setDescription("Apenas os usuários da lista são checkados:");

                let name = {
                    name: "**Name**",
                    value: ".\n",
                    inline: true
                };
                let taxa = {
                    name: "**Taxa**",
                    value: ".\n",
                    inline: true
                };
                let checking = {
                    name: "**Checkagem**",
                    value: ".\n",
                    inline: true
                };

                for (let chave in config.user) {
                    const objeto = config.user[chave];
                    name.value += `\n<@!${objeto.user_id}>`;
                    taxa.value += `\n${objeto.taxa}%`;
                    checking.value += `\n${objeto.checking}%`;
                }
                emb.addFields(name, taxa, checking);
                emb.addFields(
                    {
                        name: "---------------------------------------------------------------------",
                        value: "\n\n**Deny list:**  lista de usuários que não são automaticamente verificados\n",
                    },
                )

                let deny_name = {
                    name: "**Name**",
                    value: ".\n",
                    inline: true
                };

                for (let chave in config.deny_user) {
                    const objeto = config.deny_user[chave];
                    deny_name.value += `<@!${objeto.user_id}>\n`;
                }

                emb.addFields(deny_name);

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
                    await interaction.reply('Usuário não reconhecido!!');
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

                saveConfig(config);

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

                if (config.channel.deny.includes(channelId)) {
                    await interaction.reply('Channel está na deny list!!');
                    return;
                }

                config.channel.list.push(channelId);

                saveConfig(config);
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

                saveConfig(config);
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
                    emb.setDescription('Todos canais não negados estão ativos pelo comando /set_all_channel')
                else
                    emb.setDescription("* <#" + config.channel.list.join(">\n* <#") + ">");

                let list_deny = {
                    name: "-------------------------------------------------------------",
                    value: "**Deny list:**  lista de canais que não são automaticamente verificados:\n",
                };
                list_deny.value += "* <#" + config.channel.deny.join(">\n* <#") + ">";
                emb.addFields(list_deny);
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
                .setDescription('Permitir que o bot check todos os chats, excetos os que estão na deny list.')
                .addBooleanOption(option =>
                    option.setName('status')
                        .setDescription('Whether or not the echo should be ephemeral')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                config.channel.all = options.getBoolean('status');
                saveConfig(config);
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
                    saveConfig(config);
                    await interaction.reply('Pong! Tudo Certo');
                    return;
                }
                if (!valor || valor <= 0 || valor > 101) {
                    await interaction.reply('Configuração negada! Insira um valor entre 0.0001 e 100');
                    return;
                }

                config.random_user.rng = valor;
                saveConfig(config);
                await interaction.reply('Pong! Tudo Certo');
            }
        };
        return data;
    }
    //-------------------------------------------------------------------------- 

    createAddDenyUser() {
        this.comando_list.push("add_deny_user");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_deny_user')
                .setDescription('Adicione um usuário para lista de não checkagem!!')
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
                    await interaction.reply('Usuário não reconhecido!!');
                    return;
                }

                if (config.deny_user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário já cadastrado!!');
                    return;
                }

                if (config.user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário cadastrado para checkagem, remova ele antes com /remove_user!!');
                    return;
                }

                config.deny_user[id] = {
                    "user_id": id,
                    "name": name
                };

                saveConfig(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createRemoveDenyUser() {
        this.comando_list.push("remove_deny_user");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_deny_user')
                .setDescription('Remova um usuário da deny list')
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
                    await interaction.reply('Usuário não reconhecido!!');
                    return;
                }

                if (!config.deny_user.hasOwnProperty(id)) {
                    await interaction.reply('Usuário não emcontrado!!');
                    return;
                }
                delete config.deny_user[id];
                saveConfig(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createAddDenyChannel() {
        this.comando_list.push("add_deny_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_deny_channel')
                .setDescription('Adicione um canal que NÂO poderá ser checkado')
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

                if (config.channel.deny.includes(channelId)) {
                    await interaction.reply('Channel já cadastrado!!');
                    return;
                }

                if (config.channel.list.includes(channelId)) {
                    await interaction.reply('Channel cadastrado para checkagem, remova ele antes com /remove_channel');
                    return;
                }

                config.channel.deny.push(channelId);

                saveConfig(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createRemoveDenyChannel() {
        this.comando_list.push("remove_deny_channel");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_deny_channel')
                .setDescription('Remova um canal da deny list')
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

                const indice = config.channel.deny.indexOf(channelId);
                if (indice === -1) {
                    await interaction.reply('Channel não encontrado!!');
                    return;
                }
                config.channel.deny.splice(indice, 1);

                saveConfig(config);
                await interaction.reply('Pong!');
            }
        };
        return data;
    }
    createAddCustomImageSucess() {
        this.comando_list.push("add_custom_image_sucess");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_custom_image_sucess')
                .setDescription('Adicione mais uma imagem customizada para quando for sucesso (Fake news imgs)!!')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL da imagem')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const url = options.getString('url');

                try {
                    if (config.img.fake.includes(url)) {
                        await interaction.reply("Esta URL já está registrada!!!!");
                        return;
                    }

                    const channel = await interaction.client.channels.fetch(interaction.channelId);
                    channel.send({ files: [url] });
                    config.img.fake.push(url);
                    saveConfig(config);
                    await interaction.reply("URL registrada com sucesso!!!!");
                } catch (error) {
                    console.log(error);
                    await interaction.reply("Url não é válida!!!!!");
                }
            }
        };
        return data;
    }
    createAddCustomImageFail() {
        this.comando_list.push("add_custom_image_fail");
        const data = {
            data: new SlashCommandBuilder()
                .setName('add_custom_image_fail')
                .setDescription('Adicione mais uma imagem customizada para quando falha (Real news imgs)!!')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL da imagem')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const url = options.getString('url');

                try {
                    if (config.img.real.includes(url)) {
                        await interaction.reply("Esta URL já está registrada!!!!");
                        return;
                    }
                    const channel = await interaction.client.channels.fetch(interaction.channelId);
                    channel.send({ files: [url] });
                    config.img.real.push(url);
                    saveConfig(config);
                    await interaction.reply("URL registrada com sucesso!!!!");
                } catch (error) {
                    await interaction.reply("Url não é válida!!!!!");
                }
            }
        };
        return data;
    }
    createListImage() {
        this.comando_list.push("list_images");
        const data = {
            data: new SlashCommandBuilder()
                .setName('list_images')
                .setDescription('Liste todos as imagens (somente links)'),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;

                const emb = new EmbedBuilder()
                    .setTitle("Lista de imagens")
                    .setDescription("Todas as imagens aqui....")
                    .setColor(0x002842);
                let sucess = {
                    name: "**Lista de imagens FakeNews (sucess images):**",
                    value: "* ",
                };
                let fail = {
                    name: "**Lista de imagens RealNews (fail images):**",
                    value: "* ",
                };
                sucess.value += config.img.fake.join("\n* ");
                fail.value += config.img.real.join("\n* ");

                emb.addFields(sucess, fail);
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });
                await interaction.reply(replyPayload);
            }
        };
        return data;
    }
    createRemoveCustomImageSucess() {
        this.comando_list.push("remove_custom_image_sucess");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_custom_image_sucess')
                .setDescription('Remova uma imagem da lista de sucesso (Fake news imgs)!!')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL da imagem')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const url = options.getString('url');

                const indice = config.img.fake.indexOf(url);
                if (indice === -1) {
                    await interaction.reply("URL não encontrada!!!!");
                    return;
                }
                config.img.fake.splice(indice, 1);
                saveConfig(config);
                await interaction.reply("URL removida com sucesso!!!!");
            }
        };
        return data;
    }
    createRemoveCustomImageFail() {
        this.comando_list.push("remove_custom_image_fail");
        const data = {
            data: new SlashCommandBuilder()
                .setName('remove_custom_image_fail')
                .setDescription('Remova uma imagem da lista de falha (Real news imgs)!!')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL da imagem')
                        .setRequired(true)),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const url = options.getString('url');

                const indice = config.img.real.indexOf(url);
                if (indice === -1) {
                    await interaction.reply("URL não encontrada!!!!");
                    return;
                }
                config.img.real.splice(indice, 1);
                saveConfig(config);
                await interaction.reply("URL removida com sucesso!!!!");
            }
        };
        return data;
    }
    createPathNote() {
        this.comando_list.push("path_note");
        const data = {
            data: new SlashCommandBuilder()
                .setName('path_note')
                .setDescription('Mostre Path Note'),
            async execute(interaction, config, saveConfig) {
                const emb = new EmbedBuilder()
                    .setColor(0x002842)
                    .setTitle("Path Note")
                    .addFields(
                        {
                            name: "1.4.2",
                            value: "Arrumado alguns quedas por falta de permissões..."
                        },
                        {
                            name: "1.4",
                            value: "**12 Novos comandos:**\n* /add_deny_user\n* /add_deny_channel\n* /remove_deny_user\n* /remove_deny_channel\n* /add_custom_image_sucess\n* /add_custom_image_fail\n* /remove_custom_image_sucess\n* /remove_custom_image_fail\n* /list_images\n* /path_note\n* /help\n* /info",
                        },
                        {
                            name: "v1.3.0",
                            value: "<!@1065452625253892097> agora invoca o bot com 100% de taxa. Funciona também para mensagens marcadas.",
                        },
                        {
                            name: "v1.2.0",
                            value: "Logic update",
                        },
                    );
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });
                await interaction.reply(replyPayload);
            }
        };
        return data;
    }

    createHelp() {
        this.comando_list.push("help");
        const data = {
            data: new SlashCommandBuilder()
                .setName('help')
                .setDescription('Ajuda com bot'),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const emb = new EmbedBuilder()
                    .setColor(0x002842)
                    .setTitle("Guia de comandos do bot")
                    .addFields(
                        {
                            name: "Channel's",
                            value: "**/list_channel**\nListe todos os canais permitidos e não permitidos\n.\n**/set_all_channel:** **true** or **false**\nPermitir que o bot check todos os chats, excetos os que estão na deny list.\nQuando ativo, a lista de filtro (/add_channel) fica desabilitada.\n.\n**/add_channel** channel: #channel\nAdicione um canal que poderá ser checkado automaticamente\n.\n**/add_deny_channel** channel: #channel\nAdicione um canal que NÂO poderá ser checkado automaticamente\n.\n**/remove_channel** channel: #channel\nRemova um canal da checkagem automatica\n.\n**/remove_deny_channel** channel: #channel\nRemova um canal da deny list\n------------------------------------------------------------------------------",
                        },
                        {
                            name: "Usuários",
                            value: "**/list_user**\nListe todos os usuários permitidos e não permitidos\n.\n**/allow_random_user_checking:** **true** or **false** valor: 50\nAtivar check automático de usuários não registrados.\nValor (0.001 até 100): É a porcentagem de vezes que o bot vai tentar verificar uma mensagem.\nNessas situações, as mensagens possui 50% de ser da sucesso (Fake News imgs), se não é dado como falho (Real News imgs)\n.\n**/set_custom_checking** target: @user taxa: 50 checking: 50\nAdicione ou modifique um usuário que será automaticamente checkado com valores personalizados.\nTaxa (0.001 até 100): É a porcentagem de vezes que o bot tentará verificar uma mensagem.\nChecking  (0.001 até 100): É a porcentagem de sucesso das mensagens (Fake News imgs), caso contrário, será considerado falha (Real News imgs).\n.\n**/add_user** target: @user\nAdicione um usuário que será automaticamente checkado.\nValores padrões: \nTaxa: 5%\nChecking: 50%\n.\n**/remove_user** target: @user\nRemova um usuário da lista de checkagem automática",
                        },
                        {
                            name: ".",
                            value: "**/add_deny_user** target: @user\nAdicione um usuário para NÂO ser checkado automaticamente\n.\n**/remove_deny_user** target: @user\nRemova um usuário da deny list\n------------------------------------------------------------------------------",
                        },
                        {
                            name: "Imagens",
                            value: "**/list_images**\nListe todos os links de imagens e vídeos salvos\n.\n**/add_custom_image_sucess**  url: https://link.png/\nAdicione um link de imagem ou vídeo para lista de sucesso (geralmente imagens Fake News)\n.\n**/add_custom_image_fail**  url: https://link.png/\nAdicione um link de imagem ou vídeo para lista de falha (geralmente imagens Real News)\n.\n**/remove_custom_image_sucess**  url: https://link.png/\nRemova um link de imagem ou vídeo para lista de sucesso (geralmente imagens Fake News)\n.\n**/remove_custom_image_fail**  url: https://link.png/\nRemova um link de imagem ou vídeo para lista de falha (geralmente imagens Real News)\n------------------------------------------------------------------------------",
                        },
                        {
                            name: "Utilitários",
                            value: "**/info**\ninformações sobre o bot\n.\n**/help**\nMostre um guia com todos os comandos\n.\n**/path_note**\nMostre todas alterações feitas no bot\n.\nMencionar o bot (@Fatos) ou  responder alguém marcando o bot, resultará em uma resposta garantida sobre a sua mensagem ou a mensagem mencionada",
                        },
                    );
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });
                await interaction.reply(replyPayload);
            }
        };
        return data;
    }
    createInfo() {
        this.comando_list.push("info");
        const data = {
            data: new SlashCommandBuilder()
                .setName('info')
                .setDescription('Informações sobre o bot'),
            async execute(interaction, config, saveConfig) {
                const { options } = interaction;
                const emb = new EmbedBuilder()
                    .setColor(0x002842)
                    .setAuthor({
                        name: "FatosCheckUp",
                        url: "https://github.com/43D/fatoscheckup",
                    })
                    .setTitle("V.1.4.2")
                    .setURL("https://github.com/43D/fatoscheckup")
                    .setDescription("Bot criado por @allangamer43d\n\nLinks úteis:\n* [Invite me to your guild](https://discord.com/api/oauth2/authorize?client_id=1065452625253892097&permissions=414531967040&scope=bot)\n* [Repository on GitHub](https://github.com/43D/fatoscheckup)")
                    .setTimestamp();
                const replyPayload = new MessagePayload(interaction, { embeds: [emb] });
                await interaction.reply(replyPayload);
            }
        };
        return data;
    }
    /*
    /
    / /path_note
    / /help
    /
    */
}

module.exports = Comandos;