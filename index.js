const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 💾 XP verisini dosyadan oku (kalıcı sistem)
const dataFile = "./xp.json";
let xpData = fs.existsSync(dataFile)
  ? JSON.parse(fs.readFileSync(dataFile))
  : {};

// 🧠 Küfür listesi
const badWords = ["salak", "mal", "gerizekalı", "aptal"];

// 📊 Level sistemi
function getLevel(xp) {
  return Math.floor(xp / 100);
}

// 💾 kayıt fonksiyonu
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(xpData, null, 2));
}

client.on("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

// 🎮 mesaj sistemi
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const id = message.author.id;
  const content = message.content.toLowerCase();

  // 🚨 KÜFÜR ENGELLEME
  if (badWords.some(w => content.includes(w))) {
    message.delete().catch(() => {});
    message.channel.send(`${message.author} ⚠️ Küfür yasak!`);
    return;
  }

  // 💾 XP yoksa oluştur
  if (!xpData[id]) {
    xpData[id] = { xp: 0 };
  }

  // 🎮 XP ekle
  xpData[id].xp += 10;

  const level = getLevel(xpData[id].xp);

  // 🎉 level atlama bildirimi
  if (xpData[id].xp % 100 === 0) {
    message.channel.send(
      `🎉 ${message.author} level atladı! Level: **${level}**`
    );
  }

  saveData();

  // 📊 !level
  if (content === "!level") {
    return message.reply(
      `📊 Level: **${level}** | XP: **${xpData[id].xp}**`
    );
  }

  // 🏆 !top leaderboard
  if (content === "!top") {
    const sorted = Object.entries(xpData)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    let msg = "🏆 **TOP XP LİSTESİ**\n\n";

    sorted.forEach((user, i) => {
      msg += `#${i + 1} <@${user[0]}> - XP: ${user[1].xp}\n`;
    });

    message.channel.send(msg);
  }
});

client.login(process.env.TOKEN);
