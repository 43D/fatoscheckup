
class RngService {
    constructor() {
        this.configGuild = null;
    }

    async handleMessage(message, configGuild) {
        this.configGuild = configGuild;

        if (this.configGuild.deny_user.hasOwnProperty(message.author.id))
            return;

        if (this.configGuild.user.hasOwnProperty(message.author.id))
            await this.rng_config(message);
        else if (this.configGuild.random_user.pass)
            await this.rng_default(message);
    }

    async handleMessageMentioned(message, configGuild) {
        this.configGuild = configGuild;
        await this.rng_custom(message, 100);
    }

    async realNews(message) {
        const valorAleatorio = this.configGuild.img.real[Math.floor(Math.random() * this.configGuild.img.real.length)];
        await this.send_image(valorAleatorio, message, 'Real news');
    }

    async fakeNews(message) {
        const valorAleatorio = this.configGuild.img.fake[Math.floor(Math.random() * this.configGuild.img.fake.length)];
        await this.send_image(valorAleatorio, message, 'Fake news');
    }

    async send_image(valorAleatorio, message, msg) {
        try {
            await message.reply({ files: [valorAleatorio] });
        } catch (error) {
            console.log(`Error: ${error}`);
            this.send_text(message, msg);
        }
    }

    async send_text(message, msg) {
        try {
            await message.reply(msg);
        } catch (error2) {
            console.log(`Error: ${error2}`);
        }
    }

    verificaSucesso(taxaSucesso) {
        if (taxaSucesso >= 0 && taxaSucesso <= 100) {
            const random = Math.random() * 10000;
            return random <= taxaSucesso * 100;
        }
        return false;
    }

    async rng_config(message) {
        const taxa = this.configGuild.user[message.author.id].taxa;
        const check = this.configGuild.user[message.author.id].checking;

        if (this.verificaSucesso(taxa))
            if (this.verificaSucesso(check))
                await this.fakeNews(message);
            else
                await this.realNews(message);
    }

    async rng_custom(message, taxa = 50, check = 50) {
        if (this.verificaSucesso(taxa))
            if (this.verificaSucesso(check))
                await this.fakeNews(message);
            else
                await this.realNews(message);
    }

    async rng_default(message) {
        if (this.verificaSucesso(this.configGuild.random_user.rng)) {
            if (this.verificaSucesso(50))
                await this.fakeNews(message);
            else
                await this.realNews(message);
        }
    }
}

module.exports = RngService;