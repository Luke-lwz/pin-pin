const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "settings",
    description: "settings of server",
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
        if (pcdb.get("server").find({ guildId: message.guild.id }).value() == undefined) { //check if guild doesn't exist in db
            message.channel.send({
                "embed": {
                    "title": "NOT YET SETUP",
                    "description": "Looks like `'" + message.guild.name + "'` doesn't exist within my database or has already been reset.\n- Use `" + prefix + "setup` to setup PIN PIN.",
                    "color": 15711325
                }
            })
            return;
        }
        var settingsString = "";
        const settingsArray = ["voice", "text", "public", "visual"];
        const data = pcdb.get("settings").filter({ guild: message.guild.id }).value()[0]
        for (element of settingsArray) {
            if (data[element] === undefined) {
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ [element]: true }).write()
            }
            if (data[element] == "enabled") {
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ [element]: true }).write()
            } else if (data[element] == "disabled") {
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ [element]: false }).write()
            }
        }
        if (args.length == 0) { //if user just wants settings displayed
            for (element of settingsArray) {
                if (data[element]) {
                    settingsString = settingsString + "\n:green_circle: - **" + element.toUpperCase() + "** - `enabled`"
                } else {
                    settingsString = settingsString + "\n:red_circle: - **" + element.toUpperCase() + "** - `disabled`"
                }
            }
            message.channel.send({
                embed: {
                    title: ":gear: SETTINGS",
                    description: "These are the current settings of `" + message.guild.name + "`:" + settingsString + "\n⠀",
                    color: 6714751,
                    fields: [
                        {
                            name: ":scroll: USAGE",
                            value: "Toggle different settings with this command:\n`settings <setting-name>`\n⤷Example`" + prefix + "settings public`\n⠀"
                        },
                        {
                            name: ":information_source: INFO",
                            value: "`" + prefix + "settings default` can be used to reset all settings to default"
                        }
                    ]
                }
            })
        }/* else if (args.length > 1) {
            message.channel.send({
                embed: {
                    title: ":exploding_head: Too many inputs",
                    description: ":gear: - Toggle settings by using this command: `" + prefix + "settings [setting]`",
                    color: 6714751
                }
            })
        }*/ else /*if (args.length == 1)*/ {
            if (args[0].toLowerCase() == "default") {
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ voice: true, text: true, public: true, visual: true }).write() //sets public in db to enabled
                message.channel.send({
                    embed: {
                        title: ":gear: SETTINGS",
                        description: "The settings in `" + message.guild.name + "` have been reset to default:\n:green_circle: - VOICE - enabled\n:green_circle: - TEXT - enabled\n:green_circle: - PUBLIC - enabled\n:green_circle: - VISUAL - enabled",
                        color: 6714751
                    }
                })
            } else if (settingsArray.includes(args[0].toLowerCase())) {
                //if (["enable", "true", "yes", "activate", "disable", "false", "no", "deactivate"].includes(args[1])) {} //A BIG MAYBE
                if (data[args[0]]) {
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ [args[0].toLowerCase()]: false }).write()
                    message.channel.send({
                        embed: {
                            title: ":gear: SETTINGS",
                            description: ":red_circle: - **" + args[0].toUpperCase() + " CHANNELS** are now `disabled` in your server",
                            color: 6714751
                        }
                    })
                } else {
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ [args[0].toLowerCase()]: true }).write()
                    message.channel.send({
                        embed: {
                            title: ":gear: SETTINGS",
                            description: ":green_circle: - **" + args[0].toUpperCase() + " CHANNELS** are now `enabled` in your server",
                            color: 6714751
                        }
                    })
                }
            } else {
                message.channel.send({
                    embed: {
                        title: ":gear: SETTINGS",
                        description: "Setting `" + args[0] + "` does not exist!",
                        color: 6714751
                    }
                })
            }
        }
        /*var publicState = pcdb.get("settings").filter({ guild: message.guild.id }).map("public").value(); //sets var to enabled or disabled based on db (in array)
        var visualState = pcdb.get("settings").filter({ guild: message.guild.id }).map("visual").value(); //sets var to enabled or disabled based on db (in array)
        var publicStateEmoji = ":green_circle:" //sets var to green circle emoji
        var visualStateEmoji = ":green_circle:" //sets var to green circle emoji
        var serverNameDBID = pcdb.get("server").filter({ guildId: message.guild.id }).map("serverName").value()[0] //sets var to name of server

        if (pcdb.get("settings").filter({ guild: message.guild.id }).map("public").value() == "disabled") { //check if setting is disabled and set emoji var to red circle
            publicStateEmoji = ":red_circle:"
        }
        if (pcdb.get("settings").filter({ guild: message.guild.id }).map("visual").value() == "disabled") { //check if setting is disabled and set emoji var to red circle
            visualStateEmoji = ":red_circle:"
        }

        if (args.length == 0) {
            message.channel.send({
                "embed": {
                    "title": ":gear: Settings",
                    "description": "These are the current settings of `'" + serverNameDBID + "'`:",
                    "color": 6714751,
                    "fields": [
                        {
                            "name": "Setting",
                            "value": publicStateEmoji + " `Public` - `" + publicState + "`\n" + visualStateEmoji + " `Visual` - `" + visualState + "`",
                            "inline": true
                        },
                        {
                            "name": "Description",
                            "value": "→ `When enabled users can create public channels`\n→ `When disabled created channels won't be visible`\n⠀",
                            "inline": true
                        },
                        {
                            "name": ":scroll: Usage",
                            "value": "Toggle different settings with this command:\n```ml\nsettings[SETTING]```⤷Example\n`" + prefix + "settings public`\n⠀"
                        },
                        {
                            "name": ":information_source: Info",
                            "value": "`" + prefix + "settings default` can be used to reset all settings to default\n`" + prefix + "info` lets you see information on different settings"
                        }
                    ],
                    "footer": {
                        "text": "- btw every created channel will sync its permissions to the category!"
                    }
                }
            })
            return;
        }
        if (args.length > 1) {
            message.channel.send({
                "embed": {
                    "title": ":exploding_head: Too many inputs",
                    "description": ":gear: - Toggle settings by using this command: `" + prefix + "settings [setting]`",
                    "color": 6714751
                }
            })
        } else if (args.length == 1) {
            if (args[0].toLowerCase() == "public") {
                if (publicState[0] == "enabled") { // if public is enabled set it to disabled and send
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ public: "disabled" }).write()
                    message.channel.send({
                        "embed": {
                            "title": ":gear: Settings",
                            "description": ":red_circle: - Public channels are now `disabled` in your server",
                            "color": 6714751
                        }
                    })
                } else { //if public is disabled set it to enabled and send
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ public: "enabled" }).write()
                    message.channel.send({
                        "embed": {
                            "title": ":gear: Settings",
                            "description": ":green_circle: Public channels are now `enabled` in your server",
                            "color": 6714751
                        }
                    })
                }
            } else if (args[0].toLowerCase() == "visual" || args[0].toLowerCase() == "visible") {
                if (visualState[0] == "enabled") { // if public is enabled set it to disabled and send
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ visual: "disabled" }).write()
                    message.channel.send({
                        "embed": {
                            "title": ":gear: Settings",
                            "description": ":red_circle: - Channel visibility is now `disabled` in your server",
                            "color": 6714751,
                            "footer": {
                                "text": "- Every created channel will sync its permissions to the category! (Except the request channel)"
                            }
                        }
                    })
                } else { //if public is disabled set it to enabled and send
                    pcdb.get("settings").find({ guild: message.guild.id }).assign({ visual: "enabled" }).write()
                    message.channel.send({
                        "embed": {
                            "title": ":gear: Settings",
                            "description": ":green_circle: Channel visibility is now `enabled` in your server",
                            "color": 6714751
                        }
                    })
                }
            } else if (args[0].toLowerCase() == "default") {
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ public: "enabled" }).write() //sets public in db to enabled
                pcdb.get("settings").find({ guild: message.guild.id }).assign({ visual: "enabled" }).write() //sets visual in db to enabled
                message.channel.send({
                    "embed": {
                        "title": ":gear: Settings",
                        "description": ":negative_squared_cross_mark: - The settings in `'" + message.guild.name + "'` have been reset to default!\n⠀",
                        "color": 6714751,
                        "fields": [
                            {
                                "name": "Newly reset settings",
                                "value": ":green_circle: `Public` - `enabled`\n:green_circle: `Visual` - `enabled`",
                                "inline": true
                            }
                        ]
                    }
                })
            } else { //if setting doesn't exist
                message.channel.send({
                    "embed": {
                        "title": ":gear: Settings",
                        "description": ":warning: - Setting doesn't exist!",
                        "color": 6714751,
                        "footer": {
                            "text": "To see a full list of settings type '" + prefix + "settings'"
                        }
                    }
                })
            }
        }*/
    }
}