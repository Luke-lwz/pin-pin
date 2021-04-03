const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

const fn = require("../data/functions.js")
const functions = fn

const emojis = require("../data/emojis.json")

module.exports = {
    name: "setup",
    description: "Sets the server up",
    execute(client, prefix, command, message, args) {
        pcdb.read()
        if (!message.member.hasPermission('MANAGE_CHANNELS')) { //checks for admin permissions of message author
            message.channel.send({
                "embed": {
                    "title": "PERMISSION ERROR",
                    "description": "`@" + message.author.username + ", you don't have enough permissions to use '" + prefix + command + "'`",
                    "color": 14370633
                }
            })
            return;
        }

        if (pcdb.get("server").size().value() >= 20) return message.channel.send("Max setup guilds 20!");


        const newGuild = message.guild.id; //set Guild id

        if (pcdb.get("server").find({ guildId: newGuild }).value() != undefined) { //check if guild exists in db
            message.channel.send({
                embed: {
                    title: "ALREADY SETUP",
                    description: "`" + message.guild.name + "` has already been setup.\nYou can always use `" + prefix + "reset` to delete your server from the database and re-setup.",
                    color: 15711325
                }
            })
        } else {

            //new Category
            message.guild.channels.create("PIN PIN - Channels", { type: "category", reason: 'Setup', permissionOverwrites: [{ id: client.user.id, allow: ['MOVE_MEMBERS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'CONNECT'] }] }).then(result => {
                var resultId = result.id
                pcdb.get("server").push({ guildId: newGuild, serverName: message.guild.name, category: resultId, requestChannel: "", log: "" }).write() //push values in for guild
                pcdb.get("settings").push({ guild: newGuild, voice: true, text: true, public: true, visual: true }).write() //push settings for guild

                var guildDBCat = pcdb.get("server").filter({ guildId: newGuild }).map("category").value()[0]



                //new requestVC
                message.guild.channels.create(fn.emoji.get(emojis.hex.plus) + " create/join", { type: "voice", reason: 'Setup', parent: guildDBCat, permissionOverwrites: [{ id: message.guild.id, deny: ['SPEAK'] }] }).then(result => {
                    var resultId = result.id

                    pcdb.get("server").filter({ guildId: newGuild }).find({ requestChannel: "" }).assign({ requestChannel: resultId }).write();

                    message.guild.channels.create(fn.emoji.get(emojis.hex.memo) + "-channel-log", { type: "text", reason: 'Setup', parent: guildDBCat, permissionOverwrites: [{ id: message.guild.id, deny: ["VIEW_CHANNEL"] }, { id: message.author.id, allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'] }, { id: client.user.id, allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'] }] }).then(resultTxt => {
                        pcdb.read()
                        pcdb.get("server").find({guildId: newGuild}).assign({log: resultTxt.id}).write()

                        resultTxt.send({embed: {
                            title: "CHANNEL LOG",
                            description: ":warning: Do **not delete** this channel! Error Messages will be sent here.",
                            color: 7450820,
                            fields: [
                                {
                                    name: "What's this channel?",
                                    value: "- Everytime someone **creates / deletes / joins / leaves** a channel, it will be recorded here.\n\n- It is reccomended to mute this channel"
                                }
                            ]
                        }}).then(myMessage => myMessage.pin()).catch(console.error)

                        message.channel.send({
                            embed: {
                                title: "ALL SETUP",
                                description: "- I completed setting up your server.\n- just join the channel I created (`" + result.name + "`) and enjoy.",
                                color: 2927205,
                                footer: {
                                    text: "Also try '" + prefix + "help' for more options and commands!"
                                }
                            }
                        })
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(() => {
                message.channel.send(":x: - Error! I couldn't create any channels. I need the permission `Manage Channels` to work correctly!");
            })




        }
    }
}