module.exports = (fastify, opts, done) => {
    fastify.get("/", (req,res) => {
        res.view("index")
    })
    fastify.get("/auth/login", (req,res) => {
        res.view("login")
    })
    fastify.get("/auth/register", (req,res) => {
        res.view("register")
    })
    fastify.get("/auth/verify", (req,res) => {
        res.view("verify")
    })
    fastify.get("/auth/recovery", (req,res) => {
        res.view("recovery")
    })
    fastify.get("/status", (req,res) => {
        res.view("status")
    })
    fastify.get("/user", (req,res) => {
        res.view("user")
    })
    fastify.get("/notify", (req,res) => {
        res.view("notify")
    })
    fastify.get('/logout', (req, res) => {
        res.clearCookie('token', { path: '/' })
        res.redirect("/auth/login")
    })
    done()
}