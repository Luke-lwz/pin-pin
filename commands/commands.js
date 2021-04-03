const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "commands",
    description: "a list of all avaliable commands",
    execute(client, prefix, command, message, args) {
        pcdb.read()
        message.channel.send({
            "embed": {
                "title": ":desktop: COMMANDS",
                "description": "Here are all my available commands!",
                "color": 2105893,
                "fields": {
                    "name": "Commands:",
                    "value": "```ini\n" + prefix + "setup      [Channel Manager]\n" + prefix + "reset      [Channel Manager]\n" + prefix + "settings   [Channel Manager]\n" + prefix + "info       [Everyone]\n" + prefix + "help       [Everyone]\n" + prefix + "commands   [Everyone]\n" + prefix + "donate     [Everyone]\n" + prefix + "dev        [Everyone]\n" + prefix + "invite     [Everyone]\n" + prefix + "vote       [Everyone]\n" + prefix + "privacy    [Everyone]```"
                }/*,
                "footer": {
                    "text": "- for a detailed description of every command just use " + prefix + "info"
                }*/
            }
        })
    }
}