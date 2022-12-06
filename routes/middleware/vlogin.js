const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require("jsonwebtoken")

module.exports = async (req,res) => {
    const token = req.cookies.token
    if (!token) return
    let decoded;
    req.user = null
    try {
        decoded = jwt.verify(token, process.env.JWT_KEY);
    } catch (e) {
        if (e) {
            res.clearCookie('token', { path: '/' })
        }
    }
    let data = await prisma.user.findFirst({
        where: {
            id: parseInt(decoded.id)
        },
        include: {
            profile: true
        }
    }).catch((e) => {
        console.log(e)
    })
    if (data) {
        data.password = null
        req.user = data
    }
    return;
}