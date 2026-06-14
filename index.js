const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 💾 veri dosyası
const file = "./data.json";

let data = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file))
  : {};

// 🧠 default kullanıcı
function getUser(id) {
  if (!data[id]) {
    data[id] = {
      xp: 0,
      coins: 0,
      warns: 0
    };
  }
  return data[id];
}

// 💾 kaydet
function save() {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 📊 level sistemi
function level(xp) {
  return Math.floor(xp / 100);
}

// 🚨 küfür listesi
const badWords = ["salak", "mal", "aptal", "gerizekalı",
                "oruspu", "kahpe", "götveren", "sikeyim", "sikim", "şerefsiz", "anneni sikeyim", "amk", "awk"];

// ⏳ spam engel
const cooldown = new Set();

client.on("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;
  const content = msg.content.toLowerCase();

  const user = getUser(id);

  // 🚫 spam koruma
  if (cooldown.has(id)) return;
  cooldown.add(id);
  setTimeout(() => cooldown.delete(id), 2000);

  // 🚨 küfür sistemi + warn
  if (badWords.some(w => content.includes(w))) {
    user.warns += 1;

    await msg.delete().catch(() => {});

    msg.channel.send(`${msg.author} ⚠️ Küfür yasak! (Warn: ${user.warns}/3)`);

    // 🔥 3 warn = mute
    if (user.warns >= 3) {
      const member = msg.member;
      const role = msg.guild.roles.cache.find(r => r.name === "Muted");

      if (role) {
        member.roles.add(role);
        msg.channel.send(`${msg.author} 🚫 Mute yedin!`);
      }

      user.warns = 0;
    }

    save();
    return;
  }

  // 🎮 XP + coin
  user.xp += 10;
  user.coins += 5;

  const lvl = level(user.xp);

  if (user.xp % 100 === 0) {
    msg.channel.send(`🎉 ${msg.author} level atladı! Level: ${lvl}`);
  }

  save();

  // 📊 !rank
  if (content === "!rank") {
    return msg.reply(
      `📊 Level: ${lvl}\nXP: ${user.xp}\n💰 Coin: ${user.coins}`
    );
  }

  // 🏆 !top
  if (content === "!top") {
    const top = Object.entries(data)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    let text = "🏆 TOP PLAYERS\n\n";

    top.forEach((u, i) => {
      text += `#${i + 1} <@${u[0]}> - XP: ${u[1].xp}\n`;
    });

    msg.channel.send(text);
  }
});

client.login(process.env.TOKEN);
