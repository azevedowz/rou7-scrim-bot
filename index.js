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

const VALOR_KILL = 1;
const PREMIO_1 = 40;
const PREMIO_2 = 25;
const PREMIO_3 = 15;

const ADMINS = ["649334731145740361"];

let scrimOpen = false;
let partidaIniciada = false;

let players = [];
let kills = {};
let weeklyKills = {};
let historico = [];
let positions = {};

let panelMessage = null;
let row = null;

/* reset ranking semanal automático */

setInterval(()=>{
weeklyKills = {};
console.log("Ranking semanal resetado");
}, 7 * 24 * 60 * 60 * 1000);

/* painel */

function gerarPainel(){

let lista = players.map((id,i)=>`${i+1}. <@${id}>`).join("\n");
if(lista === "") lista = "Nenhum jogador";

let ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.map((x,i)=>{

let kill = x[1];
let premio = kill * VALOR_KILL;

if(i === 0) premio += PREMIO_1;
if(i === 1) premio += PREMIO_2;
if(i === 2) premio += PREMIO_3;

return `${i+1}º <@${x[0]}> — ${kill} kills — 💰 R$${premio}`;

}).join("\n");

if(ranking === "") ranking = "Sem resultados";

return `🎮 **ROU7 SCRIM**

👥 Jogadores: **${players.length}/${MAX_PLAYERS}**

📋 **Lista**
${lista}

📊 **Placar**
${ranking}

💰 **Premiação**
🥇 1º R$40
🥈 2º R$25
🥉 3º R$15
💀 1 kill = R$1`;
}

/* bot pronto */

client.once("ready", async () => {

console.log("ROU7 SCRIM BOT ONLINE");

try {

const channel = await client.channels.fetch(VOICE_CHANNEL_ID);

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

/* comandos */

client.on("messageCreate", async (message)=>{

if(message.author.bot) return;

const args = message.content.split(" ");
const cmd = args[0].toLowerCase();

/* abrir scrim */

if(cmd === "!abrirscrim"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

if(scrimOpen)
return message.reply("⚠️ Já existe uma scrim aberta.");

scrimOpen = true;
partidaIniciada = false;

players = [];
kills = {};
positions = {};

row = new ActionRowBuilder().addComponents(

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
content: gerarPainel(),
components:[row]
});

}

/* definir posição */

if(cmd === "!posicao"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

const user = message.mentions.users.first();
const pos = parseInt(args[2]);

if(!user || isNaN(pos))
return message.reply("Uso: !posicao @player numero");

if(!players.includes(user.id))
return message.reply("⚠️ Jogador não está na scrim.");

positions[user.id] = pos;

message.channel.send(`🏁 ${user} definido como **${pos}º lugar**`);

}

/* registrar kill */

if(cmd === "!kill"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

if(!partidaIniciada)
return message.reply("⚠️ A partida ainda não iniciou.");

const user = message.mentions.users.first();
const amount = parseInt(args[2]);

if(!user || isNaN(amount))
return message.reply("Uso: !kill @player quantidade");

if(!players.includes(user.id))
return message.reply("⚠️ Jogador não está na scrim.");

if(!kills[user.id]) kills[user.id] = 0;
if(!weeklyKills[user.id]) weeklyKills[user.id] = 0;

kills[user.id] += amount;
weeklyKills[user.id] += amount;

message.channel.send(`💀 ${user} recebeu **${amount} kills**

Total: **${kills[user.id]}**`);

if(panelMessage){
await panelMessage.edit({
content: gerarPainel(),
components:[row]
});
}

}

/* ranking semanal */

if(cmd === "!weekly"){

const ranking = Object.entries(weeklyKills)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)
.map((x,i)=>`${i+1}. <@${x[0]}> — ${x[1]} kills`)
.join("\n");

message.channel.send(`🏆 **TOP 10 SEMANAL**

${ranking || "Sem dados"}`);

}

/* histórico */

if(cmd === "!historico"){

let lista = historico.map((x,i)=>`${i+1}. ${x}`).join("\n");

message.channel.send(`📜 **ÚLTIMAS SCRIMS**

${lista || "Sem histórico"}`);

}

/* finalizar */

if(cmd === "!finalizar"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

scrimOpen = false;
partidaIniciada = false;

const rankingArray = Object.entries(positions)
.sort((a,b)=>a[1]-b[1]);

let premioTotalSala = 0;

let resultado = rankingArray.map((x,i)=>{

let playerId = x[0];
let player = `<@${playerId}>`;
let kill = kills[playerId] || 0;

let premio = kill * VALOR_KILL;

if(i === 0) premio += PREMIO_1;
if(i === 1) premio += PREMIO_2;
if(i === 2) premio += PREMIO_3;

premioTotalSala += premio;

return `${i+1}º ${player} — ${kill} kills | 💰 R$${premio}`;

}).join("\n");

/* histórico */

if(rankingArray[0]){
historico.unshift(`🏆 <@${rankingArray[0][0]}> venceu a partida`);
if(historico.length > 10) historico.pop();
}

message.channel.send(`🏆 **SCRIM FINALIZADA**

${resultado}

💰 **Premiação total:** R$${premioTotalSala}`);

players = [];
kills = {};
positions = {};
panelMessage = null;

}

});

/* botões */

client.on("interactionCreate", async (interaction)=>{

if(!interaction.isButton()) return;

await interaction.deferReply({ephemeral:true});

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

/* sair */

if(interaction.customId === "scrim_sair"){

if(!players.includes(interaction.user.id))
return interaction.editReply("⚠️ Você não está inscrito.");

players = players.filter(p=>p !== interaction.user.id);

try{
await member.roles.remove(ROLE_ID);
}catch{}

await interaction.editReply(`❌ Saiu (${players.length}/${MAX_PLAYERS})`);

}

/* iniciar automaticamente quando lotar */

if(players.length >= MAX_PLAYERS && !partidaIniciada){

scrimOpen = false;
partidaIniciada = true;

await panelMessage.edit({
content:`🔥 **SCRIM LOTADA**

👥 ${players.length}/${MAX_PLAYERS}

🎮 **PARTIDA INICIANDO**

Boa sorte a todos!`,
components:[]
});

return;

}

if(panelMessage){

await panelMessage.edit({
content: gerarPainel(),
components:[row]
});

}

});

client.login(process.env.TOKEN);

/* servidor render */

const app = express();

app.get("/",(req,res)=>{
res.send("ROU7 SCRIM BOT ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Web server running");
});
