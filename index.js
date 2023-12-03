const Discord = require('discord.js');
const db = require('pro.db');
const server = require('./server');
const { AutoKill } = require('autokill');

const client = new Discord.Client({
    intents: 3276799
});

let { roleId, sjenId, logId, des, des2, prefix } = require('./config');

client.on('ready', () => {
    console.log(`${client.user.tag}`);
    client.user.setActivity(`V0rRteX`, { type: 'STREAMING', url: 'https://www.twitch.tv/V0rRteX' });
});

require('dotenv').config();

client.on('messageCreate', async (message) => {
    let args = message.content.split(' ');

    if (message.content.startsWith('فحص')) {
        if (!args[1]) return;

        let try1 = message.mentions?.members?.first();
        let member;
        if (try1) {
            member = try1;
        } else {
            member = {
                id: args[1],
                username: `unknown`,
            };
        }

        let check = db.has(`sjen_${member.id}`);
        let deso = des;

        if (check) {
            deso = des2;

            let jailInfo = db.get(`sjen_${member.id}`);
            let jailer = message.guild.members.cache.get(jailInfo.by);
            let jailerMention = jailer ? jailer.toString() : 'Unknown Moderator';

            let response = {
                color: 'DARK_RED',
                title: '**فحص العضو**',
                description: ``,
                timestamp: new Date(),
                footer: {
                    iconURL: message.guild.iconURL(),
                    text: message.guild.name,
                }
            };

            if (jailInfo.reason !== undefined) {
                response.description += `\n**سبب السجن:** ${jailInfo.reason}`;
            } else {
                response.description += '\n**سبب السجن:** Not provided';
            }

            response.description += `\n**تم السجن في:** <t:${Math.floor(jailInfo.date / 1000)}:R>`;
            if (jailInfo.time) {
                const releaseTime = jailInfo.date + jailInfo.time;
                response.description += `\n**تم الإفراج في:** <t:${Math.floor(releaseTime / 1000)}:R>`;
            }

            response.description += `\n**تم السجن بواسطة:** ${jailerMention}`;

            message.reply({
                embeds: [response],
            });
        }
    }

    if (message.content.startsWith('فحص الكل')) {
        let guildMembers = message.guild.members.cache;
        let jailedMembers = guildMembers.filter((member) => db.has(`sjen_${member.id}`));

        if (jailedMembers.size === 0) {
            message.reply('لا يوجد أعضاء مسجونين حاليًا.');
            return;
        }

        let response = {
            color: 'DARK_RED',
            title: '**فحص جميع الاعضاء الذي تم سجنهم**',
            description: '',
            timestamp: new Date(),
            footer: {
                iconURL: message.guild.iconURL(),
                text: message.guild.name,
            }
        };

        jailedMembers.forEach((member) => {
            let jailInfo = db.get(`sjen_${member.id}`);
            let jailer = message.guild.members.cache.get(jailInfo.by);
            let jailerMention = jailer ? jailer.toString() : 'Unknown Moderator';

            response.description += `\n\n**العضو:** ${member}\n`;
            response.description += `**سبب السجن:** ${jailInfo.reason || 'Not provided'}\n`;
            response.description += `**تاريخ السجن:** <t:${Math.floor(jailInfo.date / 1000)}:R>\n`;
            response.description += `**تم السجن بواسطة:** ${jailerMention}`;
        });

        message.reply({
            embeds: [response],
        });
    }

    if (message.content.startsWith(`سجن`)) {
        if (!args[1]) return message.reply('الرجاء تحديد شخص');
        if (!message.member.roles?.cache.has(roleId)) return message.reply('ليس لديك الصلاحيات لفعل ذلك');
        let try1 = message.mentions?.members?.first();
        let member;
        if (try1) {
            member = try1;
        } else {
            member = await message.guild.members.fetch(args[1]).catch((error) => {
                console.error(`Failed to fetch member: ${error}`);
                member = 'x';
            });
        }
        if (member === 'x') return message.reply('الرجاء تحديد شخص');
        let check = db.has(`sjen_${member.id}`);
        if (check) return message.reply('مسجون من قبل');
        let role = member.guild.roles.cache.find((role) => role.id === sjenId);
        member.roles?.add(role).catch((error) => console.error(`Failed to add role: ${error}`));

        let reason = args.slice(2).join(' ') || `**لا يوجد سبب**`;
        let shortenedReason = reason.length > 100 ? reason.substring(0, 100) + '...' : reason;

        db.set(`sjen_${member.id}`, {
            date: Date.now(),
            reason: reason,
            by: message.author.id,
        });

        const jailMessage = `
                لقد قام الاداري : ${message.member} 
                بسجن العضو : ${member}
                بسبب : ${shortenedReason}
                <t:${Math.floor(Date.now() / 1000)}:R>
            `;

        client.channels.cache.find((x) => x.id == logId).send(jailMessage);
        client.channels.cache.find((x) => x.id == logId).send('https://cdn.discordapp.com/attachments/1156006848932098149/1179562345891102730/7767.jpg?ex=657a3c0a&is=6567c70a&hm=6d817045428f3589b2965ea75c324459b448f8a9704dd1c5dab863df47039717&');

        member.roles?.cache.forEach((x) => {
            member.roles?.remove(x.id).catch((error) => console.error(`Failed to remove role: ${error}`));
        });

        message.reply(`تم سجن ${member}`).catch(console.error);
    }

      if (message.content.startsWith(`فك`)) {
          if (!args[1]) return message.reply('الرجاء تحديد شخص');
          if (!message.member.roles?.cache.has(roleId)) return message.reply('ليس لديك الصلاحيات لفعل ذلك');
          let try1 = message.mentions?.members?.first();
          let member = null; // تهيئة member قبل استخدامه

          if (try1) {
              member = try1;
          } else {
              member = await message.guild.members.fetch(args[1]).catch((error) => {
                  console.error(`Failed to fetch member: ${error}`);
                  member = 'x';
              });
          }
          if (member === 'x') return message.reply('**الرجاء تحديد شخص**');


  let check = db.has(`sjen_${member.id}`);
  if (!check) return message.reply('ليس مسجون من قبل');
  let role = member.guild.roles.cache.find((role) => role.id === sjenId);
  member.roles?.remove(role).catch((error) => console.error(`Failed to remove role: ${error}`));
  db.delete(`sjen_${member.id}`);

  const unjailMessage = `
          لقد قام الاداري : ${message.member} 
          ب  فك سجن العضو : ${member}
          <t:${Math.floor(Date.now() / 1000)}:R>
      `;

  client.channels.cache.find((x) => x.id == logId).send(unjailMessage);
  client.channels.cache.find((x) => x.id == logId).send('https://cdn.discordapp.com/attachments/1156006848932098149/1179562345891102730/7767.jpg?ex=657a3c0a&is=6567c70a&hm=704dd1c5dab863df47039717&');

  message.reply(`تم فك سجن ${member}`).catch(console.error);
}
});


   

client.on('guildMemberAdd', (member) => {
    let ch = db.has(`sjen_${member.id}`);
    if (!ch) return;
    let role = member.guild.roles.cache.find((role) => role.id === sjenId);
    member.roles?.add(role).catch((error) => console.error(`Failed to add role: ${error}`));

    const jailOnJoinMessage = `
        العضو ${member}
        طلع ودخل و تم وضعه في السجن
        <t:${Math.floor(Date.now() / 1000)}:R>
    `;

    client.channels.cache.find((x) => x.id == logId).send(jailOnJoinMessage);
    client.channels.cache.find((x) => x.id == logId).send('https://cdn.discordapp.com/attachments/1156006848932098149/1179562345891102730/7767.jpg?ex=657a3c0a&is=6567c70a&hm=6d817045428f3589b2965ea75c324459b448f8a9704dd1c5dab863df47039717&');
});

AutoKill(client);

client.login(process.env.token);
