//module
require("dotenv").config()
const fastify = require('fastify')({ logger: false })
const port = process.env.PORT
const path = require("path")

//plugins
fastify.register(require('@fastify/cookie'), {
    secret: process.env.COOKIEKEY,
    parseOptions: {}
})
fastify.register(require("fastify-file-upload"), {
    limits: {
      fileSize: 1024 * 1024 * 3
    }
})
// fastify.register(require("fastify-sse-v2"))
// fastify.register(require('@fastify/cors'), {
//     origin: "*",
//     methods: [
//       "GET",
//       "POST"
//     ],
//     credentials: true,
//     // preflight: true
//   })

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'src/assets'),
    prefix: '/assets/',
    decorateReply: false
})
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/',
    decorateReply: false
})

fastify.register(require("@fastify/view"), {
    engine: {
        ejs: require("ejs"),
    },
    root: path.join(__dirname, "src/page"),
});

setTimeout(() => {
    require("./routes/index")(fastify)
    //start service
    fastify.listen({ port: port, host: "0.0.0.0" }).then(() => {
        console.info("[Logs] Server has Ready on port " + port + "!")
    })
}, 2000);