const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const prefix = "!";

// Basit XP sistemi
const xp = {};
const levels = {};

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});

// Üye girince hoşgeldin
client.on("guildMemberAdd", (member) => {
  const channel = member.guild.systemChannel;

  if (channel) {
    channel.send(`👋 Hoş geldin ${member}!`);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // XP sistemi
  const userId = message.author.id;

  if (!xp[userId]) xp[userId] = 0;
  if (!levels[userId]) levels[userId] = 1;

  xp[userId] += Math.floor(Math.random() * 10) + 5;

  const nextLevel = levels[userId] * 100;

  if (xp[userId] >= nextLevel) {
    levels[userId]++;
    xp[userId] = 0;

    message.channel.send(
      `🎉 ${message.author} seviye atladı! Yeni level: ${levels[userId]}`
    );
  }

  // Komut değilse devam etme
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Ping
  if (command === "ping") {
    return message.channel.send("🏓 Pong!");
  }

  // Yardım
  if (command === "yardım") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Komutları")
      .setDescription(`
!ping
!yardım
!profil
!clear
!kick
      `)
      .setColor("Blue");

    return message.channel.send({ embeds: [embed] });
  }

  // Profil
  if (command === "profil") {
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username} Profili`)
      .addFields(
        {
          name: "⭐ Level",
          value: `${levels[userId]}`,
          inline: true,
        },
        {
          name: "⚡ XP",
          value: `${xp[userId]}/100`,
          inline: true,
        }
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setColor("Green");

    return message.channel.send({ embeds: [embed] });
  }

  // Mesaj silme
  if (command === "clear") {
    if (!message.member.permissions.has("ManageMessages")) {
      return message.channel.send("❌ Yetkin yok!");
    }

    const amount = parseInt(args[0]);

    if (!amount) {
      return message.channel.send("Kaç mesaj silinecek?");
    }

    await message.channel.bulkDelete(amount, true);

    return message.channel.send(`🧹 ${amount} mesaj silindi.`);
  }

  // Kick
  if (command === "kick") {
    if (!message.member.permissions.has("KickMembers")) {
      return message.channel.send("❌ Yetkin yok!");
    }

    const member = message.mentions.members.first();

    if (!member) {
      return message.channel.send("Bir kullanıcı etiketle!");
    }

    await member.kick();

    return message.channel.send(`👢 ${member.user.tag} sunucudan atıldı.`);
  }
});

client.login(process.env.TOKEN);
