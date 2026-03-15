const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let players = [];
let panelMessage = null;
let scrimOpen = false;

const ROLE_ID = "1482232995573403820";

client.once("clientReady", () => {
  console.log("ROU7 SCRIM BOT ONLINE");
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  if (message.content === "!abrirscrim") {

    if (scrimOpen) return message.reply("⚠️ Já existe uma scrim aberta.");

    scrimOpen = true;
    players = [];

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
      content: `🎮 **SCRIM ABERTA**

Jogadores: **0/32**

Clique no botão para participar.`,
      components: [row]
    });
  }

  if (message.content === "!lista") {

    if (players.length === 0) {
      return message.channel.send("📋 Nenhum jogador inscrito.");
    }

    const lista = players.map(id => `<@${id}>`).join("\n");

    message.channel.send(`📋 **INSCRITOS**

${lista}`);
  }

});

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const member = interaction.member;

  if (!scrimOpen) {
    return interaction.reply({
      content: "❌ Nenhuma scrim aberta.",
      ephemeral: true
    });
  }

  if (interaction.customId === "entrar") {

    if (players.includes(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Você já entrou.",
        ephemeral: true
      });
    }

    if (players.length >= 32) {
      return interaction.reply({
        content: "🚫 Sala cheia.",
        ephemeral: true
      });
    }

    players.push(interaction.user.id);

    await member.roles.add(ROLE_ID);

    await interaction.reply({
      content: `✅ Você entrou (${players.length}/32)`,
      ephemeral: true
    });
  }

  if (interaction.customId === "sair") {

    if (!players.includes(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Você não está na scrim.",
        ephemeral: true
      });
    }

    players = players.filter(id => id !== interaction.user.id);

    await member.roles.remove(ROLE_ID);

    await interaction.reply({
      content: `❌ Você saiu (${players.length}/32)`,
      ephemeral: true
    });
  }

  if (panelMessage) {
    await panelMessage.edit({
      content: `🎮 **SCRIM ABERTA**

Jogadores: **${players.length}/32**

Clique no botão para participar.`
    });
  }

});

client.login(process.env.TOKEN);


/* servidor para Render */

const app = express();

app.get("/", (req, res) => {
  res.send("Bot online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor web ativo");
});
