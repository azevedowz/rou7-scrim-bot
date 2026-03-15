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
let players = [];
let kills = {};
let weeklyKills = {};
let globalKills = {};
let saldoJogadores = {};
let historicoScrims = [];

let panelMessage = null;
let row = null;

/* BOT ONLINE */

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

/* ATUALIZAR PAINEL */

async function atualizarPainel(){

if(!panelMessage) return;

let lista = players.map((id,i)=>`${i+1}. <@${id}>`).join("\n");

if(lista === "") lista = "Nenhum jogador";

await panelMessage.edit({
content:`🎮 **SCRIM ABERTA**

👥 Jogadores: **${players.length}/${MAX_PLAYERS}**

📋 **Lista**
${lista}`,
components:[row]
});

}

/* COMANDOS */

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
players = [];
kills = {};

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
content:`🎮 **SCRIM ABERTA**

👥 Jogadores: **0/${MAX_PLAYERS}**

Clique no botão para participar.`,
components:[row]
});

}

/* lista */

if(cmd === "!lista"){

if(players.length === 0)
return message.channel.send("📋 Nenhum jogador inscrito.");

const lista = players.map((id,i)=>`${i+1}. <@${id}>`).join("\n");

message.channel.send(`📋 **INSCRITOS**

${lista}`);

}

/* registrar kill */

if(cmd === "!kill"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

const user = message.mentions.users.first();
const amount = parseInt(args[2]);

if(!user || isNaN(amount))
return message.reply("Uso: !kill @player quantidade");

if(!kills[user.id]) kills[user.id] = 0;
if(!weeklyKills[user.id]) weeklyKills[user.id] = 0;
if(!globalKills[user.id]) globalKills[user.id] = 0;

kills[user.id] += amount;
weeklyKills[user.id] += amount;
globalKills[user.id] += amount;

message.channel.send(`💀 ${user} recebeu **${amount} kills**

Total: **${kills[user.id]}**`);

}

/* ranking sala */

if(cmd === "!ranking"){

const ranking = Object.entries(kills)
.sort((a,b)=>b[1]-a[1])
.map((x,i)=>`${i+1}. <@${x[0]}> — ${x[1]} kills`)
.join("\n");

message.channel.send(`🏆 **RANKING**

${ranking || "Sem dados"}`);

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

/* ranking global */

if(cmd === "!global"){

const ranking = Object.entries(globalKills)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)
.map((x,i)=>`${i+1}. <@${x[0]}> — ${x[1]} kills`)
.join("\n");

message.channel.send(`🌎 **TOP 10 GLOBAL**

${ranking || "Sem dados"}`);

}

/* saldo */

if(cmd === "!saldo"){

const user = message.mentions.users.first() || message.author;

let saldo = saldoJogadores[user.id] || 0;

message.channel.send(`💰 ${user} possui **R$${saldo}** acumulados.`);

}

/* remover jogador */

if(cmd === "!remover"){

if(!ADMINS.includes(message.author.id))
return;

const user = message.mentions.users.first();

players = players.filter(p=>p !== user.id);

delete kills[user.id];

atualizarPainel();

message.channel.send(`🚫 ${user} removido da scrim.`);

}

/* resetar scrim */

if(cmd === "!resetarscrim"){

if(!ADMINS.includes(message.author.id))
return;

scrimOpen = false;
players = [];
kills = {};

message.channel.send("♻️ Scrim resetada.");

}

/* finalizar */

if(cmd === "!finalizar"){

if(!ADMINS.includes(message.author.id))
return message.reply("❌ Apenas admins.");

scrimOpen = false;

const rankingArray = Object.entries(kills)
.sort((a,b)=>b[1]-a[1]);

let premioTotalSala = 0;

let resultado = rankingArray.map((x,i)=>{

let player = `<@${x[0]}>`;
let kill = x[1];

let premio = kill * VALOR_KILL;

if(i === 0) premio += PREMIO_1;
if(i === 1) premio += PREMIO_2;
if(i === 2) premio += PREMIO_3;

if(!saldoJogadores[x[0]]) saldoJogadores[x[0]] = 0;

saldoJogadores[x[0]] += premio;

premioTotalSala += premio;

return `${i+1}º ${player} — ${kill} kills | 💰 R$${premio}`;

}).join("\n");

historicoScrims.push({
data: new Date(),
resultado: rankingArray
});

message.channel.send(`🏆 **SCRIM FINALIZADA**

${resultado}

💰 **Premiação total:** R$${premioTotalSala}`);

players = [];
kills = {};
panelMessage = null;

}

});

/* BOTÕES */

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

if(interaction.customId === "scrim_sair"){

if(!players.includes(interaction.user.id))
return interaction.editReply("⚠️ Você não está inscrito.");

players = players.filter(p=>p !== interaction.user.id);

try{
await member.roles.remove(ROLE_ID);
}catch{}

await interaction.editReply(`❌ Saiu (${players.length}/${MAX_PLAYERS})`);

}

/* fechar scrim se lotar */

if(players.length >= MAX_PLAYERS){

scrimOpen = false;

await panelMessage.edit({
content:`🎮 **SCRIM LOTADA**

👥 Jogadores: **${players.length}/${MAX_PLAYERS}**

🚫 Inscrições encerradas.`,
components:[]
});

return;

}

atualizarPainel();

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
