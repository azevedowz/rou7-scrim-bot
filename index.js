const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ROLE_ID = "1482232995573403820";

let players = [];
let kills = {};
let scrimOpen = false;
let panelMessage = null;

client.once("clientReady", () => {
  console.log("ROU7 SCRIM BOT ONLINE");
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  if (cmd === "!abrirscrim") {

    if (scrimOpen)
      return message.reply("⚠️ Já existe uma scrim aberta.");

    scrimOpen = true;
    players = [];
    kills = {};

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("entrar")
        .setLabel("Entrar")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("sair")
        .setLabel("Sair")
        .setStyle(ButtonStyle.Danger)

    );

    panelMessage = await message.channel.send({
      content:
`🎮 **SCRIM ABERTA**

👥 Jogadores: **0/32**

Clique no botão para participar.`,
      components: [row]
    });

  }

  if (cmd === "!lista") {

    if (players.length === 0)
      return message.channel.send("📋 Nenhum jogador inscrito.");

    const lista = players.map(id => `<@${id}>`).join("\n");

    message.channel.send(`📋 **INSCRITOS**

${lista}`);

  }

  if (cmd === "!kill") {

    const user = message.mentions.users.first();
    const amount = parseInt(args[2]);

    if (!user || isNaN(amount))
      return message.reply("Uso: !kill @player quantidade");

    if (!kills[user.id]) kills[user.id] = 0;

    kills[user.id] += amount;

    message.channel.send(
`💀 ${user} recebeu **${amount} kills**

Total: **${kills[user.id]}**`
    );

  }

  if (cmd === "!ranking") {

    if (Object.keys(kills).length === 0)
      return message.channel.send("📊 Nenhuma kill registrada.");

    const ranking = Object.entries(kills)
      .sort((a, b) => b[1] - a[1])
      .map((x, i) => `${i+1}. <@${x[0]}> — ${x[1]} kills`)
      .join("\n");

    message.channel.send(`🏆 **RANKING**

${ranking}`);

  }

  if (cmd === "!finalizar") {

    scrimOpen = false;

    const ranking = Object.entries(kills)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,3)
      .map((x,i)=>`${i+1}º <@${x[0]}> — ${x[1]} kills`)
      .join("\n");

    message.channel.send(
`🏆 **SCRIM FINALIZADA**

${ranking || "Nenhum resultado"}`
    );

    players = [];
    kills = {};

  }

});

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const member = interaction.member;

  if (!scrimOpen)
    return interaction.reply({
      content:"❌ Nenhuma scrim aberta",
      ephemeral:true
    });

  if (interaction.customId === "entrar") {

    if (players.includes(interaction.user.id))
      return interaction.reply({
        content:"⚠️ Você já entrou",
        ephemeral:true
      });

    players.push(interaction.user.id);
    kills[interaction.user.id] = 0;

    try {
      await member.roles.add(ROLE_ID);
    } catch {}

    await interaction.reply({
      content:`✅ Entrou (${players.length}/32)`,
      ephemeral:true
    });

  }

  if (interaction.customId === "sair") {

    players = players.filter(p=>p!==interaction.user.id);

    try {
      await member.roles.remove(ROLE_ID);
    } catch {}

    await interaction.reply({
      content:`❌ Saiu (${players.length}/32)`,
      ephemeral:true
    });

  }

  if (panelMessage) {

    await panelMessage.edit({
      content:
`🎮 **SCRIM ABERTA**

👥 Jogadores: **${players.length}/32**

Clique no botão para participar.`
    });

  }

});

client.login(process.env.TOKEN);


/* servidor web Render */

const app = express();

app.get("/", (req,res)=>{
  res.send("BOT ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log("Web server running");
});
