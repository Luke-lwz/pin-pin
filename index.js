//Author: Lukas Lunkwitz
//Version: 1.0
//Date: 20.11.2020 .then
const version = "2.0.0"


//Data
const fn = require("./data/functions.js")

const emojis = require("./data/emojis.json")
//////

const config = require('./config.json') //config file with token

//Discord.js
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const prefix = config.prefix;
const atBot = "<@!" + config.id + ">"
////////////

//Advanced command handler
const fs = require("fs");
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command)
}

client.chans = new Discord.Collection();
const chanFiles = fs.readdirSync('./chans').filter(file => file.endsWith('.js'))
for (const file of chanFiles) {
  const chan = require(`./chans/${file}`);
  client.chans.set(chan.name, chan)
}
//////////////////////////

//lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)
pcdb.defaults({ server: [], settings: [], vcs: [], tcs: [], linked: [], requests: [] }).write()
pcdb.read()
////////

//Moment
const moment = require('moment');
////////

const links = require("./data/links.json")

const perms = ['MANAGE_CHANNELS', 'MANAGE_WEBHOOKS', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'MOVE_MEMBERS'];

client.once('ready', () => {
  console.log("online")
  client.user.setPresence({
    status: 'available',
    activity: {
      name: '::help',
      type: 'LISTENING'
    }
  })
  setInterval(() => {
    client.user.setPresence({
      status: 'available',
      activity: {
        name: '::help',
        type: 'LISTENING'
      }
    })
  }, 1800000);
  setInterval(() => {
    //console.log(moment().format("LTS"))
    fn.channel.text.cooldown.check(client, moment).catch(console.error)
  }, 60000);
  setInterval(() => {
    fn.channel.check.vcs(client);
    fn.channel.check.request(client);
  }, 864000000);
});



client.on('message', message => {
  pcdb.read()
  if (message.author.bot) return;
  if (message.guild) { //checks if message is sent in guild
    txtData = pcdb.get("tcs").filter({ channel: message.channel.id }).value()[0]
    if (txtData) {
      fn.channel.text.cooldown.reset(txtData.channel, moment)
    }
    if (!message.content.startsWith(prefix) && !message.content.startsWith(atBot)) return; //if message doesn't start with prefix then return
    var args;
    if (message.content.startsWith(prefix)) {
      args = message.content.slice(prefix.length).split(/ +/)
    } else if (message.content.startsWith(atBot)) {
      args = message.content.slice(atBot.length).split(/ +/)
    }

    if (args[0] === "") {
      args.shift()
    }
    if (args[0] === undefined) return;
    //Checks if bot has every permission it needs
    var permsCheck = fn.permissions.self.check(message.guild, perms)
    if (permsCheck !== null) { message.channel.send({ embed: permsCheck }).catch(() => message.author.send({ embed: permsCheck }).catch(console.error)); return; }
    /////////////////////////////////////////////
    const command = args.shift().toLowerCase();
    switch (command) {
      case "setup":
      case "init":
        client.commands.get("setup").execute(client, prefix, command, message, args);
        break;
      case "reset":
        client.commands.get("reset").execute(client, prefix, command, message, args);
        break;
      case "settings":
      case "set":
      case "toggle":
        client.commands.get("settings").execute(client, prefix, command, message, args);
        break;
      case "info":
      case "i":
        client.commands.get("info").execute(version, client, prefix, command, message, args, links);

        break;
      case "commands":
      case "command":
      case "cmd":
        client.commands.get("commands").execute(client, prefix, command, message, args);

        break;
      case "donate":
      case "donation":
      case "dono":
      case "d":
        client.commands.get("donate").execute(client, prefix, command, message, args, links);

        break;
      case "dev":
      case "developer":
        client.commands.get("dev").execute(client, prefix, command, message, args, links);

        break;
      case "invite":
        client.commands.get("invite").execute(client, prefix, command, message, args, links);

        break;
      case "vote":
        message.channel.send({
          "embed": {
            "title": ":blue_heart: VOTE",
            "description": "Voting is free and supports me a lot.\nJust click [here](" + links.vote + ")",
            "color": 16645629
          }
        })

        break;
      case "help":
      case "?":
        client.commands.get("help").execute(client, prefix, command, message, args, links, version);

        break;
      case "create":
      case "join":
        message.channel.send("`" + prefix + command + "` doesn't work anymore. It has been replaced by `" + prefix + "text` & `" + prefix + "voice`")
        break;
      case "text":
      case "voice":
        message.channel.send("`" + prefix + command + "` only works in PIN PIN's DM channel!")
        break;
      case "privacy":
        client.commands.get("privacy").execute(client, prefix, command, message, args, links);
        break;
    }

    if (txtData) {
      switch (command) {
        case "leave":
          if (message.author.id == txtData.host) {
            message.channel.delete().then(() => {
              message.author.send({
                embed: {
                  title: ":wood: Channel deleted",
                  description: "Your channel `" + txtData.name + "` was deleted because you left!",
                  color: 6693139
                }
              }).catch(console.error)
              fn.logging.post(client, message.guild.id, {//logging post
                embed: {
                  title: ":wood: DELETED",
                  description: "<@" + message.author.id + "> deleted their text channel `" + txtData.name + "`",
                  color: 6693139,
                  footer: {
                    text: message.author.id
                  },
                  timestamp: new Date()
                }
              })
            }).catch(() => {
              message.channel.send({
                embed: {
                  title: ":x: - Error",
                  description: "Channel couldn't be deleted but it was removed from our database (no one can join anymore)",
                  color: 14370633
                }
              }).catch(console.error)
            })
            pcdb.get("tcs").remove({ channel: message.channel.id, host: message.author.id }).write()
            return;
          }
          if (!message.channel.permissionOverwrites.get(message.author.id)) return;
          message.channel.permissionOverwrites.get(message.author.id).delete().then(() => {
            message.author.send({
              embed: {
                title: ":fallen_leaf: Left",
                description: "You left <#" + txtData.name + ">, hosted by <@" + txtData.host + ">",
                color: 14261890
              }
            })
            message.channel.send({
              embed: {
                description: ":fallen_leaf: <@" + message.author.id + "> left",
                color: 14261890
              }
            })
            fn.logging.post(client, message.guild.id, {//logging post
              embed: {
                title: ":fallen_leaf: LEFT",
                description: "<@" + message.author.id + "> left text channel `" + txtData.name + "` | <#" + txtData.channel + ">",
                color: 14261890,
                footer: {
                  text: message.author.id
                },
                timestamp: new Date()
              }
            })
          }).catch(console.error)
          break;
        case "kick":
          if (message.author.id !== txtData.host) return;
          if (!message.mentions.users.first()) { message.channel.send("> Usage: `" + prefix + "kick <user_mention>`"); return; }
          const userID = message.mentions.users.first().id
          if (userID == txtData.host) return message.channel.send("> <@" + txtData.host + ">, you cannot kick yourselfn.")
          if (!message.channel.permissionOverwrites.get(userID)) return;
          message.channel.permissionOverwrites.get(userID).delete()
          message.react(fn.emoji.get("2705"))
          fn.logging.post(client, message.guild.id, {//logging post
            embed: {
              title: ":fallen_leaf: KICKED",
              description: "<@" + message.author.id + "> was kicked from text channel `" + txtData.name + "` by <@" + txtData.host + "> | <#" + txtData.channel + ">",
              color: 14261890,
              footer: {
                text: message.author.id
              },
              timestamp: new Date()
            }
          })
          break;
        case "data":
          message.channel.send({
            embed: {
              title: "Data",
              description: "NAME: `" + txtData.name + "`\nPIN: `" + txtData.pin + "`\nHOST: <@" + txtData.host + ">"
            }
          })
          break;
        case "pin":
          if (message.author.id !== txtData.host) return; //if user isn't the host of the channel
          if (args.length > 0 && args[0] !== txtData.pin) {
            var pinCheck = fn.channel.check.pin(args[0])
            if (pinCheck !== null) { message.channel.send({ embed: pinCheck }); return; }
            pcdb.get("tcs").find({ host: message.author.id, channel: message.channel.id }).assign({ pin: args[0] }).write()
            message.react(fn.emoji.get("2705"))
            message.channel.setTopic("Commands: __**leave, kick, data, pin**__ • Host: <@" + txtData.host + "> • This channel will be deleted after **30 min** of inactivity!").catch(console.error)
            fn.logging.post(client, message.guild.id, { //logging post
              embed: {
                title: ":key: PIN CHANGED",
                description: "<@" + message.author.id + "> changed the PIN of `" + txtData.name + "` | <#" + txtData.channel + ">",
                color: 12675407,
                fields: [
                  {
                    name: "NEW PIN",
                    value: "||" + args[0] + "||"
                  }
                ],
                footer: {
                  text: message.author.id
                },
                timestamp: new Date()
              }
            })
          } else {
            message.channel.send("> Usage: `" + prefix + "pin <new pin>`")
          }
          break;
      }
    }

  } else if (!message.guild) {
    const args = message.content.split(/ +/);
    var command = args.shift().toLowerCase();
    if (command.startsWith("::")) {
      command = command.slice(prefix.length);
    }
    switch (command) {
      case "text":
      case "tc":
      case "t":
        client.chans.get("text").execute(client, prefix, message, command, args, links, perms, moment)
        break;
      case "voice":
      case "vc":
      case "v":
        client.chans.get("voice").execute(client, prefix, message, command, args, links, perms, moment)
        break;
      case "linked":
      case "ln":
      case "l":
        client.chans.get("linked").execute(client, prefix, message, command, args, links, perms, moment)
        break;
      case "create":
      case "join":
        message.channel.send("`" + prefix + command + "` doesn't work anymore. It has been replaced by `" + prefix + "text` & `" + prefix + "voice` & `" + prefix + "linked`")
        break;
    }





  }


});

client.on('voiceStateUpdate', (oldMember, newMember) => {

  if (oldMember.channelID == newMember.channelID) { // checks if user didn't move
    if (newMember.channel != null && oldMember.channel != null) return; //returns if someone just mutes and stuff
  }
  pcdb.read()
  let newChannelID = newMember.channelID //channel id is in new var
  let oldChannelID = oldMember.channelID //channel id is in new var
  var newServerDoc = pcdb.get("server").find({ guildId: newMember.guild.id }).value() //server in db is in new var
  var oldServerDoc = pcdb.get("server").find({ guildId: oldMember.guild.id }).value() //server in db is in new var



  const channelDB = {
    voice: {
      new: pcdb.get("vcs").filter({ channel: newChannelID }).value()[0],
      old: pcdb.get("vcs").filter({ channel: oldChannelID }).value()[0]
    },
    linked: {
      new: pcdb.get("linked").filter({ vc: newChannelID }).value()[0],
      old: pcdb.get("linked").filter({ vc: oldChannelID }).value()[0]
    }
  }


  if (newServerDoc == undefined || oldServerDoc == undefined) return; //if server doesn't exist in db (not setup) return

  //LINKED
  if (channelDB.linked.new) {//checks if user joins linked
    pcdb.read()
    //update user count
    var count = channelDB.linked.new.count;
    count++;
    pcdb.get("linked").find({ vc: newChannelID }).assign({ count: count }).write();
    ///////////////////

    client.channels.fetch(channelDB.linked.new.tc).then(channel => {
      channel.updateOverwrite(newMember.id, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'EMBED_LINKS': true, 'ATTACH_FILES': true, 'READ_MESSAGE_HISTORY': true }).then(() => {
        channel.send({
          embed: {
            description: ":paperclip: <@" + newMember.id + "> joined",
            color: 11647423
          }
        })
        logThat(newMember, {
          embed: {
            title: ":paperclip: JOINED",
            description: "<@" + newMember.id + "> joined linked channel `" + channelDB.linked.new.name + "` | <#" + channelDB.linked.new.tc + ">",
            color: 11647423,
            footer: {
              text: newMember.id
            },
            timestamp: new Date()
          }
        })
      }).catch(console.error)
    }).catch(console.error)

  } else if (channelDB.linked.old) { //checks if user leaves linked
    pcdb.read()
    //update user count
    var count = channelDB.linked.old.count;
    count--;
    pcdb.get("linked").find({ vc: oldChannelID }).assign({ count: count }).write();
    ///////////////////


    if (count <= 0) {//Deletion of channel
      const tc = channelDB.linked.old.tc
      const vc = channelDB.linked.old.vc
      pcdb.get("linked").remove({ tc: tc, vc: vc }).write()
      client.channels.fetch(tc).then(channel => {
        channel.delete().catch(console.error)
      }).catch(console.error)
      client.channels.fetch(vc).then(channel => {
        channel.delete().catch(console.error)
      }).catch(console.error)
      logThat(newMember, {
        embed: {
          title: ":wastebasket: DELETED",
          description: "`" + channelDB.linked.old.name + "` was deleted by <@" + oldMember.id + ">",
          color: 4015692,
          footer: {
            text: oldMember.id
          },
          timestamp: new Date()
        }
      })
    } else { //if channel is not empty, send bye messsage
      client.channels.fetch(channelDB.linked.old.tc).then(channel => {
        if (channel.permissionOverwrites.get(oldMember.id)) {
          channel.permissionOverwrites.get(oldMember.id).delete().then(() => {
            channel.send({
              embed: {
                description: ":cloud_tornado: <@" + oldMember.id + "> left",
                color: 6714751
              }
            })
            logThat(oldMember, {
              embed: {
                title: ":cloud_tornado: LEFT",
                description: "<@" + oldMember.id + "> left linked channel `" + channelDB.linked.old.name + "` | <#" + channelDB.linked.old.tc + ">",
                color: 6714751,
                footer: {
                  text: oldMember.id
                },
                timestamp: new Date()
              }
            })
          }).catch(console.error)
        }

      }).catch(console.error)
    }
  }
  ///////

  //VOICE 
  if (channelDB.voice.new) { //join voice
    //COUNT
    var count = channelDB.voice.new.count;
    count++;
    pcdb.get("vcs").find({ channel: newChannelID }).assign({ count: count }).write()

    logThat(newMember, {
      embed: {
        title: ":sparkles: JOINED",
        description: " <@" + newMember.id + "> joined voice channel `" + channelDB.voice.new.name + "`",
        color: 16755763,
        footer: {
          text: newMember.id
        },
        timestamp: new Date()
      }
    })
    ///////
  } else if (channelDB.voice.old) { //leave voice
    //COUNT
    var count = channelDB.voice.old.count;
    count--;
    pcdb.get("vcs").find({ channel: oldChannelID }).assign({ count: count }).write()
    ///////


    //CHANNEL Deleteion
    if (count <= 0) {
      const channelID = channelDB.voice.old.channel
      pcdb.get("vcs").remove({ channel: channelID }).write()
      client.channels.fetch(channelID).then(channel => {
        channel.delete().catch(console.error)
      }).catch(console.error)

      logThat(newMember, {
        embed: {
          title: ":boom: DELETED",
          description: "Voice channel `" + channelDB.voice.old.name + "` was deleted by <@" + oldMember.id + ">",
          color: 13319991,
          footer: {
            text: newMember.id
          },
          timestamp: new Date()
        }
      })
    } else { //if channel isnt deleted 
      logThat(newMember, {
        embed: {
          title: ":fire: LEFT",
          description: "<@" + newMember.id + "> has left `" + channelDB.voice.old.name + "`",
          color: 16005148,
          footer: {
            text: newMember.id
          },
          timestamp: new Date()
        }
      })
    }
  }

  //REQUEST CHANNEL
  if (newChannelID == newServerDoc.requestChannel) { //if the channel user joined is request channel
    pcdb.read()
    //sends message and creates request when user joins requestchannel
    pcdb.get("requests").push({ guild: newMember.guild.id, userId: newMember.id }).write()
    pcdb.get("server").find({ guildId: newMember.guild.id }).assign({ serverName: newMember.guild.name }).write()

    var settingsString = "";
    const settingsArray = ["voice", "text", "public", "visual"];
    const data = pcdb.get("settings").filter({ guild: newMember.guild.id }).value()[0]
    for (element of settingsArray) {
      if (data[element] === undefined) {
        pcdb.get("settings").find({ guild: newMember.guild.id }).assign({ [element]: true }).write()
      }
      if (data[element] == "enabled") {
        pcdb.get("settings").find({ guild: newMember.guild.id }).assign({ [element]: true }).write()
      } else if (data[element] == "disabled") {
        pcdb.get("settings").find({ guild: newMember.guild.id }).assign({ [element]: false }).write()
      }
    }
    for (element of settingsArray) {
      if (data[element]) {
        settingsString = settingsString + "\n:green_circle: - **" + element.toUpperCase() + "** channels - `enabled`"
      } else {
        settingsString = settingsString + "\n:red_circle: - **" + element.toUpperCase() + "** channels - `disabled`"
      }
    }

    client.users.cache.get(newMember.id).send({
      embed: {
        title: "CREATE | JOIN",
        description: "You can create/join voice and text channels, by using commands in this DM channel.",
        color: 7450820,
        fields: [
          {
            name: "SETTINGS",
            value: "These are the server settings of `" + newMember.guild.name + "`:" + settingsString
          },
          {
            name: "LINKS",
            value: ":globe_with_meridians: - [support server](" + links.server + ")\n:link: - [invite bot](" + links.invite + ")\n:arrow_up_small: - [vote](" + links.vote + ")\n:dollar: - [donate](" + links.dono + ")\n"
          },
          {
            name: "CONTROLS",
            value: ":ringed_planet: - Tutorial for creating/joining **voice channels**\n:evergreen_tree: - Tutorial for creating/joining **text channels**\n:link: - Tutorial for creating/joining **linked channels**\n:grey_question: - Info about the bot\n"
          }
        ],
        footer: {
          text: newMember.guild.name + " • " + newMember.guild.id
        }
      }
    }).then(myMessage => { //react with emoji
      myMessage.react(fn.emoji.get(emojis.hex.ringed_planet)).then(() => myMessage.react(fn.emoji.get(emojis.hex.evergreen_tree))).then(() => myMessage.react(fn.emoji.get(emojis.hex.evergreen_tree))).then(() => myMessage.react(fn.emoji.get(emojis.hex.link))).then(() => myMessage.react(fn.emoji.get(emojis.hex.grey_question))).catch(console.error)
    }).catch(error => logDmError(newMember.id, newMember.guild.id))



  } else if (oldChannelID == oldServerDoc.requestChannel) { //if the channel user left is request channel
    pcdb.get("requests").remove({ userId: oldMember.id }).write() //deletes request when user leaves request channel     
  }
})

async function logThat(member, embed) { // member, name, channelID
  var user;
  try {
    user = await client.users.fetch(member.id);
  } catch (error) {
    console.log(error)
  }
  if (!user) return fn.logging.post(client, member.guild.id, embed);
  embed.embed.description = embed.embed.description.replace("<user-name>", user.username);
  fn.logging.post(client, member.guild.id, embed);

}

async function logDmError(memberID, guildID) {
  fn.logging.post(client, guildID, {
    embed: {
      title: "DM MESSAGES DISABLED",
      description: "Cannot DM <@" + memberID + ">. Please notify him.",
      color: 16711739,
      footer: {
        text: memberID
      },
      timestamp: new Date()
    }
  })
}


client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message: ', error);
      return;
    }
  }
  pcdb.read();
  if (user.bot) return;
  hex = fn.hex.get(reaction.emoji.name)
  if (reaction.message.author.bot && reaction.message.author.id === client.user.id) {
    if (!reaction.message.guild) { // IF reaction is in dm channel
      if (reaction.message.embeds[0].title == "CREATE | JOIN") {
        switch (hex) {
          case emojis.hex.ringed_planet:
            editDmMessage(reaction.message, "voice")
            break;
          case emojis.hex.evergreen_tree:
            editDmMessage(reaction.message, "text")
            break;
          case emojis.hex.link:
            editDmMessage(reaction.message, "linked")
            break;
          case emojis.hex.grey_question:
            editDmMessage(reaction.message, "question")
            break;
        }
      }

    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message: ', error);
      return;
    }
  }
  pcdb.read();
  if (user.bot) return;
  hex = fn.hex.get(reaction.emoji.name)
  if (reaction.message.author.bot && reaction.message.author.id === client.user.id) {
    if (!reaction.message.guild) { // IF reaction is in dm channel
      if ([emojis.hex.ringed_planet, emojis.hex.evergreen_tree, emojis.hex.grey_question, emojis.hex.link].includes(hex)) editDmMessage(reaction.message, "create/join"); // like the back button 
    }
  }
});



client.on("guildDelete", function (guild) { //wipes guild from database when bot leaves#
  pcdb.read()
  databaseServerWipe(guild.id);
});


//METHODS


function databaseServerWipe(guildClearId) { //wipe every data of a server from database
  pcdb.read()
  pcdb.get("requests").remove({ guild: guildClearId }).write()
  pcdb.get("vcs").remove({ guild: guildClearId }).write()
  pcdb.get("tcs").remove({ guild: guildClearId }).write()
  pcdb.get("linked").remove({ guild: guildClearId }).write()
  pcdb.get("server").remove({ guildId: guildClearId }).write()
  pcdb.get("settings").remove({ guild: guildClearId }).write()
}




/*function dmClosed(user) {
  var server = pcdb.get("requests").filter({ userId: user }).map("guild").value()[0]
  var lastChan = pcdb.get("server").filter({ guildId: server }).map("lastChannel").value()[0]
  var chan = client.channels.cache.get(lastChan).catch(console.error);
  chan.send("<@" + user + "> Please **Allow Direct Messages** for the bot to function correctly").catch(() => {
    client.users.fetch(chan.guild.ownerID).then(owner => {
      owner.send("**VERY IMPORTANT!**\nGuild: `" + chan.guild.name + "`\nPlease use the command `::here` in a channel where everyone of your servermembers can type!")
    }).catch(console.error);
  })
}*/




async function editDmMessage(message, to) {
  pcdb.read()
  const rawGuildData = message.embeds[0].footer.text
  const guildData = rawGuildData.split(" • ");
  const guild = {
    name: guildData[0],
    id: guildData[1]
  }

  const settingsArray = ["voice", "text", "public", "visual"];
  const data = pcdb.get("settings").filter({ guild: guild.id }).value()[0]
  switch (to) {// to is into what it will be edited
    case "create/join":

      var settingsString = "";
      for (element of settingsArray) {
        if (data[element]) {
          settingsString = settingsString + "\n:green_circle: - **" + element.toUpperCase() + "** channels - `enabled`"
        } else {
          settingsString = settingsString + "\n:red_circle: - **" + element.toUpperCase() + "** channels - `disabled`"
        }
      }

      message.edit({
        embed: {
          title: "CREATE | JOIN",
          description: "You can create/join voice and text channels, by using commands in this DM channel.",
          color: 7450820,
          fields: [
            {
              name: "SETTINGS",
              value: "These are the server settings of `" + guild.name + "`:" + settingsString
            },
            {
              name: "LINKS",
              value: ":globe_with_meridians: - [support server](" + links.server + ")\n:link: - [invite bot](" + links.invite + ")\n:arrow_up_small: - [vote](" + links.vote + ")\n:dollar: - [donate](" + links.dono + ")\n"
            },
            {
              name: "CONTROLS",
              value: ":ringed_planet: - Tutorial for creating/joining **voice channels**\n:evergreen_tree: - Tutorial for creating/joining **text channels**\n:link: - Tutorial for creating/joining **linked channels**\n:grey_question: - Info about the bot\n"
            }
          ],
          footer: {
            text: rawGuildData
          }
        }
      }).then(myMessage => { //react with emoji
        myMessage.react(fn.emoji.get(emojis.hex.ringed_planet)).then(() => myMessage.react(fn.emoji.get(emojis.hex.evergreen_tree))).then(() => myMessage.react(fn.emoji.get(emojis.hex.evergreen_tree))).then(() => myMessage.react(fn.emoji.get(emojis.hex.grey_question))).catch(console.error)
      }).catch(console.error)
      break;
    case "voice":
      if (data.voice) {
        message.edit({
          embed: {
            title: ":ringed_planet: VOICE CHANNELS",
            description: "PIN PIN allows you to create public and private voice channels:",
            color: 15695112,
            fields: [
              { //Original text: To create or join a channel you use the __exact same command__:\n`voice <channel-name> <pin>`\n**Example:**\nBob wants to create a channel called 'awesome_channel' with the pin '12345'\nHe would have to type `voice awesome-channel`.\nCarla wants to join Bob's channel.\nShe would have to type the exact same command that Bob used: `voice awesome-channel 12345`.
                name: ":sparkles: CREATE & JOIN",
                value: "To create or join a channel you use the **exact same command**:\n`voice <channel-name> <pin>`\n**Example:**\n┌**Create:** `voice awesome-channel 12345` :lock:\n└**Join:** `voice awesome-channel 12345` :lock:\n\nTo **create a public channel** just leave out the pin: `voice cool-channel 12345` :unlock:"
              },
              {
                name: ":warning: IMPORTANT",
                value: "- Channel names can only contain **letters and numbers**\n- Names **cannot include spaces**\n- Names are **case sensitive**\n- PIN must be a **number & 4-6 characters** long."
              },
              {
                name: "CONTROLS",
                value: ":ringed_planet: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      } else {
        message.edit({
          embed: {
            title: ":no_entry: DISABLED",
            description: "Voice channels are `disabled` on `" + guild.name + "`\nContact a mod to resolve this issue",
            color: 12458289,
            fields: [
              {
                name: "CONTROLS",
                value: ":ringed_planet: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      }

      break;
    case "text":
      if (data.text) {
        message.edit({
          embed: {
            title: ":evergreen_tree: TEXT CHANNELS",
            description: "PIN PIN allows you to create private text channels:",
            color: 4092445,
            fields: [
              { //Original text: To create or join a channel you use the __exact same command__:\n`voice <channel-name> <pin>`\n**Example:**\nBob wants to create a channel called 'awesome_channel' with the pin '12345'\nHe would have to type `voice awesome-channel`.\nCarla wants to join Bob's channel.\nShe would have to type the exact same command that Bob used: `voice awesome-channel 12345`.
                name: ":leaves: CREATE & JOIN",
                value: "To create or join a channel you use the **exact same command**:\n`text <channel-name> <pin>`\n**Example:**\n┌**Create:** `text awesome-channel 12345` :lock:\n└**Join:** `text awesome-channel 12345` :lock:\n"
              },
              {
                name: ":warning: IMPORTANT",
                value: "- Channel names can only contain **letters and numbers**\n- Names **cannot include spaces**\n- Names are **case sensitive**\n- PIN must be a **number & 4-6 characters** long."
              },
              {
                name: "CONTROLS",
                value: ":evergreen_tree: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      } else {
        message.edit({
          embed: {
            title: ":no_entry: DISABLED",
            description: "Text channels are `disabled` on `" + guild.name + "`\nContact a mod to resolve this issue",
            color: 12458289,
            fields: [
              {
                name: "CONTROLS",
                value: ":evergreen_tree: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      }
      break;
    case "linked":
      if (data.text && data.voice) {
        message.edit({
          embed: {
            title: ":link: LINKED CHANNELS",
            description: "PIN PIN allows you to create private linked voice and text channels:",
            color: 8952230,
            fields: [
              { //Original text: To create or join a channel you use the __exact same command__:\n`voice <channel-name> <pin>`\n**Example:**\nBob wants to create a channel called 'awesome_channel' with the pin '12345'\nHe would have to type `voice awesome-channel`.\nCarla wants to join Bob's channel.\nShe would have to type the exact same command that Bob used: `voice awesome-channel 12345`.
                name: ":paperclip: CREATE & JOIN",
                value: "To create or join a channel you use the **exact same command**:\n`linked <channel-name> <pin>`\n**Example:**\n┌**Create:** `linked awesome-channel 12345` :lock:\n└**Join:** `linked awesome-channel 12345` :lock:\n"
              },
              {
                name: ":warning: IMPORTANT",
                value: "- Channel names can only contain **letters and numbers**\n- Names **cannot include spaces**\n- Names are **case sensitive**\n- PIN must be a **number & 4-6 characters** long."
              },
              {
                name: "CONTROLS",
                value: ":link: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      } else {
        message.edit({
          embed: {
            title: ":no_entry: DISABLED",
            description: "Linked channels are `disabled` on `" + guild.name + "`\nContact a mod to resolve this issue",
            color: 12458289,
            fields: [
              {
                name: "CONTROLS",
                value: ":link: - Back"
              }
            ],
            footer: {
              text: rawGuildData
            }
          }
        })
      }
      break;
    case "question":
      message.edit({
        embed: {
          title: ":grey_question: WHAT IS PIN PIN?",
          description: "PIN PIN is a bot that let's @everyone create private channels on a server.\nThe bot is online 24/7 and is actively updated.\nYou want to give feedback? Just click [here](" + links.server + ").\n",
          color: 13424349,
          fields: [
            {
              name: "CONTROLS",
              value: ":grey_question: - Back"
            }
          ],
          footer: {
            text: rawGuildData
          }
        }
      })
      break;
  }
  //if (to != "create/join") removeUserReaction(message, client.user.id)
}

async function removeUserReaction(message, userId) {
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
  try {
    for (const reaction of userReactions.values()) {
      await reaction.users.remove(userId);
    }
  } catch (error) {
    console.error('Failed to remove reactions.');
  }
}

async function linkedLeaveLog(guildID) {

}


client.login(config.token)