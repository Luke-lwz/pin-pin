const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "invite",
    description: "",
    execute(client, prefix, command, message, args, links) {
        pcdb.read()
        message.channel.send({
            "embed": {
                "title": ":white_heart: INVITE",
                "description": "Invite me to your server [here](" + links.invite + ")",
                "color": 16645629
            }
        })
    }
}