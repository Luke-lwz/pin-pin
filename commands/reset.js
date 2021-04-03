const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

const fn = require("../data/functions.js")

module.exports = {
    name: "reset",
    description: "resets db",
    execute(client, prefix, command, message, args) {
        pcdb.read()
        if (!message.member.hasPermission('MANAGE_CHANNELS')) { //checks for admin permissions of message author reset
            message.channel.send({
                "embed": {
                    "title": "PERMISSION ERROR",
                    "description": "`@" + message.author.username + ", you don't have enough permissions to use '" + prefix + command + "'`",
                    "color": 14370633
                }
            })
            return;
        }
        if (pcdb.get("server").filter({ guildId: message.guild.id }).value()[0] == undefined) { //checks for guild in db
            message.channel.send({
                "embed": {
                    "title": "NOT YET SETUP",
                    "description": "Looks like `'" + message.guild.name + "'` doesn't exist within my database or has already been reset.\n- Use `" + prefix + "setup` to setup PIN PIN.",
                    "color": 15711325
                }
            })
            databaseServerWipe(message.guild.id)//calls fuction that deletes guild form database
            return;
        }
        if (args.length != 1) { // if arguments are missing send this
            message.channel.send({
                "embed": {
                    "title": ":orange_circle: - SECURITY STEP",
                    "description": "To reset your server, use this exact command:\n`" + prefix + "reset " + message.guild.id.substring(0, 4) + "`",
                    "color": 16027660
                }
            })
            return;
        }
        if (args[0] != message.guild.id.substring(0, 4)) { //if arguments is wrong
            message.channel.send({
                "embed": {
                    "title": ":x: - INPUT ERROR:",
                    "description": "Please use `" + prefix + "reset " + message.guild.id.substring(0, 4) + "` to remove your server from my database!",
                    "color": 14370633
                }
            })
            return;
        }
        fn.channel.reset(message.guild).then(() => databaseServerWipe(message.guild.id)).catch(error => databaseServerWipe(message.guild.id))
        /*setTimeout(() => {
            databaseServerWipe(message.guild.id)//calls fuction that deletes guild form database
        }, 60000)*/
        /*const sendChannel = message.guild.channels.cache.find(c => c.id == message.channel.id)
        if (sendChannel) { //deletion of request channsel
            message.channel.send({
                "embed": {
                    "title": ":boom: Server is reset :boom:",
                    "description": ":negative_squared_cross_mark: - `'" + message.guild.name + "'` has been completely removed from my database!\n\n:warning: - Do note that channels created by users aren't removed on your server, please delete the remaining channels!\n⤷(The feature of deleting user channels will be added soon)",
                    "color": 3128888,
                    "footer": {
                        "text": "Thank you for using me :)"
                    }
                }
            }).catch(console.error)
        }*/
        message.channel.send({
            embed: {
                title: "RESET",
                description: "`" + message.guild.name + "` has been completely removed from my database.\n- Thanks for having used PIN PIN.",
                color: 2927205
            }
        }).catch(console.error)
        function databaseServerWipe(guildClearId) { //wipe every data of a server from database
            pcdb.read()
            pcdb.get("requests").remove({ guild: guildClearId }).write()
            pcdb.get("vcs").remove({ guild: guildClearId }).write()
            pcdb.get("tcs").remove({ guild: guildClearId }).write()
            pcdb.get("linked").remove({ guild: guildClearId }).write()
            pcdb.get("server").remove({ guildId: guildClearId }).write()
            pcdb.get("settings").remove({ guild: guildClearId }).write()
        }
    }
}