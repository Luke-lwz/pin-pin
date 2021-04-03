const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

const fn = require("../data/functions.js")
const functions = fn

const emojis = require("../data/emojis.json")


module.exports = {
    name: "voice",
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
                    title: ":unicorn: MISSING REQUEST",
                    description: "I couldn't find you in any request channel. Join one and try again!\nRequest channels are usually named: `" + fn.emoji.get(emojis.hex.plus) + " create/join`",
                    color: 9189274
                }
            })
            return;
        }

        //Checks if bot has every permission
        client.guilds.fetch(guildID).then(guild => {
            if (!pcdb.get("settings").filter({ guild: guildID }).map("text").value()[0]) return message.channel.send({ //if voice channels are disabled on the server
                embed: {
                    title: ":no_entry: DISABLED",
                    description: "Voice channels are `disabled` on `" + guild.name + "`\nContact a mod to resolve this issue",
                    color: 12458289
                }
            })

            var permsCheck = fn.permissions.self.check(guild, perms, false, guild.name)
            if (permsCheck !== null) { message.author.send({ embed: permsCheck }).catch(console.error); return; }
            ////////////////////////////////////

            var pin = args[1]
            const data = pcdb.get("vcs").filter({ guild: guildID, name: name }).value()[0];

            if (data) { // if channel is in db of server (join)

                if (args.length > 2 || args.length < 1) return; //if args is not between 1 and 2 return;
                if (data.pin == "public") { //checks if channel is public then sends embed then returns
                    message.author.send({
                        embed: {
                            title: ":unlock: PUBLIC CHANNEL",
                            description: "`'" + name + "'` is a public voice channel just join it on the server!",
                            color: 16755763
                        }
                    })
                    return;
                }
                if (args.length == 1) { //... if args.length is 1 send
                    message.author.send({
                        embed: {
                            title: ":x: - MISSING PIN",
                            description: "`'" + name + "'` is a private voice channel so it needs a PIN",
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
                //Check if user voted
                joining()

                async function joining() {
                    client.guilds.fetch(guildID).then(guild => {
                        guild.member(message.author.id).voice.setChannel(data.channel).then(() => {// move user to private channel
                            message.author.send({
                                embed: {
                                    title: ":sparkles: JOINED",
                                    description: "You joined `" + name + "`",
                                    color: 16755763
                                }
                            })
                            /*fn.logging.post(client, guildID, { //logging post
                                embed: {
                                    title: ":sparkles: JOINED",
                                    description: "<@" + message.author.id + "> joined voice channel `" + name + "`",
                                    color: 16755763,
                                    footer: {
                                        text: message.author.id
                                    },
                                    timestamp: new Date()
                                }
                            })*/
                        }).catch(error => { message.author.send("> There was an error adding you to the channel.\n> The channel you want to join might be deleted"); console.log(error) });
                    }).catch(error => { message.author.send("> There was an error adding you to the channel.\n> Contact mods or the server owner and ask them to give the bot all required permissions"); console.log(error) });
                }




            } else { //(create)
                const namePlus = fn.transform.name(name, "voice");
                //check if name and pin are valid
                nameCheck = fn.channel.check.name(name)
                if (nameCheck !== null) { message.author.send({ embed: nameCheck }); return; }

                if (args.length == 2) { //Private
                    pinCheck = fn.channel.check.pin(pin)
                    if (pinCheck !== null) { message.author.send({ embed: pinCheck }); return; }
                    /////////////////////////////////

                    const createdEmbed = {
                        title: ":ringed_planet: Created your private voice channel",
                        description: "Invite all of your friends, or don't it's your channel!",
                        color: 15695112,
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
                                value: "`voice " + name + " " + args[1] + "`"
                            }
                        ]
                    }

                    const errorCreationEmbed = {
                        description: ":x: - There was an error creating your channel",
                        color: 14370633
                    }
                    client.guilds.fetch(guildID).then(guild => {
                        if (!pcdb.get("settings").filter({ guild: guildID }).map("visual").value()[0]) { //checks if setting "visual" is turned off
                            guild.channels.create(namePlus, { type: "voice", parent: categoryID, reason: 'Created private channel on user request', permissionOverwrites: [{ id: guildID, deny: ['CONNECT', 'VIEW_CHANNEL'], allow: ['SPEAK'] }, { id: client.user.id, allow: ['MOVE_MEMBERS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'CONNECT'] }] }).then(result => { //creates invisible channel
                                pcdb.read()
                                pcdb.get("vcs").push({ guild: guildID, channel: result.id, name: name, pin: args[1], count: 0 }).write(); //adds channel to db
                                guild.member(message.author.id).voice.setChannel(result.id); //moves member
                                message.author.send({ embed: createdEmbed })
                                fn.logging.post(client, guildID, {//logging post
                                    embed: {
                                        title: ":ringed_planet: CREATED",
                                        description: "<@" + message.author.id + "> created private voice channel: `" + name + "` :lock:",
                                        color: 15695112,
                                        fields: [
                                            {
                                                name: "NAME",
                                                value: "`" + name + "`",
                                                inline: true
                                            },
                                            {
                                                name: "PIN",
                                                value: "||" + pin + "||",
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

                        } else { //checks if setting "visual" is turned off
                            guild.channels.create(namePlus, { type: "voice", parent: categoryID, reason: 'Created private channel on user request', permissionOverwrites: [{ id: guildID, deny: ['CONNECT'], allow: ['SPEAK'] }, { id: client.user.id, allow: ['MOVE_MEMBERS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'CONNECT'] }] }).then(result => { //creates invisible channel
                                pcdb.read()
                                pcdb.get("vcs").push({ guild: guildID, channel: result.id, name: name, pin: args[1], count: 0 }).write(); //adds channel to db
                                guild.member(message.author.id).voice.setChannel(result.id); //moves member
                                message.author.send({ embed: createdEmbed })
                                fn.logging.post(client, guildID, {//logging post
                                    embed: {
                                        title: ":ringed_planet: CREATED",
                                        description: "<@" + message.author.id + "> created private voice channel: `" + name + "` :lock:",
                                        color: 15695112,
                                        fields: [
                                            {
                                                name: "NAME",
                                                value: "`" + name + "`",
                                                inline: true
                                            },
                                            {
                                                name: "PIN",
                                                value: "||" + pin + "||",
                                                inline: true
                                            }
                                        ],
                                        footer: {
                                            text: message.author.id
                                        },
                                        timestamp: new Date()
                                    }
                                })
                            }).catch(error => { message.author.send({ embed: errorCreationEmbed }), console.log(error) }); //message.author.send({ embed: errorCreationEmbed })

                        }
                    })
                } else if (args.length == 1) { //Public 
                    if (pcdb.get("settings").filter({ guild: guildID }).map("public").value()[0] == "disabled") { //checks if public channels are disabled on this server
                        message.author.send({
                            embed: {
                                title: ":x: - Input Error",
                                description: ":warning: - Public channels are disabled in `'" + serverName + "'`\n\nYou need to add `[PIN]` to your command to create a private channel!",
                                color: 14370633
                            }
                        })
                        return;
                    }
                    //create public channel
                    client.guilds.fetch(guildID).then(guild => {
                        guild.channels.create(namePlus, { type: "voice", parent: categoryID, reason: 'Created public channel on user request' }).then(result => { //channel create
                            pcdb.read()
                            pcdb.get("vcs").push({ guild: guildID, channel: result.id, name: name, pin: "public", count: 0 }).write(); //push in db
                            guild.member(message.author.id).voice.setChannel(result.id); //moves member
                            message.author.send({
                                embed: {
                                    title: ":ringed_planet: Created a public channel!",
                                    description: "Now everyone can join!",
                                    color: 15695112,
                                    fields: [
                                        {
                                            name: "NAME",
                                            value: "`" + name + "`",
                                            inline: true
                                        },
                                        {
                                            name: "PIN",
                                            value: "`none`",
                                            inline: true
                                        }
                                    ]
                                }
                            })
                            fn.logging.post(client, guildID, { //logging post
                                embed: {
                                    title: ":ringed_planet: CREATED",
                                    description: "<@" + message.author.id + "> created public voice channel: `" + name + "` :unlock:",
                                    color: 15695112,
                                    fields: [
                                        {
                                            name: "NAME",
                                            value: "`" + name + "`",
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

                    }).catch(console.error);
                }
            }
        })


    }
}