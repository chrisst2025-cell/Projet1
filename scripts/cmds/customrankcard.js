/*

CUSTOM RANK CARD COMMAND (GOATBOT STYLE CLEAN CANVAS) Inspired structure like ADMIN command example DO NOT CHANGE LOGIC — ONLY FORMAT IMPROVEMENT

*/

// ===================== IMPORTS & REGEX ===================== const checkUrlRegex = /https?://..(?:png|jpg|jpeg|gif)/gi; const regExColor = /#([0-9a-f]{6})|rgb(\d{1,3}),\s(\d{1,3}),\s*(\d{1,3})(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d+.?\d*)/gi; const { uploadImgbb } = global.utils;

// ===================== MODULE EXPORT ===================== module.exports = {

// ===================== CONFIG =====================
config: {
	name: "customrankcard",
	aliases: ["crc", "customrank"],
	version: "1.12",
	author: "NTKhang",
	countDown: 5,
	role: 0,

	description: {
		vi: "Thiết kế thẻ rank theo ý bạn",
		en: "Design rank card by your own"
	},

	category: "rank",

	guide: {
		vi: {
			body:
				"   {pn} [maincolor | subcolor | linecolor | expbarcolor | progresscolor | alphasubcolor | textcolor | namecolor | expcolor | rankcolor | levelcolor | reset] <value>"
				+ "\n   Trong đó: "
				+ "\n  + maincolor | background <value>: background chính của thẻ rank"
				+ "\n  + subcolor <value>: background phụ"
				+ "\n  + linecolor <value>: màu đường kẻ giữa background chính và phụ"
				+ "\n  + expbarcolor <value>: màu thanh exp"
				+ "\n  + progresscolor <value>: màu exp hiện tại"
				+ "\n  + alphasubcolor <value>: độ mờ background phụ (0 -> 1)"
				+ "\n  + textcolor <value>: couleur texte (hex / rgba)"
				+ "\n  + namecolor <value>: couleur nom"
				+ "\n  + expcolor <value>: couleur exp"
				+ "\n  + rankcolor <value>: couleur rank"
				+ "\n  + levelcolor <value>: couleur level"
				+ "\n   • value = hex / rgb / rgba / gradient / image url"
				+ "\n   • gradient = plusieurs couleurs séparées par espace"
				+ "\n\n   {pn} reset: reset default"
				+ "\n   Example:"
				+ "\n    {pn} maincolor #fff000"
				+ "\n    {pn} maincolor #0093E9 #80D0C7"
				+ "\n    {pn} subcolor rgba(255,136,86,0.4)"
				+ "\n    {pn} reset",
			attachment: {
				[`${__dirname}/assets/guide/customrankcard_1.jpg`]: "https://i.ibb.co/BZ2Qgs1/image.png",
				[`${__dirname}/assets/guide/customrankcard_2.png`]: "https://i.ibb.co/wy1ZHHL/image.png"
			}
		},

		en: {
			body:
				"   {pn} [maincolor | subcolor | linecolor | progresscolor | alphasubcolor | textcolor | namecolor | expcolor | rankcolor | levelcolor | reset] <value>"
				+ "\n   In which: "
				+ "\n  + maincolor | background <value>: main background"
				+ "\n  + subcolor <value>: sub background"
				+ "\n  + linecolor <value>: line between backgrounds"
				+ "\n  + expbarcolor <value>: exp bar color"
				+ "\n  + progresscolor <value>: current exp color"
				+ "\n  + alphasubcolor <value>: opacity sub background"
				+ "\n  + textcolor <value>: text color"
				+ "\n  + namecolor <value>: name color"
				+ "\n  + expcolor <value>: exp color"
				+ "\n  + rankcolor <value>: rank color"
				+ "\n  + levelcolor <value>: level color"
				+ "\n   • value = hex / rgb / rgba / gradient / image url"
				+ "\n   • gradient = multiple colors separated by space"
				+ "\n\n   {pn} reset: reset default"
				+ "\n   Example:"
				+ "\n    {pn} maincolor #fff000"
				+ "\n    {pn} subcolor rgba(255,136,86,0.4)"
				+ "\n    {pn} reset",
			attachment: {
				[`${__dirname}/assets/guide/customrankcard_1.jpg`]: "https://i.ibb.co/BZ2Qgs1/image.png",
				[`${__dirname}/assets/guide/customrankcard_2.png`]: "https://i.ibb.co/wy1ZHHL/image.png"
			}
		}
	}
},

// ===================== LANGS =====================
langs: {
	vi: {
		invalidImage: "Url hình ảnh không hợp lệ",
		invalidAttachment: "File đính kèm không phải hình ảnh",
		invalidColor: "Mã màu không hợp lệ",
		notSupportImage: "Option '%1' không hỗ trợ image url",
		success: "Đã lưu thay đổi",
		reseted: "Đã reset về mặc định",
		invalidAlpha: "Alpha phải từ 0 -> 1"
	},
	en: {
		invalidImage: "Invalid image url",
		invalidAttachment: "Invalid attachment",
		invalidColor: "Invalid color code",
		notSupportImage: "Option '%1' does not support image url",
		success: "Saved successfully",
		reseted: "Reset to default",
		invalidAlpha: "Alpha must be 0 -> 1"
	}
},

// ===================== MAIN LOGIC =====================
onStart: async function ({ message, threadsData, event, args, getLang, usersData, envCommands }) {

	if (!args[0]) return message.SyntaxError();

	const customRankCard = await threadsData.get(event.threadID, "data.customRankCard", {});
	const key = args[0].toLowerCase();
	let value = args.slice(1).join(" ");

	const supportImage = ["maincolor", "background", "bg", "subcolor", "expbarcolor", "progresscolor", "linecolor"];
	const notSupportImage = ["textcolor", "namecolor", "expcolor", "rankcolor", "levelcolor", "lvcolor"];

	// ===================== HANDLE COLORS / IMAGES =====================
	if ([...notSupportImage, ...supportImage].includes(key)) {

		const attachmentsReply = event.messageReply?.attachments;
		const attachments = [
			...event.attachments.filter(a => ["photo", "animated_image"].includes(a.type)),
			...(attachmentsReply?.filter(a => ["photo", "animated_image"].includes(a.type)) || [])
		];

		if (value === "reset") {
			// reset handled later
		}

		else if (value.match(/^https?:\/\//)) {
			const matchUrl = value.match(checkUrlRegex);
			if (!matchUrl) return message.reply(getLang("invalidImage"));
			const infoFile = await uploadImgbb(matchUrl[0], 'url');
			value = infoFile.image.url;
		}

		else if (attachments.length > 0) {
			const url = attachments[0].url;
			const infoFile = await uploadImgbb(url, 'url');
			value = infoFile.image.url;
		}

		else {
			const colors = value.match(regExColor);
			if (!colors) return message.reply(getLang("invalidColor"));
			value = colors.length === 1 ? colors[0] : colors;
		}

		if (value !== "reset" && notSupportImage.includes(key) && value.startsWith?.("http"))
			return message.reply(getLang("notSupportImage", key));

		switch (key) {
			case "maincolor": case "background": case "bg":
				value === "reset" ? delete customRankCard.main_color : customRankCard.main_color = value;
				break;
			case "subcolor": customRankCard.sub_color = value; break;
			case "linecolor": customRankCard.line_color = value; break;
			case "progresscolor": customRankCard.exp_color = value; break;
			case "expbarcolor": customRankCard.expNextLevel_color = value; break;
			case "textcolor": customRankCard.text_color = value; break;
			case "namecolor": customRankCard.name_color = value; break;
			case "rankcolor": customRankCard.rank_color = value; break;
			case "levelcolor": case "lvcolor": customRankCard.level_color = value; break;
			case "expcolor": customRankCard.exp_text_color = value; break;
		}

		try {
			await threadsData.set(event.threadID, customRankCard, "data.customRankCard");

			return message.reply({
				body: getLang("success"),
				attachment: await global.client.makeRankCard(event.senderID, usersData, threadsData, event.threadID, envCommands["rank"]?.deltaNext || 5)
					.then(s => (s.path = "rankcard.png", s))
			});
		} catch (err) {
			return message.err(err);
		}
	}

	// ===================== ALPHA =====================
	else if (["alphasubcolor", "alphasubcard"].includes(key)) {
		if (parseFloat(value) < 0 && parseFloat(value) > 1)
			return message.reply(getLang("invalidAlpha"));

		customRankCard.alpha_subcard = parseFloat(value);
		await threadsData.set(event.threadID, customRankCard, "data.customRankCard");

		return message.reply(getLang("success"));
	}

	// ===================== RESET =====================
	else if (key === "reset") {
		await threadsData.set(event.threadID, {}, "data.customRankCard");
		return message.reply(getLang("reseted"));
	}

	else return message.SyntaxError();
}

};
