const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 💾 data
const file = "./data.json";
let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};

function save() {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      xp: 0,
      coins: 0,
      warns: 0,
      spam: 0,
      lastMsg: 0,
      daily: 0
    };
  }
  return data[id];
}

function level(xp) {
  return Math.floor(xp / 100);
}

// 🚨 küfür listesi
const badWords = ["salak","mal","aptal","gerizekalı","oç","amk","siktir","kahpe"];

// 🏆 rol sistemi (15 level)
const levelRoles = {
  15: "çaylak",
  30: "kıdemli",
  45: "sadık",
  60: "profesyonel",
  75: "prime",
  90: "ELİT"
};

client.on("ready", () => {
  console.log("Bot hazır!");
});

// ================= MAIN =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const user = getUser(msg.author.id);
  const content = msg.content.toLowerCase();
  const now = Date.now();

  // ================= XP =================
  user.xp += 10;
  user.coins += 5;

  const lvl = level(user.xp);

  // 🎉 level rol
  if (user.xp % 100 === 0) {
    msg.channel.send(`🎉 ${msg.author} Level atladı: **${lvl}**`);

    const roleName = levelRoles[lvl];
    if (roleName) {
      const role = msg.guild.roles.cache.find(r => r.name === roleName);
      if (role) msg.member.roles.add(role).catch(() => {});
    }
  }

  // ================= KÜFÜR =================
  if (badWords.some(w => content.includes(w))) {
    user.warns += 1;
    await msg.delete().catch(() => {});

    msg.channel.send(`⚠️ ${msg.author} Küfür! Warn: ${user.warns}/3`);

    if (user.warns >= 3) {
      const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
      if (muteRole) {
        msg.member.roles.add(muteRole);
        msg.channel.send(`🚫 ${msg.author} 1 saat mute!`);
      }
      user.warns = 0;
    }
    save();
    return;
  }

  // ================= SPAM =================
  if (now - user.lastMsg < 2000) {
    user.spam += 1;

    if (user.spam >= 4) {
      const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
      if (muteRole) {
        msg.member.roles.add(muteRole);
        msg.channel.send(`🚫 ${msg.author} spam mute (10 dk)`);
      }
      user.spam = 0;
    }
  } else {
    user.spam = 0;
  }

  user.lastMsg = now;

  // ================= COMMANDS =================

  // 📊 rank
  if (content === "!rank") {
    return msg.reply(`📊 Level: ${lvl} | XP: ${user.xp} | 💰 ${user.coins}`);
  }

  // 🏆 top
  if (content === "!top") {
    const top = Object.entries(data)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    let text = "🏆 TOP\n\n";
    top.forEach((u, i) => {
      text += `#${i + 1} <@${u[0]}> - XP: ${u[1].xp}\n`;
    });

    msg.channel.send(text);
  }

  // 🎁 daily
  if (content === "!daily") {
    if (now - user.daily < 86400000) {
      return msg.reply("⏳ 24 saat dolmadan alamazsın!");
    }

    user.coins += 500;
    user.daily = now;

    msg.reply("🎁 500 coin aldın!");
  }

  // 🪙 coinflip
  if (content.startsWith("!coinflip")) {
    const result = Math.random() < 0.5 ? "TURA" : "YAZI";
    msg.reply(`🪙 Sonuç: **${result}**`);
  }

  // 🔊 sestop (basit sayaç)
  if (content === "!sestop") {
    const voiceCount = msg.guild.members.cache.filter(m => m.voice.channel).size;
    msg.channel.send(`🔊 Voice'da: ${voiceCount} kişi`);
  }

  save();
});

client.login(process.env.TOKEN);
