const fs = require("fs");
const path = require("path");

// Importation canvas
const {
	createCanvas,
	loadImage
} = require("canvas");

const {
	writeFileSync,
	createReadStream,
	existsSync,
	mkdirSync
} = require("fs-extra");

const axios = require("axios");

module.exports = {

	config: {
		name: "clean",

		aliases: [
			// "c"
		],

		author: "MarianCross + Derla Kiritö",

		version: "3.0",

		cooldowns: 5,

		role: 2,

		shortDescription: {
			en: "Clean cache folders"
		},

		longDescription: {
			en: "Delete files inside cache and tmp folders"
		},

		category: "owner",

		guide: {
			en: "{p}{n}"
		}
	},

	onStart: async function ({
		api,
		event
	}) {

		// Dossiers
		const cacheFolderPath =
			path.join(__dirname, "cache");

		const tmpFolderPath =
			path.join(__dirname, "tmp");

		// Création dossier cache
		const canvasCache =
			path.join(__dirname, "cache");

		if (!existsSync(canvasCache)) {
			mkdirSync(canvasCache);
		}

		// Message début
		api.sendMessage(
			"🧹 Cleaning cache folders...",
			event.threadID
		);

		// Fonction nettoyage
		const cleanFolder = (
			folderPath
		) => {

			let deletedFiles = 0;

			// Vérifie dossier
			if (fs.existsSync(folderPath)) {

				const files =
					fs.readdirSync(folderPath);

				// Supprime fichiers
				if (files.length > 0) {

					files.forEach(file => {

						const filePath =
							path.join(
								folderPath,
								file
							);

						fs.unlinkSync(filePath);

						deletedFiles++;

						console.log(
							`Deleted: ${file}`
						);
					});
				}
			}

			return deletedFiles;
		};

		// Nettoyage
		const cacheDeleted =
			cleanFolder(cacheFolderPath);

		const tmpDeleted =
			cleanFolder(tmpFolderPath);

		// Total fichiers supprimés
		const totalDeleted =
			cacheDeleted + tmpDeleted;

		// Création canvas
		const canvas =
			createCanvas(1400, 750);

		const ctx =
			canvas.getContext("2d");

		// Fond dégradé
		const gradient =
			ctx.createLinearGradient(
				0,
				0,
				1400,
				750
			);

		gradient.addColorStop(
			0,
			"#0f172a"
		);

		gradient.addColorStop(
			1,
			"#111827"
		);

		ctx.fillStyle = gradient;

		ctx.fillRect(
			0,
			0,
			canvas.width,
			canvas.height
		);

		// Bordure verte
		ctx.strokeStyle = "#00ff99";

		ctx.lineWidth = 10;

		ctx.strokeRect(
			20,
			20,
			1360,
			710
		);

		// Glow
		ctx.shadowColor = "#00ff99";

		ctx.shadowBlur = 35;

		// Titre
		ctx.fillStyle = "#ffffff";

		ctx.font = "bold 65px Sans";

		ctx.fillText(
			"🧹 CACHE CLEANER",
			60,
			100
		);

		// Texte principal
		ctx.fillStyle = "#00ff99";

		ctx.font = "bold 90px Sans";

		ctx.fillText(
			"CLEANED",
			420,
			230
		);

		// Infos cache
		ctx.fillStyle = "#ffffff";

		ctx.font = "35px Sans";

		ctx.fillText(
			`Cache Files Deleted : ${cacheDeleted}`,
			70,
			380
		);

		ctx.fillText(
			`Tmp Files Deleted : ${tmpDeleted}`,
			70,
			450
		);

		ctx.fillText(
			`Total Deleted : ${totalDeleted}`,
			70,
			520
		);

		// Barre progression
		ctx.fillStyle = "#2f2f2f";

		ctx.fillRect(
			70,
			600,
			600,
			40
		);

		ctx.fillStyle = "#00ff99";

		ctx.fillRect(
			70,
			600,
			570,
			40
		);

		// Pourcentage
		ctx.fillStyle = "#ffffff";

		ctx.font = "28px Sans";

		ctx.fillText(
			"95%",
			320,
			630
		);

		// Cercle extérieur
		ctx.beginPath();

		ctx.arc(
			1120,
			320,
			150,
			0,
			Math.PI * 2
		);

		ctx.closePath();

		ctx.fillStyle = "#00ff99";

		ctx.fill();

		// Cercle intérieur
		ctx.beginPath();

		ctx.arc(
			1120,
			320,
			132,
			0,
			Math.PI * 2
		);

		ctx.closePath();

		ctx.clip();

		try {

			// Photo admin
			const adminID =
				global.GoatBot.config.adminBot[0];

			const avatarURL =
				`https://graph.facebook.com/${adminID}/picture?width=512&height=512`;

			// Téléchargement avatar
			const avatarPath =
				path.join(
					canvasCache,
					`clean_admin_${adminID}.png`
				);

			const response =
				await axios.get(
					avatarURL,
					{
						responseType: "arraybuffer"
					}
				);

			fs.writeFileSync(
				avatarPath,
				response.data
			);

			// Charge image
			const avatar =
				await loadImage(
					avatarPath
				);

			// Dessine avatar
			ctx.drawImage(
				avatar,
				988,
				188,
				264,
				264
			);

		} catch (e) {

			// Emoji si erreur
			ctx.font = "120px Sans";

			ctx.fillStyle = "#ffffff";

			ctx.fillText(
				"👑",
				1060,
				360
			);
		}

		// Footer
		ctx.font = "26px Sans";

		ctx.fillStyle = "#bbbbbb";

		ctx.fillText(
			"System Cleaner Interface • GoatBot",
			70,
			700
		);

		// Sauvegarde image
		const imgPath =
			path.join(
				canvasCache,
				`clean_${event.senderID}.png`
			);

		writeFileSync(
			imgPath,
			canvas.toBuffer()
		);

		// Attente 3 secondes
		await new Promise(resolve =>
			setTimeout(resolve, 3000)
		);

		// Envoie résultat
		return api.sendMessage({

			body:
				`✅ Cache cleaned successfully!\n`
				+
				`🗑️ Deleted files: ${totalDeleted}`,

			attachment:
				createReadStream(imgPath)

		}, event.threadID);
	}
};
