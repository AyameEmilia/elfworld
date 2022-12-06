const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require("fs")
const path = require("path")

const vlogin = require("../../middleware/vlogin")
module.exports = (fastify, opts, done) => {

    fastify.post("/", { preHandler: [vlogin] }, async (req, res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body
        if (!data.content && !data.uploadimg) return res.send({ msg: "คุณไม่สามารถโพสว่างเปล่าได้!", code: 0 })
        if (data.uploadimg) {
            if (data.uploadimg.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
            if(!data.uploadimg.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
            try {
                data.uploadimg.mv(`./public/img/post/${data.uploadimg.md5+"_"+req.user.id+"_"+data.uploadimg.name}`)
            } catch (error) {
                return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
            }
        }


        let temppost = await prisma.post.create({
            data: {
                published: data.published === "0" ? true : false,
                content: data.content,
                authorId: req.user.id,
                img: data.uploadimg ? "/public/img/post/" + data.uploadimg.md5+"_"+req.user.id+"_"+data.uploadimg.name : null
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profile: {
                            select: {
                                displayName: true
                            }
                        }
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            if(e?.meta?.colmn_name === "content") return res.send({ msg: "ไม่สามารถโพสยาวเกิน 500 ตัวอักษรได้!", code: 0 })
            return res.send({ msg: "Server เกิดปัญหากรุณาติดต่อผู้ดูแล", code: 0 })
        })

        console.log("[Logs] Requset -> post:", temppost)
        return res.send({ msg: "โพสสำเร็จแล้ว!", temp: temppost, code: 1 })
    })

    fastify.post("/comment", { preHandler: [vlogin]}, async (req,res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body
        if (!data && !data.comment && !data.uploadimg) return res.send({ msg: "คุณไม่สามารถคอมเม้นว่างเปล่าได้!", code: 0 })
        if (!data.postId || isNaN(parseInt(data.postId))) return res.send({ msg: "ไม่พบโพสที่คุณต้องการเม้น!", code: 0 })
        if (data.uploadimg) {
            if (data.uploadimg.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
            if(!data.uploadimg.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
            try {
                data.uploadimg.mv(`./public/img/comment/${data.uploadimg.md5+"_"+req.user.id+"_"+data.uploadimg.name}`)
            } catch (error) {
                return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
            }
        }

        let findPost = await prisma.post.findFirst({
            where: {
                id: parseInt(data.postId)
            }
        }).catch(e => {
            console.log(e)
            return { msg: "ผิดพลาดไม่พบโพสนี้", code: 0, count: count??0, isLike } 
        })
        let cmd_ = await prisma.comment.create({
            data: {
                content: data.comment,
                authorId: req.user.id,
                postId: parseInt(data.postId),
                img: data.uploadimg ? "/public/img/comment/" + data.uploadimg.md5+"_"+req.user.id+"_"+data.uploadimg.name : null
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "Server เกิดปัญหากรุณาติดต่อผู้ดูแล", code: 0 })
        })
        if(findPost.authorId !== req.user.id){
            await prisma.notify.create({
                data: {
                    toId: findPost.authorId,
                    fromId: req.user.id,
                    content: data.comment??"รูปภาพ",
                    uniqueData: cmd_.id+"_"+findPost.id+"_comment",
                    title: "คอมเม้นต์",
                    type: 0,
                    actionId: parseInt(findPost.id)
                },
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหาการส่งการแจ้งเตือน", code: 0 })
            })
        }

        return res.send({ msg: "สำเร็จแล้ว!", code: 1 })
    })

    fastify.post("/remove", { preHandler: [vlogin] }, async (req, res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let postId = parseInt(req.body?.postId)
        if(!postId || isNaN(postId)) return res.send({ msg: "ไม่พบโพสที่ต้องการลบ", code: 0 })

        let findPost = await prisma.post.findFirst({
            where: {
                id: postId
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่พบโพสที่ต้องการลบ", code: 0 })
        })

        if(findPost && findPost.authorId == req.user.id) {
            if(findPost.img) {
                try {
                    fs.unlinkSync(path.join(__dirname, "../../../"+findPost.img))
                } catch (error) {
                    console.log(error)
                }
            }
            await prisma.post.delete({
                where: {
                    id: postId
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับเซิร์ฟเวอร์ในขณะนี้", code: 0 }) 
            })
            await prisma.notify.deleteMany({
                data: {
                    toId: findPost.authorId,
                    title: "คอมเม้นต์",
                    actionId: parseInt(findPost.id)
                },
            }).catch(e => {
                console.log(e)
            })
            console.log("[Logs] Requset -> delete post:"+ findPost.id)
            return {msg: "สำเร็จแล้ว", code: 1}
        }
        else return res.send({ msg: "คุณไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })
    })

    fastify.post("/remove/comment", { preHandler: [vlogin] }, async (req, res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let commentId = parseInt(req.body?.commentId)
        if(!commentId || isNaN(commentId)) return res.send({ msg: "ไม่พบเม้นที่ต้องการลบ", code: 0 })


        let findComment = await prisma.comment.findFirst({
            where: {
                id: parseInt(commentId)
            }
        }).catch(e => {
            console.log(e)
            return { msg: "ผิดพลาดไม่พบโพสนี้", code: 0, count: count??0, isLike } 
        })
        let Comment_ = await prisma.comment.findFirst({
            where: {
                id: commentId
            },
            include: {
                post: {
                    select: {
                        authorId: true
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่พบเม้นที่ต้องการลบ", code: 0 })
        })
            await prisma.notify.delete({
                where: {
                    uniqueData: commentId+"_"+findComment.postId+"_comment",
                }
            }).catch(e => {
                console.log(e)
            })

        if(Comment_ && (Comment_.authorId == req.user.id || Comment_.post.authorId == req.user.id)) {
            if(Comment_.img) {
                try {
                    fs.unlinkSync(path.join(__dirname, "../../../"+Comment_.img))
                } catch (error) {
                    console.log(error)
                }
            }
            await prisma.comment.delete({
                where: {
                    id: commentId
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "พบปัญหากับเซิร์ฟเวอร์ในขณะนี้", code: 0 }) 
            })
            console.log("[Logs] Requset -> delete Comment:"+ Comment_.id)
            return {msg: "สำเร็จแล้ว", code: 1}
        }
        else return res.send({ msg: "คุณไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })
    })

    fastify.post("/getall", { preHandler: [vlogin] }, async (req, res) => {
        let skip = parseInt(req.body.skip) ?? 0
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบก่อน", list: [], count: 0, code: 0 })
        let count;
        try {
            count = await prisma.post.count({
                where: {
                    OR: [
                        {
                            userId: req.user.id
                        },
                        {
                            AND: [
                                {
                                    user: {
                                        follower: {
                                            some: {
                                                followerId: req.user.id
                                            }
                                        }
                                    }
                                },
                                {
                                    post: {
                                        published: true
                                    }
                                }
                            ]
                        }
                    ]
                },
            })
        } catch (error) { }
        let repost_list = await prisma.repost.findMany({
            skip: skip * 10,
            take: 10,
            where: {
                OR: [
                    {
                        userId: req.user.id
                    },
                    {
                        AND: [
                            {
                                user: {
                                    follower: {
                                        some: {
                                            followerId: req.user.id
                                        }
                                    }
                                }
                            },
                            {
                                post: {
                                    published: true
                                }
                            }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                avatar: true,
                                displayName: true
                            }
                        }
                    }
                },
                post: {
                    select: {
                        content: true,
                        img: true,
                        updatedAt: true,
                        comment: {
                            select: {
                                id: true,
                                authorId: true
                            }
                        },
                        Like: {
                            select: {
                                id: true,
                                userId: true
                            }
                        },
                        Repost: {
                            select: {
                                id: true,
                                userId: true
                            }
                        },
                        author: {
                            select: {
                                id: true,
                                username: true,
                                follower: true,
                                profile: {
                                    select: {
                                        displayName: true,
                                        badge: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "พบปัญหากับ Server (0)", list: [], count: 0, code: 0 })
        })
        let list = await prisma.post.findMany({
            where: {
                OR: [
                    {
                        authorId: req.user.id,
                        published: true
                    },
                    {
                        author: {
                            follower: {
                                some: {
                                    followerId: req.user.id
                                }
                            }
                        },
                        published: true
                    }
                ]
            },
            skip: skip * 10,
            take: 10,
            orderBy: {
                id: "desc"
            }, include: {
                comment: {
                    select: {
                        id: true,
                        authorId: true
                    }
                },
                Like: {
                    select: {
                        id: true,
                        userId: true
                    }
                },
                Repost: {
                    select: {
                        id: true,
                        userId: true
                    }
                },
                author: {
                    select: {
                        id: true,
                        username: true,
                        follower: true,
                        profile: {
                            select: {
                                displayName: true,
                                badge: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "พบปัญหากับ Server (1)", list: [], count: 0, code: 0 })
        })
        return { msg: "ดึงข้อมูลแล้ว", list, repost_list, count, code: 1 }
    })

    fastify.post("/get", { preHandler: [vlogin] }, async (req, res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body

        if(isNaN(parseInt(data.statusId))) return res.send({ msg: "ไม่พบโพสนี้!", code: 0 })

        let findStatus = await prisma.post.findFirst({
            where: {
                id: parseInt(data.statusId)
            },
            include: {
                Like: true,
                Repost: true,
                author: {
                    select: {
                        username: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ผิดพลาด", code: 0 })
        })
        if(!findStatus || (findStatus.published === false && req.user.id != findStatus.authorId)) return res.send({ msg: "ไม่พบโพสนี้โพสอาจถูกลบหรือเป็นส่วนตัว!", code: 0 })
        return { msg: "ดึงข้อมูลสำเร็จแล้ว", findStatus, code: 1 }
    })

    fastify.post("/getcomment", { preHandler: [vlogin] }, async (req, res) => {
        let skip = parseInt(req.body.skip) ?? 0
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body

        if(isNaN(parseInt(data.statusId))) return res.send({ msg: "ไม่พบโพสนี้!", code: 0 })

        let list = await prisma.comment.findMany({
            where: {
                postId: parseInt(data.statusId)
            },
            orderBy: {
                id: "desc"
            },
            skip: skip * 10,
            take: 10,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatar: true
                            }
                        }
                    }
                },
                post: {
                    select: {
                        authorId: true
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ผิดพลาด", code: 0 })
        })
        let count = await prisma.comment.count({
            where: {
                postId: parseInt(data.statusId)
            }
        })
        return { msg: "ดึงข้อมูลสำเร็จแล้ว", list,count, code: 1 }
    })

    done()
}