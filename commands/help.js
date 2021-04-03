const { linkSync } = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const invite = require('./invite');
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "help",
    description: "",
    execute(client, prefix, command, message, args, links, version) {
        pcdb.read()
        message.channel.send({
            embed: {
                title: ":information_source: INFO",
                description: "PIN PIN lets @everyone create and join password secured, custom named **voice and text channels.**\nFor additional information about me, type `" + prefix + "info`",
                color: 3901635,
                fields: [
                    {
                        name: ":ballot_box_with_check: SETUP",
                        value: "- To setup, use `" + prefix + "setup`\n-Then join the voice channel I just created (You can even rename the channel)\n- After that check out `" + prefix + "commands` and `" + prefix + "settings`"
                    },
                    {
                        name: ":diamond_shape_with_a_dot_inside: USAGE",
                        value: "- Have DM's open\n- Join the 'request' channel and follow the tutorial the Bot sent you!"
                    },
                    {
                        name: ":blue_heart: SUPPORT",
                        value: "If you want to report a bug, give feedback, join our developer team or if there are any questions left unanswered, just join the [support server](" + links.server + ")"
                    },
                    {
                        name: ":link: INVITE",
                        value: "Invite [me](" + links.invite + ")"
                    },
                    {
                        name: ":arrow_up: UPDATE",
                        value: "PIN PIN just got it's latest update (`" + version + "`) and arriving with it, are features like text channels and linked channels.\nAlso PIN PIN had a huge redesign with a more intuitive tutorial and UI.\nTo see all the Patch-Notes, just join our [server](" + links.server + ")\n- Enjoy"
                    }
                ]

            }
        })
    }
}