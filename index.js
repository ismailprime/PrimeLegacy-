const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
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
const badWords = [
  "salak",
  "mal",
  "aptal",
  "gerizekalı",
  "embesil",
  "dangalak",
  "yavşak",
  "pezevenk",
  "şerefsiz",
  "piç",
  "pic",
  "oç",
  "oc",
  "amk",
  "aq",
  "amq",
  "siktir",
  "sikik",
  "sikim",
  "sikeyim",
  "göt",
  "götveren",
  "kahpe",
  "orospu",
  "oruspu",
  "ibne",
  "ibneci",
  "lavuk",
  "gerizeka",
  "malmısın",
  "amına",
  "amkç",
  "mk",
  "sg"
];
];

// 🏆 level rolleri (15 level)
const levelRoles = {
  15: "çaylak",
  30: "gelişmiş",
  45: "usta",
  60: "profesyonel",
  75: "sadık dost",
  90: "dost"
};

// 🛒 shop
const shop = {
  vip: { price: 1000, role: "VIP" },
  pro: { price: 2500, role: "PRO" },
  prime: { price: 25000, role: "PRİME" }
};

client.on("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const user = getUser(msg.author.id);
  const content = msg.content.toLowerCase();
  const now = Date.now();

  // ================= XP =================
  user.xp += 10;
  user.coins += 5;

  const lvl = level(user.xp);

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

    msg.channel.send(`⚠️ ${msg.author} Küfür! (${user.warns}/3)`);

    if (user.warns >= 3) {
      const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
      if (muteRole) {
        msg.member.roles.add(muteRole);
        msg.channel.send(`🚫 ${msg.author} 1 saat mute`);
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

  if (content === "!rank") {
    return msg.reply(`📊 Level: ${lvl} | XP: ${user.xp} | 💰 ${user.coins}`);
  }

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

  if (content === "!daily") {
    if (now - user.daily < 86400000)
      return msg.reply("⏳ 24 saat dolmadı!");

    user.coins += 500;
    user.daily = now;
    msg.reply("🎁 500 coin aldın!");
  }

  if (content === "!coinflip") {
    const res = Math.random() < 0.5 ? "TURA" : "YAZI";
    msg.reply(`🪙 ${res}`);
  }

  if (content === "!sestop") {
    const count = msg.guild.members.cache.filter(m => m.voice.channel).size;
    msg.channel.send(`🔊 Voice: ${count}`);
  }

  // ================= SHOP =================
  if (content === "!shop") {
    msg.channel.send(
      "🛒 SHOP:\n" +
      Object.entries(shop)
        .map(([k, v]) => `${k} - ${v.price} coin`)
        .join("\n")
    );
  }

  if (content.startsWith("!buy")) {
    const item = content.split(" ")[1];
    const product = shop[item];

    if (!product) return msg.reply("❌ item yok");
    if (user.coins < product.price) return msg.reply("❌ coin yok");

    const role = msg.guild.roles.cache.find(r => r.name === product.role);
    if (!role) return msg.reply("❌ rol yok");

    user.coins -= product.price;
    msg.member.roles.add(role).catch(() => {});

    msg.reply(`✅ ${product.role} alındı`);
  }

  // ================= ADMIN XP =================
  if (content.startsWith("!addxp")) {
    if (msg.author.id !== "BURAYA_ID") return;

    const args = content.split(" ");
    const target = msg.mentions.users.first();
    const amount = parseInt(args[2]);

    if (!target || isNaN(amount))
      return msg.reply("!addxp @user 100");

    const u = getUser(target.id);
    u.xp += amount;

    msg.channel.send(`💎 ${target} +${amount} XP`);

    save();
  }

  save();
});

client.login(process.env.TOKEN);
