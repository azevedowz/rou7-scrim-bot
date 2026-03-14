const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let players = [];
let kills = {};
let scrimOpen = false;

client.once("ready", () => {
  console.log("ROU7 SCRIM BOT ONLINE");
});

client.on("messageCreate", async message => {

if (message.author.bot) return;

if (message.content === "!abrirscrim") {

scrimOpen = true;
players = [];
kills = {};

const button = new ButtonBuilder()
.setCustomId("entrar")
.setLabel("Entrar na Scrim")
.setStyle(ButtonStyle.Success);

const row = new ActionRowBuilder().addComponents(button);

message.channel.send({
content:"🎮 SCRIM ABERTA\nClique no botão para entrar",
components:[row]
});

}

if (message.content === "!lista") {

let list = players.map(p=>`<@${p}>`).join("\n");

message.channel.send(`📋 INSCRITOS\n${list}`);

}

});

client.on("interactionCreate", interaction => {

if (!interaction.isButton()) return;

if (interaction.customId === "entrar") {

if (players.includes(interaction.user.id))
return interaction.reply({content:"Você já entrou",ephemeral:true});

if (players.length >= config.maxPlayers)
return interaction.reply({content:"Sala cheia",ephemeral:true});

players.push(interaction.user.id);
kills[interaction.user.id] = 0;

interaction.reply({
content:`Inscrito (${players.length}/32)`,
ephemeral:true
});

}

});

client.login(config.token);
