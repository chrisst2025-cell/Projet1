const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { getTime } = global.utils;

module.exports = {
	config: {
		name: "user",
	version: "1.4",
	author: "NTKhang",
		countDown: 5,
	role: 2,
		description: {
			vi: "Quản lý người dùng trong hệ thống bot",
			en: "bannir l'utilisateur pour que l'utilisateur n'utilise pas le minato"
	},
		category: "owner",
	guide: {
			vi: " {pn} [find | -f | search | -s] <tên cần tìm>: tìm kiếm người dùng trong dữ liệu bot bằng tên"
				+ "\n"
				+ "\n {pn} [ban | -b] [<uid> | @tag | reply tin nhắn] <reason>: để cấm người dùng mang id <uid> hoặc người được tag hoặc người gửi của tin nhắn được reply sử dụng bot"
				+ "\n"
				+ "\n {pn} unban [<uid> | @tag | reply tin nhắn]: để bỏ cấm người dùng sử dụng bot",
			en: " {pn} [find | -f | search | -s] <name to find>: search for users in bot data by name"
				+ "\n"
				+ "\n {pn} [ban | -b] [<uid> | @tag | reply message] <reason>: to ban user with id <uid> or tagged user or sender of message replied using bot"
				+ "\n"
				+ "\n {pn} unban [<uid> | @tag | reply message]: to unban user using bot"
	}
	},

	langs: {
	vi: {
			noUserFound: "❌ Không tìm thấy người dùng nào có tên khớp với từ khóa: \"%1\" trong dữ liệu của bot",
			userFound: "🔎 Tìm thấy %1 người dùng có tên trùng với từ khóa \"%2\" trong dữ liệu của bot:\n%3",
			uidRequired: "Uid của người cần ban không được để trống, vui lòng nhập uid hoặc tag hoặc reply tin nhắn của 1 người theo cú pháp user ban <uid> <lý do>",
			reasonRequired: "Lý do ban người dùng không được để trống, vui lòng nhập uid hoặc tag hoặc reply tin nhắn của 1 người theo cú pháp user ban <uid> <lý do>",
			userHasBanned: "Người dùng mang id [%1 | %2] đã bị cấm từ trước:\n» Lý do: %3\n» Thời gian: %4",
			userBanned: "Đã cấm người dùng mang id [%1 | %2] sử dụng bot.\n» Lý do: %3\n» Thời gian: %4",
			uidRequiredUnban: "Uid của người cần unban không được để trống",
			userNotBanned: "Hiện tại người dùng mang id [%1 | %2] không bị cấm sử dụng bot",
			userUnbanned: "Đã bỏ cấm người dùng mang id [%1 | %2], hiện tại người này có thể sử dụng bot"
	},
	en: {
			noUserFound: "❌ No user found with name matching keyword: \"%1\" in bot data",
			userFound: "🔎 Found %1 user with name matching keyword \"%2\" in bot data:\n%3",
			uidRequired: "Uid of user to ban cannot be empty, please enter uid or tag or reply message of 1 user by user ban <uid> <reason>",
			reasonRequired: "Reason to ban user cannot be empty, please enter uid or tag or reply message of 1 user by user ban <uid> <reason>",
			userHasBanned: "User with id [%1 | %2] has been banned before:\n» Reason: %3\n» Date: %4",
			userBanned: "User with id [%1 | %2] has been banned:\n» Reason: %3\n» Date: %4",
			uidRequiredUnban: "Uid of user to unban cannot be empty",
			userNotBanned: "User with id [%1 | %2] is not banned",
			userUnbanned: "User with id [%1 | %2] has been unbanned"
	}
	},

	onStart: async function ({ args, usersData, message, event, prefix, getLang, api }) {
		
		async function sendProfileCard(uid, title, color) {
			const userData = await usersData.get(uid);
			const name = userData.name || uid;
			const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=200&height=200`;
			
			const canvas = createCanvas(600, 180);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#1c1e22";
			ctx.fillRect(0, 0, 600, 180);

			try {
				const avatar = await loadImage(avatarUrl);
				ctx.drawImage(avatar, 25, 25, 130, 130);
	} catch (e) {}

			ctx.fillStyle = color;
			ctx.font = "bold 26px Arial";
			ctx.fillText(title, 180, 60);

			ctx.fillStyle = "#fff";
			ctx.font = "22px Arial";
			ctx.fillText(name, 180, 100);
			ctx.fillText("UID: " + uid, 180, 135);

			const filePath = path.join(__dirname, `user_${uid}.png`);
			fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

			setTimeout(async () => {
				await message.reply({ attachment: fs.createReadStream(filePath) });
				fs.unlinkSync(filePath);
	}, 3000);
	}

		const type = args[0];
		switch (type) {
			// find user
			case "find":
			case "-f":
			case "search":
			case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				const msg = result.reduce((i, user) => i += `\n╭Name: ${user.name}\n╰ID: ${user.userID}`, "");
				
				await message.reply(result.length == 0? getLang("noUserFound", keyWord) : getLang("userFound", result.length, keyWord, msg));
				
				if (result.length > 0 && result.length <= 3) {
					for (let i = 0; i < result.length; i++) {
						setTimeout(() => sendProfileCard(result[i].userID, "User Found", "#00ff88"), i * 3500);
				}
			}
				break;
			}
			
			// ban user
			case "ban":
			case "-b": {
				let uid, reason;
				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
					reason = args.slice(1).join(" ");
				}
				else if (Object.keys(event.mentions).length > 0) {
					const { mentions } = event;
					uid = Object.keys(mentions)[0];
					reason = args.slice(1).join(" ").replace(mentions[uid], "");
				}
				else if (args[1]) {
					uid = args[1];
					reason = args.slice(2).join(" ");
				}
				else return message.SyntaxError();

				if (!uid) return message.reply(getLang("uidRequired"));
				if (!reason) return message.reply(getLang("reasonRequired", prefix));
				reason = reason.replace(/\s+/g, ');

				const userData = await usersData.get(uid);
				const name = userData.name;
				const status = userData.banned.status;

				if (status) {
					await message.reply(getLang("userHasBanned", uid, name, userData.banned.reason, userData.banned.date));
					setTimeout(() => sendProfileCard(uid, "BANNED", "#ff4444"), 3000);
					break;
				}

				const time = getTime("DD/MM/YYYY HH:mm:ss");
				await usersData.set(uid, {
					banned: { status: true, reason, date: time }
				});
				
				await message.reply(getLang("userBanned", uid, name, reason, time));
				setTimeout(() => sendProfileCard(uid, "BANNED", "#ff4444"), 3000);
				break;
			}
			
			// unban user
			case "unban":
			case "-u": {
				let uid;
				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
				}
				else if (Object.keys(event.mentions).length > 0) {
					const { mentions } = event;
					uid = Object.keys(mentions)[0];
				}
				else if (args[1]) {
					uid = args[1];
				}
				else return message.SyntaxError();
				
				if (!uid) return message.reply(getLang("uidRequiredUnban"));
				
				const userData = await usersData.get(uid);
				const name = userData.name;
				const status = userData.banned.status;
				
				if (!status) {
					await message.reply(getLang("userNotBanned", uid, name));
					setTimeout(() => sendProfileCard(uid, "NOT BANNED", "#00bfff"), 3000);
					break;
				}
				
				await usersData.set(uid, { banned: {} });
				await message.reply(getLang("userUnbanned", uid, name));
				setTimeout(() => sendProfileCard(uid, "UNBANNED", "#00ff88"), 3000);
				break;
			}
			
			default:
				return message.SyntaxError();
	}
	}
};
