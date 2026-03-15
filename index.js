const {
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");
const express = require("express");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
});

const ROLE_ID = "1482232995573403820";
const VOICE_CHANNEL_ID = "1482222083634368525";
const MAX_PLAYERS = 32;

let scrimOpen = false;
let players = [];
let kills = {};
let panelMessage = null;

client.once("ready", async () => {

console.log("ROU7 SCRIM BOT ONLINE");

try {

const channel = await client.channels.fetch(VOICE_CHANNEL_ID);

if(!channel){
console.log("Canal de voz não encontrado");
return;
}

joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator
});

console.log("Bot entrou na call");

} catch(err){
console.log("Erro ao entrar na call:", err);
}

});

client.on("messageCreate", async (message)=>{

if(message.author.bot) return;

const args = message.content.split(" ");
const cmd = args[0].toLowerCase();

if(cmd === "!abrirscrim"){

if(scrimOpen)
return message.reply("⚠️ Já existe uma scrim aberta.");

scrimOpen = true;
players = [];
kills = {};

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("scrim_entrar")
.setLabel("Entrar")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("scrim_sair")
.setLabel("Sair")
.setStyle(ButtonStyle.Danger)

);

panelMessage = await message.channel.send({
content:`🎮 **SCRIM ABERTA**

👥 Jogadores: **0/${MAX_PLAYERS}**

Clique no botão para participar.`,
components:[row]
});

}

if(cmd === "!lista"){

if(players.length === 0)
return message.channel.send("📋 Nenhum jogador inscrito.");

const lista = players.map(id=>`<@${id}>`).join("\n");

message.channel.send(`📋 **INSCRITOS**

${lista}`);

}

if(cmd === "!kill"){

const user = message.mentions.users.first();
const amount = parseInt(args[2]);

if(!user || isNaN(amount))
return message.reply("Uso: !kill @player quantidade");

if(!kills[user.id]) kills[user.id] = 0;

kills[user.id] += amount;

message.channel.send(`💀 ${user} recebeu **${amount} kills**

Total: **${kills[user.id]}**`);

}

if(cmd === "!ranking"){

if(Object.keys(kills).length === 0)
return message.channel.send("📊 Nenhuma kill registrada.");

const ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.map((x,i)=>`${i+1}. <@${x[0]}> — ${x[1]} kills`)
.join("\n");

message.channel.send(`🏆 **RANKING**

${ranking}`);

}

if(cmd === "!finalizar"){

scrimOpen = false;

const ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.slice(0,3)
.map((x,i)=>`${i+1}º <@${x[0]}> — ${x[1]} kills`)
.join("\n");

message.channel.send(`🏆 **SCRIM FINALIZADA**

${ranking || "Nenhum resultado"}`);

players = [];
kills = {};
panelMessage = null;

}

});

client.on("interactionCreate", async (interaction)=>{

if(!interaction.isButton()) return;

try{

await interaction.deferReply({ephemeral:true});

if(!scrimOpen)
return interaction.editReply("❌ Nenhuma scrim aberta.");

const member = interaction.member;

if(interaction.customId === "scrim_entrar"){

if(players.includes(interaction.user.id))
return interaction.editReply("⚠️ Você já entrou.");

if(players.length >= MAX_PLAYERS)
return interaction.editReply("🚫 Sala cheia.");

players.push(interaction.user.id);
kills[interaction.user.id] = 0;

try{
await member.roles.add(ROLE_ID);
}catch{}

await interaction.editReply(`✅ Entrou (${players.length}/${MAX_PLAYERS})`);

}

if(interaction.customId === "scrim_sair"){

if(!players.includes(interaction.user.id))
return interaction.editReply("⚠️ Você não está inscrito.");

players = players.filter(p=>p !== interaction.user.id);

try{
await member.roles.remove(ROLE_ID);
}catch{}

await interaction.editReply(`❌ Saiu (${players.length}/${MAX_PLAYERS})`);

}

if(panelMessage){

await panelMessage.edit({
content:`🎮 **SCRIM ABERTA**

👥 Jogadores: **${players.length}/${MAX_PLAYERS}**

Clique no botão para participar.`
});

}

}catch(err){

console.log("Erro na interação:", err);

}

});

client.login(process.env.TOKEN);


/* servidor web para render */

const app = express();

app.get("/",(req,res)=>{
res.send("ROU7 SCRIM BOT ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Web server running");
});
