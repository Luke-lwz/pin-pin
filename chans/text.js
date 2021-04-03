const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)



const fn = require("../data/functions.js")
const functions = fn

const emojis = require("../data/emojis.json")


module.exports = {
    name: "text",
    description: "",
    execute(client, prefix, message, command, args, links, perms, moment) {

        pcdb.read()
        if (args.length < 1) return message.channel.send("Usage: `" + command + " <channel-name> <channel-pin>`\nExample: `" + command + " awesome-channel 12345`");
        var name = args[0]

        var guildID = pcdb.get("requests").filter({ userId: message.author.id }).map("guild").value()[0]
        var serverName = pcdb.get("server").filter({ guildId: guildID }).map("serverName").value()[0]
        var categoryID = pcdb.get("server").filter({ guildId: guildID }).map("category").value()[0]



        if (pcdb.get("requests").filter({ userId: message.author.id }).map("guild").value()[0] == undefined) { //checks for request from user in db
            message.author.send({
                embed: {
                    title: ":unicorn: - MISSING REQUEST",
                    description: "I couldn't find you in any request channel. Join one and try again!\nRequest channels are usually named: `" + fn.emoji.get(emojis.hex.plus) + " create/join`",
                    color: 9189274
                }
            })
            return;
        }

        //Checks if bot has every permission
        client.guilds.fetch(guildID).then(guild => {
            if (!pcdb.get("settings").filter({ guild: guildID }).map("text").value()[0]) return message.channel.send({ // if text channels are disabled return
                embed: {
                    title: ":no_entry: DISABLED",
                    description: "Text channels are `disabled` on `" + guild.name + "`\nContact a mod to resolve this issue",
                    color: 12458289
                }
            })
            var permsCheck = fn.permissions.self.check(guild, perms, true, guild.name)
            if (permsCheck !== null) { message.author.send({ embed: permsCheck }).catch(console.error); return; }
            ////////////////////////////////////
            var pin = args[1]
            const data = pcdb.get("tcs").filter({ guild: guildID, name: name }).value()[0];

            if (data) { // if channel is in db of server (join)

                if (args.length > 2 || args.length < 1) return; //if args is not between 1 and 2 return;
                if (data.pin == "public") { //checks if channel is public then sends embed then returns
                    message.author.send({
                        embed: {
                            title: ":unlock: PUBLIC CHANNEL",
                            description: "`'" + name + "'` is a public text channel you can see it on the server!",
                            color: 16755763
                        }
                    })
                    return;
                }
                if (args.length == 1) { //... if args.length is 1 send
                    message.author.send({
                        embed: {
                            title: ":x: MISSING PIN",
                            description: "`'" + name + "'` is a private text channel so it needs a PIN",
                            color: 14370633
                        }
                    })
                    return;
                }
                if (pin !== data.pin) {
                    message.author.send({
                        embed: {
                            title: ":key: WRONG PIN",
                            description: "The entered PIN for the text channel `" + name + "` is wrong.\nPlease try again.",
                            color: 12675407
                        }
                    })
                    return;
                }
                // Channel join belongs here
                client.channels.fetch(data.channel).then(channel => {
                    joining()
                    function joining() {
                        channel.updateOverwrite(message.author, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'EMBED_LINKS': true, 'ATTACH_FILES': true, 'READ_MESSAGE_HISTORY': true }).then(() => {
                            message.author.send({
                                embed: {
                                    title: ":leaves: JOINED",
                                    description: "You joined <#" + data.channel + ">, hosted by <@" + data.host + ">",
                                    color: 10933128
                                }
                            })
                            channel.send({
                                embed: {
                                    description: ":leaves: <@" + message.author.id + "> joined",
                                    color: 10933128
                                }
                            })
                            fn.logging.post(client, guildID, {//logging post
                                embed: {
                                    title: ":leaves: JOINED",
                                    description: "<@" + message.author.id + "> joined text channel `" + name + "` | <#" + data.channel + ">",
                                    color: 10933128,
                                    footer: {
                                        text: message.author.id
                                    },
                                    timestamp: new Date()
                                }
                            })
                        }).catch(() => message.author.send("> There was an error adding you to the channel.\n> Contact mods or the server owner and ask them to give the bot all required permissions")) //
                    }
                }).catch(error => { message.author.send("> There was an error adding you to the channel.\n> Contact mods or the server owner and ask them to give the bot all required permissions lol"); console.log(error) })


            } else { //(create)
                const namePlus = fn.transform.name(name, "text");
                const allChannels = pcdb.get("tcs").filter({ host: message.author.id }).value()
                if (allChannels.length >= 5) {
                    message.channel.send({
                        embed: {
                            title: ":bouquet: ALREADY HOSTING",
                            description: "You already created `5` text channels!\nThat's the maximum for now.",
                            color: 16429616
                        }
                    })
                    return;
                } else {
                    creating()
                }
                function creating() {
                    //check if name and pin are valid
                    
                    var nameCheck = fn.channel.check.name(name)
                    if (nameCheck !== null) { message.author.send({ embed: nameCheck }); return; }

                    if (args.length == 2) { //Private
                        var pinCheck = fn.channel.check.pin(pin)
                        if (pinCheck !== null) { message.author.send({ embed: pinCheck }); return; }
                        /////////////////////////////////

                        const createdEmbed = {
                            title: ":lock: - Created your private text channel!",
                            description: "Invite all of your friends, or don't it's your channel!",
                            color: 3128888,
                            fields: [
                                {
                                    name: "NAME",
                                    value: "`" + name + "`",
                                    inline: true
                                },
                                {
                                    name: "PIN",
                                    value: "`" + args[1] + "`",
                                    inline: true
                                },
                                {
                                    name: "Copy this to your friends so they can join:",
                                    value: "`text " + name + " " + args[1] + "`"
                                }
                            ]
                        }

                        const errorCreationEmbed = {
                            description: ":x: - There was an error creating your channel\n\nPIN PIN needs the `ADMINISTRATOR` permission to create private text channels",
                            color: 14370633
                        }

                        // channel creation
                        client.guilds.fetch(guildID).then(guild => {
                            guild.channels.create(namePlus, { type: "text", parent: categoryID, reason: 'Created private channel on user request', permissionOverwrites: [{ id: guildID, deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'] }, { id: client.user.id, allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'] }, { id: message.author.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'] }] }).then(result => { //creates invisible channel
                                pcdb.read()
                                result.setTopic("Commands: __**leave, kick, data, pin**__ • Host: <@" + message.author.id + "> • PIN: **" + pin + "** • This channel will be deleted after **30 min** of inactivity!")
                                result.send({
                                    embed:
                                    {
                                        title: ":evergreen_tree: CHANNEL INFO",
                                        description: "This channel will delete itself after 30 minutes of inactivity",
                                        color: 4092445,
                                        fields: [
                                            {
                                                name: "HOST",
                                                value: "<@" + message.author.id + ">",
                                                inline: true
                                            },
                                            {
                                                name: "NAME",
                                                value: "`" + name + "`",
                                                inline: true
                                            },
                                            {
                                                name: "PIN",
                                                value: "||" + args[1] + "||",
                                                inline: true
                                            },
                                            {
                                                name: "COMMANDS",
                                                value: "`" + prefix + "leave`\n`" + prefix + "kick`\n`" + prefix + "data`\n`" + prefix + "pin`",
                                                inline: true
                                            }
                                        ]
                                    }
                                }).then(myMessage => myMessage.pin()).catch(console.error)
                                pcdb.read()
                                pcdb.get("tcs").push({ guild: guildID, channel: result.id, host: message.author.id, name: name, pin: pin, cooldown: moment().format("X") }).write(); //adds channel to db
                                message.author.send({
                                    embed:
                                    {
                                        title: ":evergreen_tree: Created your private text channel",
                                        description: "Invite all of your friends, or don't it's your channel!",
                                        color: 4092445,
                                        fields: [
                                            {
                                                name: "CHANNEL",
                                                value: "<#" + result.id + ">",
                                                inline: true
                                            },
                                            {
                                                name: "NAME",
                                                value: "`" + name + "`",
                                                inline: true
                                            },
                                            {
                                                name: "PIN",
                                                value: "`" + args[1] + "`",
                                                inline: true
                                            },
                                            {
                                                name: "Copy this to your friends so they can join:",
                                                value: "`text " + name + " " + args[1] + "`"
                                            }
                                        ]
                                    }
                                })
                                fn.logging.post(client, guildID, {//logging post
                                    embed: {
                                        title: ":evergreen_tree: CREATED",
                                        description: "<@" + message.author.id + "> created private text channel `" + name + "` :lock:",
                                        color: 4092445,
                                        fields: [
                                            {
                                                name: "CHANNEL",
                                                value: "<#" + result.id + ">",
                                                inline: true
                                            },
                                            {
                                                name: "NAME",
                                                value: "`" + name + "`",
                                                inline: true
                                            },
                                            {
                                                name: "PIN",
                                                value: "||" + args[1] + "||",
                                                inline: true
                                            }
                                        ],
                                        footer: {
                                            text: message.author.id
                                        },
                                        timestamp: new Date()
                                    }
                                })
                            }).catch(error => { message.author.send({ embed: errorCreationEmbed }), console.log(error) });
                            return;
                        })

                    } else if (args.length == 1) { //Public 
                        message.author.send("> Public text channels are currently under develpment")
                        /*if (pcdb.get("settings").filter({ guild: guildID }).map("public").value()[0] == "disabled") { //checks if public channels are disabled on this server
                            message.author.send({
                                embed: {
                                    title: ":x: - Input Error",
                                    description: ":warning: - Public channels are disabled in `'" + serverName + "'`\n\nYou need to add `[PIN]` to your command to create a private channel!",
                                    color: 14370633
                                }
                            })
                            return;
                        }*/
                        // channel creation belongs here
                    }
                }

            }
        })
    }
}