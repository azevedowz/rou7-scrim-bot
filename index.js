const { 
Client, 
GatewayIntentBits, 
ActionRowBuilder, 
ButtonBuilder, 
ButtonStyle 
} = require("discord.js");

const express = require("express");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

let players = [];
let scrimOpen = false;
let panelMessage = null;

client.once("ready", () => {
console.log("ROU7 SCRIM BOT ONLINE");
});

client.on("messageCreate", async message => {

if(message.author.bot) return;

if(message.content === "!abrirscrim"){

scrimOpen = true;
players = [];

const entrar = new ButtonBuilder()
.setCustomId("entrar")
.setLabel("Entrar")
.setStyle(ButtonStyle.Success);

const sair = new ButtonBuilder()
.setCustomId("sair")
.setLabel("Sair")
.setStyle(ButtonStyle.Danger);

const row = new ActionRowBuilder().addComponents(entrar,sair);

panelMessage = await message.channel.send({
content:`🎮 **SCRIM ABERTA**

Jogadores: **0/32**

Clique no botão para participar.`,
components:[row]
});

}

});

client.on("interactionCreate", async interaction => {

if(!interaction.isButton()) return;

await interaction.deferReply({ephemeral:true});

if(!scrimOpen)
return interaction.editReply("Scrim não está aberta");

if(interaction.customId === "entrar"){

if(players.includes(interaction.user.id))
return interaction.editReply("Você já está na scrim");

if(players.length >= 32)
return interaction.editReply("Sala cheia");

players.push(interaction.user.id);

interaction.editReply("✅ Você entrou na scrim");

}

if(interaction.customId === "sair"){

if(!players.includes(interaction.user.id))
return interaction.editReply("Você não está na scrim");

players = players.filter(p => p !== interaction.user.id);

interaction.editReply("❌ Você saiu da scrim");

}

/* atualizar painel */

if(panelMessage){

panelMessage.edit({
content:`🎮 **SCRIM ABERTA**

Jogadores: **${players.length}/32**

Clique no botão para participar.`,
});

}

});

client.login(process.env.TOKEN);

/* servidor para render */

const app = express();

app.get("/",(req,res)=>{
res.send("ROU7 SCRIM BOT ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Web server running");
});
