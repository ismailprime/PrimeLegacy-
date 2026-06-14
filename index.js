const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// XP sistemi (RAM’de tutulur)
const xp = {};
const cooldown = new Set();

// Küfür listesi (istersen çoğaltabiliriz)
const badWords = ["salak", "mal", "gerizekalı", "aptal"];

// Level hesaplama
function getLevel(xp) {
  return Math.floor(xp / 100);
}

client.on("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const content = message.content.toLowerCase();

  // 🚨 KÜFÜR ENGELLEME
  if (badWords.some(word => content.includes(word))) {
    message.delete().catch(() => {});
    message.channel.send(`${message.author}, küfür yasak! ⚠️`);
    return;
  }

  // ⏳ spam XP engeli (2 sn cooldown)
  if (cooldown.has(userId)) return;
  cooldown.add(userId);
  setTimeout(() => cooldown.delete(userId), 2000);

  // 🎮 XP ekleme
  if (!xp[userId]) xp[userId] = 0;

  xp[userId] += 10;

  const level = getLevel(xp[userId]);

  // 🎉 Level atlama mesajı
  if (xp[userId] % 100 === 0) {
    message.channel.send(
      `🎉 ${message.author} level atladı! Level: **${level}**`
    );
  }

  // 🧪 test komutu
  if (content === "!level") {
    message.reply(`Levelin: **${level}** | XP: **${xp[userId]}**`);
  }
});

client.login(process.env.TOKEN);
