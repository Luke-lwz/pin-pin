const { linkSync } = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

const links = require("./links.json")
const emojis = require("./emojis.json")


const functions = {
    channel: {
        reset: async function (guild) {

            pcdb.read()
            const data = pcdb.get("server").filter({ guildId: guild.id }).value()[0]
            const requestChannel = guild.channels.cache.find(c => c.id == data.requestChannel)
            if (requestChannel) { //deletion of request channel
                requestChannel.delete();
            }
            const logChannel = guild.channels.cache.find(c => c.id == data.log)
            if (logChannel) { //deletion of log channel
                logChannel.delete();
            }
            const tcs = pcdb.get("tcs").filter({ guild: guild.id }).map("channel").value()
            for (id of tcs) { // deletion of all tcs
                const channel = guild.channels.cache.find(c => c.id == id)
                if (channel) {
                    channel.delete();
                }
            }
            const vcs = pcdb.get("vcs").filter({ guild: guild.id }).map("channel").value()
            for (id of vcs) { //deletion of all vcs
                const channel = guild.channels.cache.find(c => c.id == id)
                if (channel) {
                    channel.delete();
                }
            }
            const linked = pcdb.get("linked").filter({ guild: guild.id }).value()
            for (ids of linked) { //ddeletionn of all linked channels 
                const vc = guild.channels.cache.find(c => c.id == ids.vc)
                const tc = guild.channels.cache.find(c => c.id == ids.tc)
                if (vc) {
                    vc.delete();
                }
                if (tc) {
                    tc.delete();
                }
            }
            const category = guild.channels.cache.find(c => c.id == data.category)
            if (category) { //deletion fo category
                category.delete();
            }
            return null;
        },
        check: {
            name: function (name) {
                if (name.length > 20) {

                    return {
                        title: ":x: - INPUT ERROR",
                        description: "`[NAME] is too long (max. 20 characters)`",
                        color: 14370633
                    }

                } else if (name.length < 2) {

                    return {
                        title: ":x: - INPUT ERROR",
                        description: "`[NAME] is too short (min. 4 characters)`",
                        color: 14370633
                    }

                } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {

                    return {
                        title: ":x: - INPUT ERROR",
                        description: "`[NAME] can only contain letters and numbers`",
                        color: 14370633
                    }

                } else {
                    return null
                }
            },
            pin: function (pin) {
                if (!/^[0-9]+$/.test(pin)) {
                    return {
                        title: ":x: - INPUT ERROR",
                        description: "`[PIN] can only contain numbers`",
                        color: 14370633
                    }

                } else if (pin.length < 4 || pin.length > 6) {
                    return {
                        title: ":x: - INPUT ERROR",
                        description: "The PIN needs to be `4-6` characters long",
                        color: 14370633
                    }

                } else {
                    return null;
                }
            },
            vcs: async function (client) {
                pcdb.read()
                const data = {
                    voice: pcdb.get("vcs").value(),
                    linked: pcdb.get("linked").value()
                }
                for (channel of data.voice) {
                    pcdb.read()
                    client.channels.fetch(channel.channel).catch(error => {
                        pcdb.get("vcs").remove({ channel: channel.channel }).write();
                    })
                }
                for (channels of data.linked) {
                    pcdb.read()
                    client.channels.fetch(channels.vc).catch(error => {
                        pcdb.get("linked").remove({ vc: channels.vc }).write();
                    })
                }
            },
            request: async function (client) {
                pcdb.read();
                const data = pcdb.get("server").value()
                for (server of data) {
                    pcdb.read();
                    client.channels.fetch(server.category).then(() => requestChannelCreate(client, server)).catch(error => {
                        client.guilds.fetch(server.guildId).then(guild => {
                            guild.channels.create("PIN PIN - Channels", { type: "category", reason: 'Setup' }).then(result => {
                                pcdb.get("server").find({ guildId: server.guildId }).assign({ category: result.id }).write()
                                server.category = result.id;
                                requestChannelCreate(client, server, guild)
                            })
                        })

                    })

                }
                async function requestChannelCreate(client, server, guild) {
                    pcdb.read()
                    if (!guild) guild = await client.guilds.fetch(server.guildId);
                    if (!guild) return null;
                    client.channels.fetch(server.requestChannel).catch(error => {
                        guild.channels.create(functions.emoji.get(emojis.hex.plus) + " create/join", { type: "voice", reason: 'Setup', parent: server.category, permissionOverwrites: [{ id: guild.id, deny: ['SPEAK'] }] }).then(result => {
                            pcdb.get("server").find({ guildId: server.guildId }).assign({ requestChannel: result.id }).write()
                        })
                    })
                    functions.logging.get(client, guild.id);
                }
            }
        },
        text: {
            cooldown: {

                check: async function (client, moment) {
                    pcdb.read()
                    const data = pcdb.get("tcs").value();
                    if (!data) return;//if data is undefined return
                    for (const i of data) { //checks the cooldown in the database for every channel
                        cooldown = parseInt(i.cooldown)
                        if (cooldown + 30 * 60 < moment().format("X")) {
                            functions.channel.get(client, i.channel).then(channel => {
                                channel.delete().then(() => {
                                    client.users.fetch(i.host).then(user => {
                                        user.send({
                                            embed: {
                                                title: ":alarm_clock: Channel timeout",
                                                description: "Your channel `" + i.name + "` in `" + pcdb.get("server").filter({ guildId: i.guild }).map("serverName").value()[0] + "` was deleted after 30 minutes of inactivity",
                                                color: 14495300

                                            }
                                        });
                                        functions.logging.post(client, i.guild, {//logging post
                                            embed: {
                                                title: ":alarm_clock: CHANNEL TIMED OUT",
                                                description: "Channel `" + i.name + "` by <@" + i.host + "> timed out.",
                                                color: 14495300,
                                                footer: {
                                                    text: i.host
                                                },
                                                timestamp: new Date()
                                            }
                                        })
                                    }).catch(console.error)
                                }).catch(() => {
                                    channel.send({
                                        embed: {
                                            title: ":x: - ERROR",
                                            description: "Channel couldn't be deleted but it was removed from our database (no one can join anymore)",
                                            color: 14370633
                                        }
                                    }).catch(console.error)
                                })
                            }).catch(console.error)
                            pcdb.get("tcs").remove({ host: i.host, channel: i.channel }).write()
                        } else if (cooldown + 27 * 60 < moment().format("X") && cooldown + 28 * 60 > moment().format("X")) {
                            functions.channel.get(client, i.channel).then(channel => {
                                channel.send("> This channel will close itself in `3` minutes due to inactivity")
                            }).catch(console.error)
                        }
                    }

                },
                reset: async function (channel, moment) {
                    pcdb.read()
                    pcdb.get("tcs").find({channel: channel}).assign({ cooldown: moment().format("X") }).write();
                },
                lastMessage(client, channel, cooldown) {
                    if (!channel) return false;
                    channel.messages.fetch({ limit: 1 }).then(messages => {
                        let lastMessage = messages.first();
                        
                        if (!lastMessage.author.bot) {
                          // The author of the last message wasn't a bot
                        }
                      })
                      .catch(console.error);
                }
            },
            count: {
                up: function () {

                },
                down: function () {

                },
                check: function () {

                }
            }
        },
        get: async function (client, channelID) {
            const channel = await client.channels.fetch(channelID);
            return channel;
        }
    },
    logging: {
        get: async function (client, guildID) {
            pcdb.read()
            const data = pcdb.get("server").filter({ guildId: guildID }).value()[0]
            if (!data) return null; //If data is undefined return
            var guild;
            try {
                guild = await client.guilds.fetch(guildID)
            } catch { }
            if (!guild) return null;
            if (!data.log) return functions.logging.create(client, guild, data)
            var fetchedChannel;
            try {
                fetchedChannel = await client.channels.fetch(data.log)
            } catch { }
            const cachedChannel = guild.channels.cache.find(c => c.id == data.log)
            if (!fetchedChannel && !cachedChannel) { //if it couldnt find the channel anywhere return and create channel

                const channel = await functions.logging.create(client, guild, data)
                return channel

                //return (channel ? channel : null) // if channel is not has value then return it else return null

            } else if (!fetchedChannel) {
                return cachedChannel;
            } else return fetchedChannel;
        },
        create: async function (client, guild, data) {
            pcdb.read()
            var newChannel;
            try {
                newChannel = await guild.channels.create(functions.emoji.get(emojis.hex.memo) + "-channel-log", { type: "text", reason: 'Setup', parent: data.category, permissionOverwrites: [{ id: guild.id, deny: ["VIEW_CHANNEL"] }, { id: client.user.id, allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'] }] })
            } catch {
                return null;
            }
            pcdb.get("server").find({ guildId: guild.id }).assign({ log: newChannel.id }).write()
            newChannel.send({
                embed: {
                    title: "CHANNEL LOG",
                    description: ":warning: Do **not delete** this channel! Error Messages will be sent here.",
                    color: 7450820,
                    fields: [
                        {
                            name: "What's this channel?",
                            value: "- Everytime someone **creates / deletes / joins / leaves** a channel, it will be recorded here.\n\n- It is reccomended to mute this channel"
                        }
                    ]
                }
            }).then(myMessage => { myMessage.pin(); }).catch(error => console.error)
            return newChannel
        },
        post: async function (client, guildID, embed) {
            const channel = await functions.logging.get(client, guildID);
            if (!channel) return null;
            channel.send(embed)
        }
    },


    emoji: {
        get: function (hex) {
            if (hex === null || hex === undefined || !functions.hex.check(hex)) return null;
            var emoji = String.fromCodePoint("0x" + hex);
            return emoji
        },
        check: function (str) {
            var ranges = [
                '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])' // U+1F680 to U+1F6FF
            ];
            if (str.match(ranges.join('|'))) {
                return true;
            } else {
                return false;
            }
        }
    },
    hex: {
        get: function (emoji) {
            if (emoji === null || emoji === undefined || !functions.emoji.check(emoji)) return null;
            var hex = emoji.codePointAt(0).toString(16)
            return hex;
        },
        check: function (h) {
            var a = parseInt(h, 16);
            return (a.toString(16) === h.toLowerCase())
        }
    },
    permissions: {
        self: {
            check: function (guild, permsArray, plusAdmin, serverName) { //guild needs to be fetched before
                var missingPerms = ""
                if (plusAdmin) {
                    if (!guild.me.hasPermission("ADMINISTRATOR")) {
                        missingPerms = missingPerms + "\n`ADMINISTRATOR (needed for text channels)`";
                    }
                } else {
                    for (perm of permsArray) {
                        if (!guild.me.hasPermission(perm)) {
                            missingPerms = missingPerms + "\n`" + perm + "`";
                        }
                    }
                }

                if (missingPerms.length == 0) return null;
                else {
                    var pleaseContact = "\n\n- Please contact a mod or the owner"
                    if (serverName) pleaseContact = pleaseContact + " of `" + serverName + "`"
                    const missingPermsEmbed = {
                        title: ":no_entry: MISSING PERMISSIONS",
                        description: "The Bot is missing the following permission(s):" + missingPerms + pleaseContact,
                        color: 12458289
                    }
                    return missingPermsEmbed;
                }
            }
        }
    },
    error: {
        send: function (error, client, guildID, data) {
            const channel = functions.logging.get(client, guildID)
            if (!channel) console.log(error)
            const originArray = [
                "channel-fetch",
                "guild-fetch",
                "user-fetch"
            ]
            const errorEmbed = {
                title: ":no_entry: ERROR",
                description: errorDescription[data.origin] + "\nCheck if the bot has all the needed permissions or visit our [support server](" + links.server + ")"
            }
            channel.send({ embed: errorEmbed }).catch(console.error)
        }
    },
    transform: {
        name: function (name, type) {
            const lowerName = name.toLowerCase()
            var namePlus;
            if (checkInput(name, ["lofi", "music", "disco", "dance", "party", "dj"])) {
                namePlus = functions.emoji.get(emojis.hex.musical_note) + "-" + name;
            } else if (checkInput(name, ["game", "gaming", "valo", "league", "fifa", "among", "splatoon", "mario", "tetris", "overwatch", "fortnite", "genshin", "spellbreak", "warcraft", "satisfactory", "minecraft", "gta", "halo", "apex", "assassin", "creed", "cyberpunk", "hitman", "rocket", "witcher", "cod", "pokemon", "battlefield", "lol"])) {
                namePlus = functions.emoji.get(emojis.hex.controller) + "-" + name;
            } else if (checkInput(name, ["stud", "work", "math", "eng", "science", "bio", "chem", "phy", "geo", "politics", "school", "sports", "homework"])) {
                namePlus = functions.emoji.get(emojis.hex.books) + "-" + name;
            } else if (checkInput(name, ["movie", "film", "cinema", "kino", "camera", "avengers", "wars", "transformers", "netflix", "disney", "prime"])) {
                namePlus = functions.emoji.get(emojis.hex.movie_camera) + "-" + name;
            } else {
                switch (type) {
                    case "text":
                        namePlus = functions.emoji.get(emojis.hex.evergreen_tree) + "-" + name;
                        break;
                    case "voice":
                        namePlus = functions.emoji.get(emojis.hex.ringed_planet) + "-" + name;
                        break;
                    case "linked":
                        namePlus = functions.emoji.get(emojis.hex.link) + "-" + name;
                        break;
                }
            }
            return namePlus;
            function checkInput(input, words) {
                return words.some(word => input.toLowerCase().includes(word.toLowerCase()));
            }
        }
    },
    array: {
        rnd: function (max) {
            min = 0;
            max = max - 1;
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;

        }
    }
}

module.exports = functions;