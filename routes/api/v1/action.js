const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const vlogin = require("../../middleware/vlogin")
module.exports = (fastify, opts, done) => {
    
    fastify.post("/like", { preHandler: [vlogin]}, async (req,res) => {
        if(!req.body) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body
        let count;
        let isLike = false
        
        let like = await prisma.like.findFirst({
            where: {
                userId: req.user.id,
                postId: parseInt(data.postId)
            }
        }).catch(e => {
            console.log(e)
        })

        let findPost = await prisma.post.findFirst({
            where: {
                id: parseInt(data.postId)
            }
        }).catch(e => {
            console.log(e)
            return { msg: "ผิดพลาดไม่พบโพสนี้", code: 0, count: count??0, isLike } 
        })

        if(!like) {
            await prisma.like.create({
                data: {
                    userId: req.user.id,
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับฐานข้อมูล", code: 0 })
            })
            count = await prisma.like.count({
                where: {
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
            })

            if(findPost.authorId !== req.user.id){
                await prisma.notify.create({
                    data: {
                        toId: findPost.authorId,
                        fromId: req.user.id,
                        content: findPost.content??"รูปภาพ",
                        uniqueData: req.user.id+"_"+findPost.id+"_like",
                        title: "ชื่นชอบโพสนี้",
                        type: 1,
                        actionId: parseInt(findPost.id)
                    },
                }).catch(e => {
                    console.log(e)
                    return res.send({ msg: "พบปัญหาการส่งการแจ้งเตือน", code: 0 })
                })
            }
            isLike = true
        }else {
            await prisma.like.deleteMany({
                where: {
                    userId: req.user.id,
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับฐานข้อมูล", code: 0 })
            })
            count = await prisma.like.count({
                where: {
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
            })

            if(findPost.authorId !== req.user.id){
                await prisma.notify.delete({
                    where: {
                        uniqueData: req.user.id+"_"+findPost.id+"_like",
                    }
                }).catch(e => {
                    console.log(e)
                })
            }
        }

        return { msg: "สำเร็จ", code: 1, count: count??0, isLike }
    })

    fastify.post("/repost", { preHandler: [vlogin]}, async (req,res) => {
        if(!req.body) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body

        let count;
        let isRepost = false;

        let repost = await prisma.repost.findFirst({
            where: {
                userId: req.user.id,
                postId: parseInt(data.postId)
            }
        }).catch(e => {
            console.log(e)
        })

        let findPost = await prisma.post.findFirst({
            where: {
                id: parseInt(data.postId)
            }
        }).catch(e => {
            console.log(e)
            return { msg: "ผิดพลาดไม่พบโพสนี้", code: 0, count: count??0, isLike } 
        })

        if(!repost){
            await prisma.repost.create({
                data: {
                    userId: req.user.id,
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับฐานข้อมูล", code: 0 })
            })
            count = await prisma.repost.count({
                where: {
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
            })
            

            if(findPost.authorId !== req.user.id){
                await prisma.notify.create({
                    data: {
                        toId: findPost.authorId,
                        fromId: req.user.id,
                        content: findPost.content??"รูปภาพ",
                        uniqueData: req.user.id+"_"+findPost.id+"_repost",
                        title: "รีโพสของคุณ!",
                        type: 2,
                        actionId: parseInt(findPost.id)
                    },
                }).catch(e => {
                    console.log(e)
                    return res.send({ msg: "พบปัญหาการส่งการแจ้งเตือน", code: 0 })
                })
            }
            isRepost = true
        }else {
            await prisma.repost.deleteMany({
                where: {
                    userId: req.user.id,
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับฐานข้อมูล", code: 0 })
            })
            count = await prisma.repost.count({
                where: {
                    postId: parseInt(data.postId)
                }
            }).catch(e => {
                console.log(e)
            })

            
            if(findPost.authorId !== req.user.id){
                await prisma.notify.delete({
                    where: {
                        uniqueData: req.user.id+"_"+findPost.id+"_repost",
                    }
                }).catch(e => {
                    console.log(e)
                })
            }
        }

        return { msg: "สำเร็จ", code: 1, count: count??0, isRepost }
    })

    fastify.post("/follow", { preHandler: [vlogin]}, async (req,res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบก่อน", code: 0 })
        let targetId = req.body.targetId
        if (!targetId || isNaN(parseInt(targetId))) return res.send({ msg: "ไม่พบผู้ใช้นี้!", code: 0 })
        if(targetId === req.user.id) return res.send({ msg: "กดติดตามตัวเองทำไม!", code: 0 })
        let follow = await prisma.follower.findFirst({
            where: {
                userId: parseInt(targetId),
                followerId: req.user.id
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (2)", code: 0 })
        })

        if(follow) {
            await prisma.following.deleteMany({
                where: {
                    followId:parseInt(targetId),
                    userId: req.user.id,
                }
            }).then(async () => {
                await prisma.follower.delete({
                    where: {
                        id: follow.id
                    }
                }).then(async () => {

                    await prisma.notify.delete({
                        where: {
                            uniqueData: req.user.id+"_"+parseInt(targetId)+"_follow"
                        },
                    }).then(() => {
                        return res.send({ msg: "ถอนการติดตามแล้ว", code: 1, isFollow: false })
                    }).catch(e => {
                        console.log(e)
                    })
                }).catch(e => {
                    console.log(e)
                    return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (4)", code: 0 })
                })
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (3)", code: 0 })
            })
        }else {
            await prisma.following.create({
                data: {
                    userId: req.user.id,
                    followId: parseInt(targetId)
                }
            }).then(async() => {
                await prisma.follower.create({
                    data: {
                        userId: parseInt(targetId),
                        followerId: req.user.id
                    }
                }).then(async () => {

                    await prisma.notify.create({
                        data: {
                            toId: parseInt(targetId),
                            fromId: req.user.id,
                            uniqueData: req.user.id+"_"+parseInt(targetId)+"_follow",
                            title: "ได้ติดตามคุณแล้ว!",
                            type: 3,
                            actionId: parseInt(targetId)
                        },
                    }).then(() => {
                        return res.send({ msg: "ติดตามแล้ว", code: 1, isFollow: true })
                    }).catch(e => {
                        console.log(e)
                        return res.send({ msg: "พบปัญหาการส่งการแจ้งเตือน", code: 0 })
                    })

                }).catch(e => {
                    console.log(e)
                    return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (6)", code: 0 })
                })

            }).catch(e => {
                console.log(e)
                return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (5)", code: 0 })
            })
        }
    })

    done()
}