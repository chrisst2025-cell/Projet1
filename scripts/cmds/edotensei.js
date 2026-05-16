const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
	config: {
		name: "edotensei",
	version: "1.0",
	author: "NTKhang + Modified",
		countDown: 5,
	role: 2,
		shortDescription: {
			vi: "Khởi động lại bot",
			en: "Restart bot"
	},
		longDescription: {
			vi: "Khởi động lại bot",
			en: "Restart minato avec effect Edo Tensei"
	},
		category: "Owner",
	guide: {
			vi: "   {pn}: Khởi động lại bot",
			en: "   {pn}: Restart bot"
	}
	},

	langs: {
	vi: {
			restartting: "🔄 | Đang khởi động lại bot..."
	},
	en: {
			restartting: "🔄 | 𝐄𝐝𝐨 𝐓𝐞𝐧𝐬𝐞𝐢  ou 𝚁é𝚒𝚗𝚌𝚊𝚛𝚗𝚊𝚝𝚒𝚘𝚗 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘 en cours..."
	}
	},

	onLoad: function ({ api }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;
		if (fs.existsSync(pathFile)) {
			const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
			api.sendMessage(`✅ | 𝚁é𝚒𝚗𝚌𝚊𝚛𝚗𝚊𝚝𝚒𝚘𝚗 𝚍𝚎 𝙼𝚒𝚗𝚊𝚝𝚘 𝚊𝚌𝚑𝚎𝚟é \⏰ | 𝚃𝚎𝚖𝚙𝚜 𝚖𝚒𝚜 : ${(Date.now() - time) / 1000}s`, tid);
			fs.unlinkSync(pathFile);
	}
	},

	onStart: async function ({ message, event, getLang }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;
		const cachePath = path.join(__dirname, "cache");
		
		if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

	// Génération image Edo Tensei
		const canvas = createCanvas(1400, 700);
		const ctx = canvas.getContext("2d");

	// Fond sombre + texture
		ctx.fillStyle = "#0a0a0a";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Effet fissures rouge sang
		ctx.strokeStyle = "#ff1a1a";
		ctx.lineWidth = 4;
		ctx.shadowColor = "#ff1a1a";
		ctx.shadowBlur = 30;

		for (let i = 0; i < 15; i++) {
			ctx.beginPath();
			ctx.moveTo(Math.random() * 1400, Math.random() * 700);
			ctx.lineTo(Math.random() * 1400, Math.random() * 700);
			ctx.stroke();
		}

	// Titre principal
		ctx.shadowBlur = 0;
		ctx.fillStyle = "#ff1a1a";
		ctx.font = "bold 90px Sans";
		ctx.textAlign = "center";
		ctx.fillText("EDO TENSEI", 700, 250);

	// Sous-titre
		ctx.font = "bold 45px Sans";
		ctx.fillStyle = "#ffffff";
		ctx.fillText("𝚁é𝚒𝚗𝚌𝚊𝚛𝚗𝚊𝚝𝚒𝚘𝚗 𝚍𝚎 𝙼𝚒𝚗𝚊𝚝𝚘 𝚊𝚌𝚑𝚎𝚟é", 700, 340);

	// Texte en cours
		ctx.font = "35px Sans";
		ctx.fillStyle = "#ff9d00";
		ctx.fillText("Réinitialisation en cours...", 700, 450);

	// Sceau Edo Tensei - cercle
		ctx.strokeStyle = "#ff1a1a";
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(700, 550, 80, 0, Math.PI * 2);
		ctx.stroke();

	// Symboles dans le cercle
		ctx.font = "60px Sans";
		ctx.fillStyle = "#ff1a1a";
		ctx.fillText("卍", 700, 570);

	// Footer
		ctx.font = "24px Sans";
		ctx.fillStyle = "#555";
		ctx.fillText("GoatBot System • Restart Protocol", 700, 670);

	// Sauvegarde
		const imgPath = path.join(cachePath, `edotensei_${event.threadID}.png`);
		fs.writeFileSync(imgPath, canvas.toBuffer());

	// Envoi image puis restart
		await message.reply({
			body: getLang("restartting"),
			attachment: fs.createReadStream(imgPath)
	});

	// Delay pour laisser l'image partir
		fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
		setTimeout(() => process.exit(2), 2000);
	}
};
