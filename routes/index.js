const fs = require("fs")
const path = require("path")

module.exports = (fastify) => {
    const file = fs.readdirSync(path.join(__dirname, 'api/' + "v1"))

    file.forEach(e => {
        let endpoint = e.replace(".js", "")
        console.info("Loaded: " + "api/" + "v1" + "/" + endpoint)
        fastify.register(require("./api/v1/" + e), { prefix: 'api/' + "v1" + '/' + endpoint });
    })
    fastify.register(require("./render"), { prefix: '/' });
}