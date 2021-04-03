const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "info",
    description: "infos zu server und commands",
    execute(version, client, prefix, command, message, args, links) {
        pcdb.read()
        //if (args[0] == undefined) {
        client.users.fetch('462630374028214311').then(me => {
            message.channel.send({
                "embed": {
                    "title": ":information_source: INFO",
                    "color": 16645629,
                    "fields": [
                        {
                            "name": "VERSION",
                            "value": "`" + version + "`⠀⠀",
                            "inline": true
                        },
                        {
                            "name": "SUPPORT",
                            "value": "[Discord Server](" + links.server + ")⠀⠀",
                            "inline": true
                        },
                        {
                            "name": "INVITE",
                            "value": "[Me](" + links.invite + ")",
                            "inline": true
                        },
                        {
                            "name": "SERVERS",
                            "value": "`" + client.guilds.cache.size + "`⠀⠀",
                            "inline": true
                        },
                        {
                            "name": "VOTE",
                            "value": "[here](" + links.vote + ")⠀⠀",
                            "inline": true
                        },
                        {
                            "name": "BOT CREATOR",
                            "value": "[Lukas Lunkwitz](https://linktr.ee/Luggas)\n⤷" + me.username + "#" + me.discriminator,
                            "inline": true
                        }/*,
                            {
                                "name": ":scroll: Command usage",
                                "value": "```ml\n" + prefix + "info [COMMAND]```⠀⤷Example `" + prefix + "info setup`\n⠀⤷Example `" + prefix + "info settings visual`"
                            },*/
                    ]
                }
            });
        });
        /*} else {
            if (args[0].toLowerCase() == "setup") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "`" + prefix + args[0] + "` is used to setup your server. Without setting up the bot won't work!",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "reset") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "`" + prefix + args[0] + "` is used to reset your server to before setup! (In case of any error)",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "settings") {
                if (args[1] == undefined) {
                    message.channel.send({
                        "embed": {
                            "title": ":information_source: INFO",
                            "description": "`" + prefix + args[0] + "` is used to customize 'PIN PIN' to your likings",
                            "color": 16645629
                        }
                    });
                } else if (args[1].toLowerCase() == "public") {
                    message.channel.send({
                        "embed": {
                            "title": ":information_source: INFO",
                            "description": "`" + prefix + args[0] + "⠀" + args[1] + "` is used to allow or deny the creation of public channels on your server!",
                            "color": 16645629
                        }
                    });
                } else if (args[1].toLowerCase() == "visual") {
                    message.channel.send({
                        "embed": {
                            "title": ":information_source: INFO",
                            "description": "`" + prefix + args[0] + "⠀" + args[1] + "` is used to toggle the visibility of private channels on your server! (Does **not** work with public channels)",
                            "color": 16645629
                        }
                    });
                } else if (args[1].toLowerCase() == "default") {
                    message.channel.send({
                        "embed": {
                            "title": ":information_source: INFO",
                            "description": "`" + prefix + args[0] + "⠀" + args[1] + "` reverts all settings back to default!\n\n⤷:green_circle: `Public` - `enabled`\n⤷:green_circle: `Visual` - `enabled`",
                            "color": 16645629
                        }
                    });
                } else {
                    message.channel.send({
                        "embed": {
                            "title": ":information_source: INFO",
                            "description": ":x: - The setting `" + args[1] + "` doesn't exist!",
                            "color": 16645629
                        }
                    });
                }
            } else if (args[0].toLowerCase() == "create") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "By using `" + prefix + args[0] + "` users can create their own private or public channels! (only works in DMs)",
                        "color": 16645629
                    }
                });

            } else if (args[0].toLowerCase() == "join") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "By using `" + prefix + args[0] + "` users can join public channels created by other users! (only works in DMs)",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "commands" || args[0].toLowerCase() == "command" || args[0].toLowerCase() == "cmd") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "By using `" + prefix + args[0] + "` you'll get a list of all the commands!",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "info") {
                message.channel.send("haha you a smart one are ya? :))")
            } else if (args[0].toLowerCase() == "help") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "I'll be your helping hand :hand_splayed:",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "donate") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "Use `" + prefix + args[0] + "` if you are interested in supporting " + client.user.username + " and many more bots like this to come :heart:",
                        "color": 16645629
                    }
                });
            } else if (args[0].toLowerCase() == "dev") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "Use `" + prefix + args[0] + "` to get infos about my creator, Luke",
                        "color": 16645629
                    }
                })
            } else if (args[0].toLowerCase() == "vote") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "With`" + prefix + args[0] + "` you can support me through [voting](" + links.vote + ") on [top.gg](" + links.vote + ")",
                        "color": 16645629
                    }
                })
            } else if (args[0].toLowerCase() == "privacy") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "`" + prefix + args[0] + "` will show you what data we store in our Database!",
                        "color": 16645629
                    }
                })
            } else if (args[0].toLowerCase() == "invite") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "`" + prefix + args[0] + "` Is used to [invite](" + links.invite + ") me to your server!",
                        "color": 16645629
                    }
                })
            } else if (args[0].toLowerCase() == "last_channel") {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": "The ID of the channel where the last PIN PIN command was sent gets saved in our database.\nThis is used to notfy people who disabled their DM's (DM's need to be enabled for the bot to work correctly!).\nMake sure to use the command `" + prefix + "here` in a channel where everyone in your server can see the messages to set a different channel!",
                        "color": 16645629
                    }
                })
            } else {
                message.channel.send({
                    "embed": {
                        "title": ":information_source: INFO",
                        "description": ":x: - The command `" + prefix + args[0] + "` doesn't exist!",
                        "color": 16645629
                    }
                });
            }
        }*/
    }
}