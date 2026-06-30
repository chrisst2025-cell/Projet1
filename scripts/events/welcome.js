"use strict";

const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

const CACHE_DIR = path.join(__dirname, "cache");
const BATCH_MS  = 2000;

// Liste de tes images de fond (sélectionnées de manière aléatoire)
const BG_LIST = [
    "https://i.imgur.com/wKWSVws.jpeg",
    "https://i.imgur.com/HV7yUat.jpeg",
    "https://i.imgur.com/MYQ3zIZ.jpeg",
    "https://i.imgur.com/t7mdN89.jpeg",
    "https://i.imgur.com/usvBUOr.jpeg"
];

function getSession(h) {
    if (h <= 10) return "morning";
    if (h <= 12) return "noon";
    if (h <= 18) return "afternoon";
    return "evening";
}

// Génération locale et Premium de la carte d'invitation sans API externe
async function fetchCard(uid, name, groupName, memberCount, bgUrl) {
    await fs.ensureDir(CACHE_DIR);
    const imgPath = path.join(CACHE_DIR, `welcome_${uid}_${Date.now()}.png`);
    
    // 1. Téléchargement du fond et de l'avatar en parallèle
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    const [bgRes, avRes] = await Promise.all([
        axios.get(bgUrl, { responseType: "arraybuffer", timeout: 10000 }).catch(() => null),
        axios.get(avatarURL, { responseType: "arraybuffer", timeout: 10000 }).catch(() => null)
    ]);

    if (!bgRes) throw new Error("Impossible de charger l'image de fond.");

    // 2. Création du Canvas (Taille standard pour une carte : 800x400)
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    // Dessin du fond
    const backgroundImage = await loadImage(bgRes.data);
    ctx.drawImage(backgroundImage, 0, 0, 800, 400);

    // Ajout d'un filtre sombre/premium pour faire ressortir le texte
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, 800, 400);

    // 3. Dessin de l'avatar circulaire avec bordure Premium (Or/Jaune)
    if (avRes) {
        const avatarImg = await loadImage(avRes.data);
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 200, 90, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, 60, 110, 180, 180);
        ctx.restore();

        // Bordure dorée autour de l'avatar
        ctx.beginPath();
        ctx.arc(150, 200, 92, 0, Math.PI * 2, true);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#ffea00";
        ctx.stroke();
    }

    // 4. Ajout des Textes Stylisés (Premium Colors)
    ctx.textAlign = "left";

    // Texte de Bienvenue
    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("BIENVENUE", 280, 150);

    // Nom de l'utilisateur (Gros et Doré)
    ctx.font = "bold 38px sans-serif";
    ctx.fillStyle = "#ffea00";
    // Raccourcir le nom s'il est trop long pour éviter les débordements
    const shortName = name.length > 18 ? name.substring(0, 18) + "..." : name;
    ctx.fillText(shortName.toUpperCase(), 280, 200);

    // Nom du Groupe (Blanc)
    ctx.font = "italic 22px sans-serif";
    ctx.fillStyle = "#e0e0e0";
    const shortGroup = groupName.length > 25 ? groupName.substring(0, 25) + "..." : groupName;
    ctx.fillText(`Groupe: ${shortGroup}`, 280, 250);

    // Compteur de membres (Pastel Émeraude)
    ctx.font = "600 20px sans-serif";
    ctx.fillStyle = "#00ffcc";
    ctx.fillText(`Membre de la commu #${memberCount}`, 280, 290);

    // 5. Sauvegarde du fichier final
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(imgPath, buffer);
    return imgPath;
}

async function flushBatch(threadID, batch, api, threadsData) {
    try {
        const threadData = await threadsData.get(threadID);
        if (threadData?.settings?.sendWelcomeMessage === false) return;

        const prefix     = global.utils.getPrefix(threadID);  
        const dataBanned = threadData?.data?.banned_ban || [];  
        let memberCount  = 0;  
        let groupName    = "OUR GROUP";  

        try {  
            const tInfo = await api.getThreadInfo(threadID);  
            memberCount = tInfo.participantIDs?.length || 0;  
            groupName   = (threadData?.threadName || tInfo.threadName || "Our Group").toUpperCase();  
        } catch (_) {  
            groupName = (threadData?.threadName || "Our Group").toUpperCase();  
        }  

        const h       = new Date().getHours();  
        const session = getSession(h);  

        const defaultTemplate =  
            "👋 Welcome to {boxName}, {userName}!\n" +  
            "You are member #{count} 🎉\n" +  
            "Have a great {session}! 😊\n" +  
            "Type {prefix}help for all commands.";  

        for (const { uid, name } of batch) {  
            if (dataBanned.some(b => b.id == uid)) continue;  

            const template = threadData?.data?.welcomeMessage || defaultTemplate;  
            const hasMentionTag = template.includes("{userNameTag}");  

            const body = template  
                .replace(/\{userName\}|\{userNameTag\}/g, name)  
                .replace(/\{boxName\}|\{threadName\}/g, threadData?.threadName || groupName)  
                .replace(/\{count\}/g, memberCount)  
                .replace(/\{session\}/g, session)  
                .replace(/\{prefix\}/g, prefix);  

            const form = {  
                body,  
                mentions: hasMentionTag ? [{ tag: name, id: uid }] : [{ tag: name, id: uid }]  
            };  

            let imgPath = null;  
            try {  
                const bg = BG_LIST[Math.floor(Math.random() * BG_LIST.length)];  
                imgPath  = await fetchCard(uid, name, groupName, memberCount, bg);  
                form.attachment = fs.createReadStream(imgPath);  

                await api.sendMessage(form, threadID, () => {  
                    if (imgPath) { try { fs.unlinkSync(imgPath); } catch (_) {} }  
                });  
            } catch (_) {  
                delete form.attachment;  
                try { await api.sendMessage(form, threadID); } catch (__) {}  
                if (imgPath) { try { fs.unlinkSync(imgPath); } catch (_) {} }  
            }  

            memberCount++;  
        }  
    } catch (_) {}
}

module.exports = {
    config: {
        name:        "welcome",
        version:     "4.0.0",
        author:      "SIFAT & AI",
        category:    "events",
        description: "Auto welcome new members with locally generated premium cards (Canvas)."
    },

    langs: {  
        en: {  
            session1:            "morning",  
            session2:            "noon",  
            session3:            "afternoon",  
            session4:            "evening",  
            botJoinMessage:  
                "🤖 Thanks for adding me!\n" +  
                "◈ Prefix : %1\n" +  
                "◈ Commands: %1help",  
            defaultWelcomeMessage:  
                "👋 Welcome to {boxName}, {userName}!\n" +  
                "You are member #{count} 🎉\n" +  
                "Have a great {session}! 😊"  
        }  
    },  

    onStart: async ({ api, event, threadsData, getLang }) => {  
        if (event.logMessageType !== "log:subscribe") return;  

        return async function () {  
            const { threadID } = event;  
            const participants = event.logMessageData?.addedParticipants || [];  
            if (!participants.length) return;  

            const botID = api.getCurrentUserID();  
            const prefix = global.utils.getPrefix(threadID);  

            if (participants.some(p => p.userFbId == botID)) {  
                const nick = global.GoatBot?.config?.nickNameBot;  
                if (nick) { try { api.changeNickname(nick, threadID, botID); } catch (_) {} }  
                try { api.sendMessage(getLang("botJoinMessage", prefix), threadID); } catch (_) {}  
                return;  
            }  

            if (!global.temp.welcomeEvent[threadID]) {  
                global.temp.welcomeEvent[threadID] = { timer: null, batch: [] };  
            }  

            for (const user of participants) {  
                if (user.userFbId == botID) continue;  
                global.temp.welcomeEvent[threadID].batch.push({  
                    uid:  user.userFbId,  
                    name: user.fullName || "Member"  
                });  
            }  

            clearTimeout(global.temp.welcomeEvent[threadID].timer);  

            global.temp.welcomeEvent[threadID].timer = setTimeout(() => {  
                const batch = global.temp.welcomeEvent[threadID]?.batch || [];  
                delete global.temp.welcomeEvent[threadID];  
                flushBatch(threadID, batch, api, threadsData).catch(() => {});  
            }, BATCH_MS);  
        };  
    }
};
