const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

const fn = require("../data/functions.js")
const functions = fn

const emojis = require("../data/emojis.json")

module.exports = {
    name: "linked",
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
            const settings = pcdb.get("settings").filter({ guild: guildID }).value()[0]
            if (!settings.text || !settings.voice) return message.channel.send({ //if voice channels are disabled on the server
                embed: {
                    title: ":no_entry: DISABLED",
                    description: "Linked channels `disabled` on `" + guild.name + "`, because not every channel type is enabled.\nContact a mod to resolve this issue",
                    color: 12458289
                }
            })

            var permsCheck = fn.permissions.self.check(guild, perms, true, guild.name)
            if (permsCheck !== null) { message.author.send({ embed: permsCheck }).catch(console.error); return; }
            ////////////////////////////////////

            var pin = args[1]
            const data = pcdb.get("linked").filter({ guild: guildID, name: name }).value()[0];

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
                            description: "`'" + name + "'` are private linked channels. They require a PIN",
                            color: 14370633
                        }
                    })
                    return;
                }
                if (pin !== data.pin) {
                    message.author.send({
                        embed: {
                            title: ":key: WRONG PIN",
                            description: "The entered PIN for the linked channels `" + name + "` is wrong.\nPlease try again.",
                            color: 12675407
                        }
                    })
                    return;
                }

                joining()

                async function joining() {
                    client.guilds.fetch(guildID).then(guild => {
                        guild.member(message.author.id).voice.setChannel(data.vc).then(() => {// move user to private channel
                            message.author.send({
                                embed: {
                                    title: ":paperclip: JOINED",
                                    description: "You joined <#" + data.tc + ">",
                                    color: 11647423
                                }
                            })
                        }).catch(error => { message.author.send("> There was an error adding you to the channel.\n> The channel you want to join might be deleted"); console.log(error) });
                    }).catch(error => { message.author.send("> There was an error adding you to the channel.\n> Contact mods or the server owner and ask them to give the bot all required permissions"); console.log(error) });
                }//JOIN here


            } else { //(create)
                //check if name and pin are valid
                nameCheck = fn.channel.check.name(name)
                if (nameCheck !== null) { message.author.send({ embed: nameCheck }); return; }

                if (args.length == 2) { //Private
                    pinCheck = fn.channel.check.pin(pin)
                    if (pinCheck !== null) { message.author.send({ embed: pinCheck }); return; }
                    /////////////////////////////////


                    create()//CREATE here

                    async function create() {
                        const namePlus = fn.transform.name(name, "linked")
                        guild.channels.create(namePlus, { type: "text", parent: categoryID, reason: 'Created private channel on user request', permissionOverwrites: [{ id: guildID, deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'] }, { id: client.user.id, allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'] }, { id: message.author.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'] }] }).then(tc => { //text channel create
                            //make voice channel creation here
                            guild.channels.create(namePlus, { type: "voice", parent: categoryID, reason: 'Created private channel on user request', permissionOverwrites: [{ id: guildID, deny: ['CONNECT', 'VIEW_CHANNEL'], allow: ['SPEAK'] }, { id: client.user.id, allow: ['MOVE_MEMBERS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'CONNECT'] }] }).then(vc => { //creates invisible channel
                                creationComplete(tc, vc)
                                guild.member(message.author.id).voice.setChannel(vc.id); //moves member
                            }).catch(error => { tc.delete(); error() });





                            //text chan stuff
                            pcdb.read()
                            tc.setTopic("Linked channel created by: <@" + message.author.id + "> • PIN: **" + pin + "** • This channel will be deleted after everyone has left the linked voice channel!")
                            tc.send({
                                embed:
                                {
                                    title: ":link: CHANNEL INFO",
                                    description: "This is a linked channel it will be deleted after everyone has left the linked voice channel!",
                                    color: 8952230,
                                    fields: [
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
                                    ]
                                }
                            }).then(myMessage => myMessage.pin()).catch(console.error)

                        }).catch(error => { console.log(error); error() })

                        function error() {
                            message.author.send({
                                embed: {
                                    title: "ERROR",
                                    description: "There was an error creating both linked channels. Please try again",
                                    color: 12458289
                                }
                            })
                            return null
                        }
                    }
                    async function creationComplete(text, voice) {
                        pcdb.read()
                        pcdb.get("linked").push({ guild: guildID, tc: text.id, vc: voice.id, name: name, pin: pin, count: 0 }).write()
                        message.author.send({
                            embed: {
                                title: ":link: CREATED",
                                description: "Created linked voice and text channels. They will be deleted after everyone has left the voice channel.",
                                color: 8952230,
                                fields: [
                                    {
                                        name: "CHANNEL",
                                        value: "<#" + text.id + ">",
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
                                    }
                                ]
                            }
                        })
                        fn.logging.post(client, guildID, { //logging post
                            embed: {
                                title: ":link: CREATED",
                                description: "<@" + message.author.id + "> created linked channels: `" + name + "`",
                                color: 8952230,
                                fields: [
                                    {
                                        name: "CHANNEL",
                                        value: "<#" + text.id + ">",
                                        inline: true
                                    },
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
                        const channels = {
                            text: text,
                            voice: voice
                        }
                        return channels;
                    }
                } else if (args.length == 1) { //Public 
                    message.channel.send({
                        embed: {
                            title: ":x: - MISSING PIN",
                            description: "You cannot create public linked channels. Please add a PIN",
                            color: 14370633
                        }
                    })
                }
            }
        })

    }
}