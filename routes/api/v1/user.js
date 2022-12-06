const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const md5 = require("md5")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")


const vlogin = require("../../middleware/vlogin")
module.exports = (fastify, opts, done) => {
    fastify.post("/",{ preHandler: [vlogin] }, async (req,res) => {
        if(!req.user) return res.send({ msg: "ไม่พบผู้ใช้", code: 0 })
        return res.send({ msg: "ดึงข้อมูลสำเร็จ", data: req.user, code: 1 })
    })
    fastify.post("/auth/register", async (req,res) => {
        let data = req.body
        if(!data || !data.displayname || !data.username || data.username == "" || !data.email || !data.password) return res.send({ msg: "ผิดพลาดกรุณากรอกข้อมูลให้ครบ", code: 0 })
        if(data.password.length < 6) return res.send({ msg: "รหัสผ่านของคุณไม่มีความปลอดภัย", code: 0 })
        try {
            await prisma.user.create({
                data: {
                    email: data.email,
                    username: (data.username).toLowerCase(),
                    password: md5(data.password),
                    profile: {
                        create: {
                            displayName: data.displayname
                        }
                    }
                }
            })
        } catch (error) {
            console.log(error)
            if(error?.meta?.target == "User_username_key"){
                return res.send({ msg: "ชื่อผู้ใช้ซ้ำ!", code: 0 })
            }else if(error?.meta?.target == "User_email_key"){
                return res.send({ msg: "อีเมลซ้ำในระบบ!", code: 0 })
            }else{
                return res.send({ msg: "พบข้อผิดพลาด... "+error, code: 0 })
            }
        }
        return res.send({ msg: "สมัครสำเร็จแล้ว!", code: 1 })
    })
    fastify.post("/auth/login", async (req,res) => {
        let data = req.body
        if(!data || !data.username || !data.password) return res.send({
            msg: "กรุณากรอกข้อมูลให้ครบ!",
            code: 0
        })

        let findAccount = await prisma.user.findFirst({
            where: {
                username: (data.username).toLowerCase(),
                password: md5(data.password),
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ผิดพลาดในการค้นหาบัญชี", code: 0 })
        })

        if(!findAccount) return res.send({ msg: "ไม่พบบัญชีที่ระบุ!", code: 0 })


        let token;
        try {
            token = jwt.sign({ id: findAccount.id, username: findAccount.username, createAt: findAccount.createAt }, process.env.JWT_KEY, { expiresIn: (60 * 60) * 24 });
        } catch (error) {
            console.log(error)
            if (error) return res.send({ msg: "ไม่สามารถดึงข้อมูลได้", code: 0 })
        }
        if (!token) return res.send({ msg: "ไม่สามารถดึงข้อมูลได้", code: 0 })
        
        res.setCookie('token', token, {
            path: '/',
            secure: false,
            httpOnly: true
        })
        return res.send({ msg: "เข้าสู่ระบบสำเร็จ!", code: 1 })
    })
    fastify.post("/find",{ preHandler: [vlogin] }, async (req,res) => {
        if(!req.user) return res.send({ list: [], code: 1 })
        let data = req.body
        if(!data || !data.search) return res.send({ list: [], code: 1 })
        let findUser = await prisma.user.findMany({
            where: {
                username: {
                    startsWith: data.search
                }
            },
            skip: 0,
            take: 10,
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
        }).catch(e => {
            return res.send({ list: [], code: 1 })
        })

        return res.send({ list: findUser, code: 1 })
    })
    fastify.post("/newuser",{ preHandler: [vlogin] }, async (req,res) => {
        if(!req.user) return res.send({ list: [], code: 1 })
        let findUser = await prisma.user.findMany({
            orderBy: {
                id: "desc"
            },
            skip: 0,
            take: 10,
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
        }).catch(e => {
            return res.send({ list: [], code: 1 })
        })

        return res.send({ list: findUser, code: 1 })
    })
    fastify.post("/data", { preHandler: [vlogin] }, async (req,res) => {
        if(!req.user) return res.send({ msg: "ไม่พบผู้ใช้", code: 0 })
        let followerCount = await prisma.follower.count({
            where: {
                user: {
                    username: req.body.username
                }
            }
        })
        let followingCount = await prisma.following.count({
            where: {
                user: {
                    username: req.body.username
                }
            }
        })
        let data = await prisma.user.findFirst({
            where: {
                username: req.body.username
            },
            select: {
                createAt: true,
                id: true,
                email: true,
                role: true,
                username: true,
                profile: true,
                posts: true
            },
        }).catch((e) => {
            console.log(e)
            return res.send({ msg: "ไม่พบผู้ใช้", code: 0 })
        })

        return res.send({ msg: "ดึงข้อมูลสำเร็จ", data: data,followerCount,followingCount, code: 1 })
    })
    fastify.post("/post", { preHandler: [vlogin] }, async (req,res) => {
        let skip = parseInt(req.body.skip) ?? 0
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบก่อน", list: [], count: 0, code: 0 })
        let count;
        let repost_list;
        let list;
        if(req.user.username !== req.body.username){
            try {
                count = await prisma.post.count({
                    where: {
                        AND: [
                            {
                                published: true
                            },
                            {
                                author: {
                                    username: req.body.username
                                }
                            }
                        ]
                    },
                })
            } catch (error) { }
            
        repost_list = await prisma.repost.findMany({
            skip: skip * 10,
            take: 10,
            where: {
                AND: [
                    {
                        user: {
                            username: req.body.username
                        }
                    },
                    {
                        post: {
                            published: true
                        }
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
        list = await prisma.post.findMany({
            where: {
                author: {
                    username: req.body.username
                },
                published: true
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
        }else{
            try {
                count = await prisma.post.count({
                    where: {
                        author: {
                            username: req.body.username
                        }
                    }
                })
            } catch (error) { }
            
        repost_list = await prisma.repost.findMany({
            skip: skip * 10,
            take: 10,
            where: {
                user: {
                    username: req.body.username
                }
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
        list = await prisma.post.findMany({
            where: {
                author: {
                    username: req.body.username
                },
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
        }
        return { msg: "ดึงข้อมูลแล้ว", list, repost_list, count, code: 1 }
    })
    fastify.post("/follow", { preHandler: [vlogin] }, async (req,res) => {
        if (!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบก่อน", code: 0 })
        let targetId = req.body.targetId
        if (!targetId || isNaN(parseInt(targetId))) return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (1)", code: 0 })
        let find = await prisma.follower.findFirst({
            where: {
                userId: parseInt(targetId),
                followerId: req.user.id
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "Server เกิดข้อผิดพลาดชั่วคราว (2)", code: 0 })
        })

        let isFollow = false
        if(!find) return res.send({ msg: "สำเร็จ", isFollow: isFollow, code: 1 })
        
        return { msg: "สำเร็จ", isFollow:true , code: 1 }
    })
    fastify.post("/img/profile", { preHandler: [vlogin]}, async (req,res) => { 
        if(!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        const img = req.body?.img
        const id = parseInt(req.body?.id)
        if(isNaN(id)) return res.send({ msg: "พบปัญหาบางอย่าง!", code: 0 })
        if(req.user.id !== id) return res.send({ msg: "ไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })
        if(!img) return res.send({ msg: "ไม่สามารถอ่านไฟล์ได้" ,code:0})
        if(!req.user?.profile?.avatar){
            if (img) {
                if (img.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
                if(!img.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
                
                try {
                    img.mv(`./public/img/profile/avatar/${img.md5+"_"+req.user.id+"_"+img.name}`)
                } catch (error) {
                    console.log(error)
                    return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
                }
            }
            await prisma.profile.update({
                where: {
                    userId: req.user.id
                },
                data: { 
                    avatar: `/public/img/profile/avatar/${img.md5+"_"+req.user.id+"_"+img.name}`
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            })
        }else{
            try {
                fs.unlinkSync(path.join(__dirname, "../../../"+req.user?.profile?.avatar))
            } catch (error) {
                console.log(error)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            }

            if (img) {
                if (img.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
                if(!img.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
                
                try {
                    img.mv(`./public/img/profile/avatar/${img.md5+"_"+req.user.id+"_"+img.name}`)
                } catch (error) {
                    console.log(error)
                    return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
                }
            }

            await prisma.profile.update({
                where: {
                    userId: req.user.id
                },
                data: { 
                    avatar: `/public/img/profile/avatar/${img.md5+"_"+req.user.id+"_"+img.name}`
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            })
        }

        return { msg: "สำเร็จแล้ว", code: 1 }
    })
    fastify.post("/img/banner", { preHandler: [vlogin]}, async (req,res) => { 
        if(!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        const img = req.body?.img
        const id = parseInt(req.body?.id)
        if(isNaN(id)) return res.send({ msg: "พบปัญหาบางอย่าง!", code: 0 })
        if(req.user.id !== id) return res.send({ msg: "ไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })
        if(!img) return res.send({ msg: "ไม่สามารถอ่านไฟล์ได้" ,code:0})
        if(!req.user?.profile?.banner){
            if (img) {
                if (img.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
                if(!img.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
                
                try {
                    img.mv(`./public/img/profile/banner/${img.md5+"_"+req.user.id+"_"+img.name}`)
                } catch (error) {
                    console.log(error)
                    return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
                }
            }
            await prisma.profile.update({
                where: {
                    userId: req.user.id
                },
                data: { 
                    banner: `/public/img/profile/banner/${img.md5+"_"+req.user.id+"_"+img.name}`
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            })
        }else{
            try {
                fs.unlinkSync(path.join(__dirname, "../../../"+req.user?.profile?.banner))
            } catch (error) {
                console.log(error)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            }

            if (img) {
                if (img.size / 1024 > 1024) return res.send({ msg: "ไฟล์มีขนาดใหญ่กว่า 1mb", code: 0 })
                if(!img.mimetype.startsWith("image/")) return res.send({ msg: "รูปแบบไฟล์ไม่ถูกต้องนายต้องการจะทำอะไรอ่ะ?", code: 0 })
                
                try {
                    img.mv(`./public/img/profile/banner/${img.md5+"_"+req.user.id+"_"+img.name}`)
                } catch (error) {
                    console.log(error)
                    return res.send({ msg: "ไม่สามารถเขียนไฟล์ได้", code: 0 })
                }
            }

            await prisma.profile.update({
                where: {
                    userId: req.user.id
                },
                data: { 
                    banner: `/public/img/profile/banner/${img.md5+"_"+req.user.id+"_"+img.name}`
                }
            }).catch(e => {
                console.log(e)
                return res.send({ msg: "อัพโหลดไฟล์ไม่สำเร็จ!", code: 0 })
            })
        }

        return { msg: "สำเร็จแล้ว", code: 1 }
    })
    fastify.post("/editprofile/general", { preHandler: [vlogin]}, async(req,res) => {

        if(!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body
        const id = parseInt(data?.id)
        if(isNaN(id)) return res.send({ msg: "พบปัญหาบางอย่าง!", code: 0 })
        if(req.user.id !== id) return res.send({ msg: "ไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })

        let oldData = await prisma.profile.findFirst({
            where: {
                userId: id
            },include: {
                user: {
                    select: {
                        username: true,
                        password: true
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", code: 0 })
        })
        if(!oldData) return res.send({ msg: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", code: 0 })
        if(oldData.user.password != md5(data?.password)) return res.send({ msg: "รหัสผ่านไม่ถูกต้อง!", code: 0 })

        await prisma.profile.update({
            where: {
                userId: id
            },
            data: {
                birthday: new Date(data?.birthday)??oldData.birthday,
                displayName: data?.displayName === ""?oldData.displayName:data?.displayName,
                bio: data?.bio === ""?"":data?.bio,
                link: data?.link === ""?"":data?.link,
                user: {
                    update: {
                        username: (data?.username === ""?oldData?.user?.username:data?.username).toLowerCase()
                    }
                }
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่สามารถเขียนข้อมูลผู้ใช้ได้", code: 0 })
        })
        return { msg: "สำเร็จ", temp:req.body, code: 1 }
    })
    fastify.post("/editprofile/private", { preHandler: [vlogin]}, async(req,res) => {
        if(!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let data = req.body
        const id = parseInt(data?.id)
        if(isNaN(id)) return res.send({ msg: "พบปัญหาบางอย่าง!", code: 0 })
        if(req.user.id !== id) return res.send({ msg: "ไม่มีสิทธิ์กระทำสิ่งนี้!", code: 0 })

        let oldData = await prisma.user.findFirst({
            where: {
                id: id
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", code: 0 })
        })
        if(!oldData) return res.send({ msg: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", code: 0 })
        if(oldData.password != md5(data?.password)) return res.send({ msg: "รหัสผ่านไม่ถูกต้อง!", code: 0 })
        console.log(data, oldData)
        await prisma.user.update({
            where: {
                id: id
            },
            data: {
                password: data?.newpassword_ === ""?oldData?.newpassword_:md5(data?.newpassword_),
                email: data?.email === ""?oldData?.email:data?.email
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่สามารถเขียนข้อมูลผู้ใช้ได้", code: 0 })
        })
        return { msg: "สำเร็จ", code: 1 }
    })
    fastify.post("/getnotify", { preHandler: [vlogin]}, async (req,res) => {
        if(!req.user) return res.send({ msg: "กรุณาเข้าสู่ระบบ", code: 0 })
        let skip = parseInt(req.body.skip) ?? 0
        let findlist = await prisma.notify.findMany({
            where: {
                toId: req.user.id
            },
            orderBy: {
                id: "desc"
            },
            skip: skip*10,
            take: 10,
            select: {
                type: true,
                actionId: true,
                title: true,
                content: true,
                createAt: true,
                isRead: true,
                uniqueData: true,
                id: true,
                toId: true,
                fromId: true,
                form: {
                    select: {
                        avatar: true,
                        displayName: true,
                        userId: true,
                        user: {
                            select: {
                                username: true
                            }
                        }
                    }
                },
            }
        }).catch(e => {
            console.log(e)
            return res.send({ msg: "ไม่สามารถดึงข้อมูลใช้ได้", code: 0 })
        })

        return { msg: "สำเร็จแล้ว", list:findlist, code: 1 }
    })
    done()
}