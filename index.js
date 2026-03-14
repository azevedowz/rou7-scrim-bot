const { 
Client, 
GatewayIntentBits, 
ActionRowBuilder, 
ButtonBuilder, 
ButtonStyle 
} = require("discord.js");

const express = require("express");
const config = require("./config.json");

const client = new Client({
  intents:[
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

if(message.author.bot) return;

/* ABRIR SCRIM */

if(message.content === "!abrirscrim"){

scrimOpen = true;
players = [];
kills = {};

const button = new ButtonBuilder()
.setCustomId("entrar_scrim")
.setLabel("Entrar na Scrim")
.setStyle(ButtonStyle.Success);

const row = new ActionRowBuilder().addComponents(button);

message.channel.send({
content:"🎮 SCRIM ABERTA\nClique no botão para entrar",
components:[row]
});

}

/* LISTA */

if(message.content === "!lista"){

if(players.length === 0)
return message.channel.send("📋 Nenhum jogador inscrito");

let list = players.map(p=>`<@${p}>`).join("\n");

message.channel.send(`📋 INSCRITOS (${players.length})\n${list}`);

}

/* KILL */

if(message.content.startsWith("!kill")){

const args = message.content.split(" ");
const user = message.mentions.users.first();
const amount = parseInt(args[2]);

if(!user) return message.reply("Marque um jogador");
if(!amount) return message.reply("Informe quantidade");

if(!kills[user.id]) kills[user.id] = 0;

kills[user.id] += amount;

message.channel.send(`💀 ${user} agora tem ${kills[user.id]} kills`);

}

/* RANKING */

if(message.content === "!ranking"){

if(players.length === 0)
return message.channel.send("Nenhum jogador registrado");

let ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.map((p,i)=>`${i+1}° <@${p[0]}> - ${p[1]} kills`)
.join("\n");

message.channel.send(`🏆 RANKING\n${ranking}`);

}

/* FINALIZAR */

if(message.content === "!finalizar"){

scrimOpen = false;

let ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.map((p,i)=>`${i+1}° <@${p[0]}> - ${p[1]} kills`)
.join("\n");

message.channel.send(`🏁 SCRIM FINALIZADA\n${ranking}`);

}

});

/* BOTÃO */

client.on("interactionCreate", async interaction => {

if(!interaction.isButton()) return;

if(interaction.customId === "entrar_scrim"){

await interaction.deferReply({ephemeral:true});

if(!scrimOpen)
return interaction.editReply("Scrim não está aberta");

if(players.includes(interaction.user.id))
return interaction.editReply("Você já está inscrito");

if(players.length >= config.maxPlayers)
return interaction.editReply("Sala cheia");

players.push(interaction.user.id);
kills[interaction.user.id] = 0;

interaction.editReply(`✅ Inscrito (${players.length}/${config.maxPlayers})`);

}

});

/* LOGIN */

client.login(process.env.TOKEN);

/* WEB SERVER (RENDER) */

const app = express();

app.get("/",(req,res)=>{
res.send("ROU7 SCRIM BOT ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Web server running");
});
