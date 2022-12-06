let user = {}
$.ajax({
    url: "/api/v1/user",
    method: "POST"
}).done(function (res) {
    if (res.code != 1) return window.location.replace("/auth/login")
    if (res.data.profile.avatar) profile_dummy_image.src = res.data.profile.avatar
    $("#username_profile").text(res.data.username)
    $("#displayname_profile").text(res.data.profile.displayName)
    $("#myprofile").attr("href", "/user?q=" + res.data.username)
    user = res.data
})

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + 's';
    }

    else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + 'm';
    }

    else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + 'hr';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + 'D';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + 'M';
    }

    else {
        return Math.round(elapsed / msPerYear) + 'Y';
    }
}


function uploadprofile_img() {
    const [file] = upload_profile.files
    if (file) {
        let dataImg = new FormData()
        dataImg.append("img", file)
        dataImg.append("id", _profile.data.id)

        $.ajax({
            url: "/api/v1/user/img/profile",
            method: "POST",
            processData: false,
            mimeType: "multipart/form-data",
            contentType: false,
            data: dataImg
        }).done(function (resp) {
            let res = JSON.parse(resp)
            if(res.code){
                swal.fire({
                    html: `<h1 class="text-3xl text-pink-300 font-semibold">สำเร็จแล้ว!</h1><div class="text-start">ทำการอัพโหลดโปรไฟล์สำเร็จแล้ว!</div>`,
                    imageUrl: '/assets/img/icon/nice.png',
                    imageHeight: 250,
                    background: 'rgb(14 14 16 / 93%)',
                    color: 'WHITE',
                    showCancelButton: false,
                    confirmButtonColor: '#f9a8d4',
                })
                return profile_img.src = URL.createObjectURL(file)
            }else{
                return swal.fire({
                    html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                    imageUrl: '/assets/img/icon/ehe.png',
                    imageHeight: 250,
                    background: 'rgb(14 14 16 / 93%)',
                    color: 'WHITE',
                    showCancelButton: false,
                    confirmButtonColor: '#f9a8d4',
                })
            }
        })
    }
}
function uploadbanner_img() {
    const [file] = upload_banner.files
    if (file) {
        let dataImg = new FormData()
        dataImg.append("img", file)
        dataImg.append("id", _profile.data.id)

        $.ajax({
            url: "/api/v1/user/img/banner",
            method: "POST",
            processData: false,
            mimeType: "multipart/form-data",
            contentType: false,
            data: dataImg
        }).done(function (resp) {
            let res = JSON.parse(resp)
            if(res.code){
                swal.fire({
                    html: `<h1 class="text-3xl text-pink-300 font-semibold">สำเร็จแล้ว!</h1><div class="text-start">ทำการอัพโหลดโปรไฟล์สำเร็จแล้ว!</div>`,
                    imageUrl: '/assets/img/icon/nice.png',
                    imageHeight: 250,
                    background: 'rgb(14 14 16 / 93%)',
                    color: 'WHITE',
                    showCancelButton: false,
                    confirmButtonColor: '#f9a8d4',
                })
                return profile_banner.src = URL.createObjectURL(file)
            }else{
                return swal.fire({
                    html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                    imageUrl: '/assets/img/icon/ehe.png',
                    imageHeight: 250,
                    background: 'rgb(14 14 16 / 93%)',
                    color: 'WHITE',
                    showCancelButton: false,
                    confirmButtonColor: '#f9a8d4',
                })
            }
        })
    }
}



isSetting = false
function setting() {
    if(isSetting) {
        isSetting = false
        setting_.classList.replace("flex", "hidden")
    }else{
        isSetting = true
        setting_.classList.replace("hidden", "flex")
    }
}


function share(id) {
    if (navigator.share) {
        navigator.share({
            text: 'ลองดูสิ่งนี้สิ: ',
            url: "/status?s=" + id
        }).then(() => { })
            .catch((err) => console.error(err));
    } else {
        navigator.clipboard.writeText(location.hostname + "/status?s=" + id)
        
        return swal.fire({
            html: `<h1 class="text-3xl text-pink-300 font-semibold">สำเร็จ!</h1><div class="text-start">ทำการคัดลอกข้อมูลลิ้งก์ไปยังคลิปบอร์ดแล้ว!</div>`,
            imageUrl: '/assets/img/icon/nice.png',
            imageHeight: 250,
            background: 'rgb(14 14 16 / 93%)',
            color: 'WHITE',
            showCancelButton: false,
            confirmButtonColor: '#f9a8d4',
        })
    }
}
function like(id) {
    id = `${id}`
    let repostId = false
    if (id.slice(0, 1) === "r") repostId = true
    else id = parseInt(id)
    document.getElementById("like_button_" + id).disabled = true
    let data = new FormData()
    data.append("postId", repostId ? id.slice(1) : id)
    $.ajax({
        url: "/api/v1/action/like",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (resp) {
        let res = JSON.parse(resp)
        document.getElementById("like_button_" + id).disabled = false
        if (res.code) {
            document.getElementById("like_button_" + id).innerHTML = `<i class="fas fa-heart"></i> ${res.code === 1 ? res.count : 0}`
            if (res.isLike) document.getElementById("like_button_" + id).classList.add("text-red-500")
            else document.getElementById("like_button_" + id).classList.remove("text-red-500")
        }
    })
}
function repost(id) {
    id = `${id}`
    let repostId = false
    if (id.slice(0, 1) === "r") repostId = true
    else id = parseInt(id)
    document.getElementById("repost_button_" + id).disabled = true
    let data = new FormData()
    data.append("postId", repostId ? id.slice(1) : id)
    $.ajax({
        url: "/api/v1/action/repost",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (resp) {
        let res = JSON.parse(resp)
        document.getElementById("repost_button_" + id).disabled = false
        if (res.code) {
            document.getElementById("repost_button_" + id).innerHTML = `<i class="fas fa-sync-alt"></i> ${res.code === 1 ? res.count : 0}`
            if (res.isRepost) document.getElementById("repost_button_" + id).classList.add("text-lime-500")
            else document.getElementById("repost_button_" + id).classList.remove("text-lime-500")
        }
    })
}


function deletepost(id) {
    let _data = new FormData()
    _data.append("postId", id)

    swal.fire({
        html: `<h1 class="text-3xl text-pink-300 font-semibold">โยนมันลงถังขยะ?</h1><div class="text-start">แน่ใจหรือไม่ที่ต้องการดำเนินการสิ่งนี้โพสของคุณจะหายไปตลอดกาลและไม่สามารถกู้ได้</div>`,
        imageUrl: '/assets/img/icon/remove.png',
        imageHeight: 250,
        background: 'rgb(14 14 16 / 93%)',
        color: 'WHITE',
        reverseButtons: true,
        showCancelButton: true,
        confirmButtonColor: '#f9a8d4',
        confirmButtonText: 'ลบทิ้งทันที',
        cancelButtonText: `ยกเลิก`,
    }).then((result) => {
        if (result.isConfirmed) {
          
            $.ajax({
                url: "/api/v1/post/remove",
                method: "POST",
                processData: false,
                mimeType: "multipart/form-data",
                contentType: false,
                data: _data
            }).done(function (response) {
                let res = JSON.parse(response)
                if (res.code === 1) {
                    page = 0
                    countPost = 0
                    query(0, "new")
                } else {
                    return swal.fire({
                        html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                        imageUrl: '/assets/img/icon/ehe.png',
                        imageHeight: 250,
                        background: 'rgb(14 14 16 / 93%)',
                        color: 'WHITE',
                        showCancelButton: false,
                        confirmButtonColor: '#f9a8d4',
                    })
                }
            });

        }
      })
}


//get data
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});


let page = 0
let countPost = 0
function query(skip, renew) {
    let data = new FormData()
    data.append("skip", skip)
    data.append("username", params.q)
    $.ajax({
        url: "/api/v1/user/post",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (response) {
        let res = JSON.parse(response)
        if (res.code === 1) {
            if (renew === "new") document.getElementById("content").innerHTML = ""
            let array = []
            countPost = res.count
            for (let i = 0; i < res.repost_list.length; i++) {
                res.repost_list[i].type = "repost"
                res.repost_list[i].createdAt = new Date(res.repost_list[i].createdAt).getTime()
                array.push(res.repost_list[i])
            }
            for (let i = 0; i < res.list.length; i++) {
                res.list[i].type = "normal"
                res.list[i].createdAt = new Date(res.list[i].createdAt).getTime()
                array.push(res.list[i])
            }
            array.sort(function (b, a) { return a.createdAt - b.createdAt });
            array.forEach(e => {
                if (e.type === "repost") {
                    $("#content").append(`<div class="m-2">
                <span class="text-opacity-20 text-white px-4"><i class="fad fa-sync-alt"></i> ${encodeHTML(e.user.profile.displayName)} Repost!</span>
                    <div class="rounded-lg w-full p-2">
                        <div class="flex justify-start">
                                <a style="min-height: 50px; min-width: 50px;" href="/user?q=${encodeHTML(e.post.author.username)}">
                                    <img src="${e.post.author.profile.avatar ? e.post.author.profile.avatar : "/assets/img/icon/dummy-profile-pic.png"}"
                                    class="rounded-full"
                                    style="display: inline-flex !important; height: 50px; width: 50px;">
                                </a>
                        <div class="pl-2 w-full mt-1">
                            <div class="mb-1">
                                    <div class="-mb-1">
                                        <a href="/user?q=${encodeHTML(e.post.author.username)}"class="text-white truncate"><span>${encodeHTML(e.post.author.profile.displayName)}</span></a>
                                    </div>
                                    <div class="text-white opacity-30 truncate overflow-x-hidden text-sm">
                                        <span>@${encodeHTML(e.user.username)} · ${timeDifference(new Date().getTime(), new Date(e.post.updatedAt).getTime())}</span>
                                    </div>
                            <p class="text-white font-light text-sm mt-2" style="word-break: break-all;">${encodeHTML(e.post.content)}</p>
                            </div>
                            ${e.post.img ? '<div><img src="' + e.post.img + '" class="rounded-lg" style="height: 512;"></div>' : ""}
                                <div class="grid grid-cols-5 gap-2 text-start mx-2 mt-3 text-opacity-40 text-white text-xs">
                                    <div>
                                        <a href="/status?s=${e.postId}" class="transition-all duration-200 hover:scale-125 hover:text-blue-500">
                                            <i class="fad fa-comments"></i> ${e.post.comment.length}
                                        </a>
                                    </div>
                                    <div>
                                        <button id="like_button_r${e.postId}" onclick="like('r${e.postId}')" class="${e.post.Like.find(e => e.userId === user.id) ? "text-red-500" : ""} transition-all duration-200 hover:scale-125 hover:text-red-500">
                                            <i class="fas fa-heart"></i> ${e.post.Like.length}
                                        </button>
                                    </div>
                                    <div>
                                        <button id="repost_button_r${e.postId}" onclick="repost('r${e.postId}')" class="${e.post.Repost.find(e => e.userId === user.id) ? "text-lime-500" : ""} transition-all duration-200 hover:scale-125 hover:text-lime-500">
                                            <i class="fad fa-sync-alt"></i> ${e.post.Repost.length}
                                        </button>
                                    </div>
                                    <div>
                                        <button onclick="share('${e.postId}')" class="transition-all duration-200 hover:scale-125 hover:text-blue-500">
                                            <i class="fad fa-share-square"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <hr class="opacity-25 mt-4">
                    </div>
                </div>`)
                } else {
                    $("#content").append(`<div class="m-2">
                <div class="rounded-lg w-full p-2">
                    <div class="flex justify-start">
                    <a style="min-height: 50px; min-width: 50px;" href="/user?q=${encodeHTML(e.author.username)}">
                            <img src="${e.author.profile.avatar ? e.author.profile.avatar : "/assets/img/icon/dummy-profile-pic.png"}"
                            class="object-cover object-center rounded-full w-14 h-14"
                            style="display: inline-flex !important; height: 50px; width: 50px;">
                        </a>
                        <div class="pl-2 w-full mt-1">
                            <div class="mb-1">
                                    <div class="flex justify-between">
                                        <div>
                                            <div class="-mb-1">
                                                <a href="/user?q=${encodeHTML(e.author.username)}" class="text-white truncate"><span>${encodeHTML(e.author.profile.displayName)}</span></a>
                                            </div>
                                            <div class="text-white opacity-30 truncate overflow-x-hidden text-sm">
                                                <span>@${encodeHTML(e.author.username)}</span>
                                                <span> · ${timeDifference(new Date().getTime(), new Date(e.updatedAt).getTime())}</span>
                                            </div>
                                        </div>
                                        <div class="${e.published?'hidden':''}">
                                            <span class="text-white text-opacity-30">
                                                <i class="fas fa-lock"></i>
                                            </span>
                                        </div>
                                    </div>
                            <p class="text-white font-light text-sm mt-2" style="word-break: break-all;">${encodeHTML(e.content)}</p>
                            </div>
                            ${e.img ? '<div><img src="' + e.img + '" class="rounded-lg" style="height: 512;"></div>' : ""}
                            <div class="grid grid-cols-5 gap-2 text-start mx-2 mt-3 text-xs text-opacity-40 text-white">
                                <div>
                                    <a href="/status?s=${e.id}" class="transition-all duration-200 hover:scale-125 hover:text-blue-500">
                                        <i class="fad fa-comments"></i> ${e.comment.length}
                                    </a>
                                </div>
                                <div>
                                    <button id="like_button_${e.id}" onclick="like(${e.id})" class="${e.Like.find(e => e.userId === user.id) ? "text-red-500" : ""} transition-all duration-200 hover:scale-125 hover:text-red-500">
                                        <i class="fas fa-heart"></i> ${e.Like.length}
                                    </button>
                                </div>
                                <div>
                                    <button id="repost_button_${e.id}" onclick="repost(${e.id})" class="${e.Repost.find(e => e.userId === user.id) ? "text-lime-500" : ""} transition-all duration-200 hover:scale-125 hover:text-lime-500">
                                        <i class="fad fa-sync-alt"></i> ${e.Repost.length}
                                    </button>
                                </div>
                                <div>
                                    <button onclick="share(${e.id})" class="transition-all duration-200 hover:scale-125 hover:text-blue-500">
                                        <i class="fad fa-share-square"></i>
                                    </button>
                                </div>
                                ${e.author.id === user.id ? '<div><button onclick="deletepost(' + e.id + ')" class="transition-all duration-200 hover:scale-125 hover:text-red-500"><i class="fas fa-trash"></i></button></div>' : ""}
                            </div>
                        </div>
                    </div>
                    <hr class="opacity-25 mt-4">
                </div>
            </div>`)
                }

            })
        } else {
            return
        }
    });
}

function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

let getProfile = new FormData()
getProfile.append("username", params.q)

let _profile = {}
$.ajax({
    url: "/api/v1/user/data",
    method: "POST",
    processData: false,
    mimeType: "multipart/form-data",
    contentType: false,
    data: getProfile
}).done(function (resp) {
    let res = JSON.parse(resp)
    if(!res.data) {
        showUser.classList.add("hidden")
        return swal.fire({
            html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด?</h1><div class="text-start">ไม่พบผู้ใช้หรือหรือผู้ใช้ถูกระงับการใช้งานหากคุณมั่นใจว่าผู้ใช้นี้ควรที่จะอยู่ในระบบกรุณาติดต่อผู้ดูแลเพื่อตรวจสอบ</div>`,
            imageUrl: '/assets/img/icon/ehe.png',
            imageHeight: 250,
            background: 'rgb(14 14 16 / 93%)',
            color: 'WHITE',
            showCancelButton: false,
            confirmButtonColor: '#f9a8d4',
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.replace("/")
            }
        })
    }
    _profile = res
    //DISPLAY
    profile_img.src = res.data.profile.avatar ?? "/assets/img/icon/dummy-profile-pic.png"
    profile_banner.src = res.data.profile.banner ?? "https://dummyimage.com/600x400/000/000"
    displayname.innerText = res.data.profile.displayName
    userName.innerText = res.data.username
    if (!res.data.profile.bio) showBio.classList.add("hidden")
    bioDisplay.innerText = res.data.profile.bio ?? "..."
    if (!res.data.profile.link) showLink.classList.add("hidden")
    __link.innerText = res.data.profile.link ?? "..."
    let _displayLink = (res.data.profile.link??"...")
    if(!_displayLink.startsWith("http")) _displayLink = "https://"+_displayLink
    document.getElementById("link__").setAttribute("href", _displayLink)
    if (!res.data.profile.birthday) showBD.classList.add("hidden")

    function time_(time) {
        let _convert = new Date(time)
        return _convert.getDate() + "/" + (parseInt(_convert.getMonth())+1) + "/" + _convert.getFullYear() ?? "00/00/00"
    }
    bD_.innerText = time_(res.data.profile.birthday)?? "..."

    followerCount.innerText = res.followerCount ?? 0
    followingCount.innerText = res.followingCount ?? 0
    if(user.id === res.data.id) settingButton.classList.remove("hidden")
    if(user.id !== res.data.id) {
        followButton.classList.remove("hidden")
    }else{
        document.getElementById("logout").classList.remove("hidden")
        upload_banner.disabled = false
        upload_profile.disabled = false
        displayname_.value = res.data.profile.displayName
        username_.value = res.data.username
        bio_.value = res.data.profile.bio
        link_.value = res.data.profile.link
        if(res.data.profile.birthday) date_.value = (res.data.profile.birthday).slice(0,16)
        email_.value = res.data.email
    }
    joinAt.innerText = time_(res.data.createAt)

    isFollow()
    query(0, "scoll")
})

$("form#editProfile_1").submit((e) => {
    e.preventDefault();
    let _dataEdit = new FormData(e.target)
    _dataEdit.append("id",_profile.data.id)
    let settings = {
        url: "/api/v1/user/editprofile/general",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: _dataEdit
    };

    $.ajax(settings).done(function (response) {
        let res = JSON.parse(response)
        console.log(res)
        if (res.code === 1) {
            if((res.temp.username != _profile.data.username) && (res.temp.username != "")) return window.location.replace("/user?q="+ res.temp.username)
            return window.location.reload()
        } else {
            return swal.fire({
                html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                imageUrl: '/assets/img/icon/ehe.png',
                imageHeight: 250,
                background: 'rgb(14 14 16 / 93%)',
                color: 'WHITE',
                showCancelButton: false,
                confirmButtonColor: '#f9a8d4',
            })
        }
    });
})

$("form#editProfile_2").submit((e) => {
    e.preventDefault();
    let _dataEdit = new FormData(e.target)
    _dataEdit.append("id",_profile.data.id)
    let settings = {
        url: "/api/v1/user/editprofile/private",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: _dataEdit
    };

    $.ajax(settings).done(function (response) {
        let res = JSON.parse(response)
        console.log(res)
        if (res.code === 1) {
            return window.location.reload()
        } else {
            return swal.fire({
                html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                imageUrl: '/assets/img/icon/ehe.png',
                imageHeight: 250,
                background: 'rgb(14 14 16 / 93%)',
                color: 'WHITE',
                showCancelButton: false,
                confirmButtonColor: '#f9a8d4',
            })
        }
    });
})


let _isFollow;
function follow() {

    if (_isFollow) {
        return swal.fire({
            html: `<h1 class="text-3xl text-pink-300 font-semibold">ยกเลิกการติดตาม?</h1><div class="text-start">ต้องการเลิกติดตามคนนี้หรือไม่? คุณจะไม่ได้รับการแจ้งเตือนและโพสใหม่ๆจากผู้ใช้นี้อีก</div>`,
            imageUrl: '/assets/img/icon/remove.png',
            imageHeight: 250,
            background: 'rgb(14 14 16 / 93%)',
            color: 'WHITE',
            reverseButtons: true,
            showCancelButton: true,
            confirmButtonColor: '#f9a8d4',
            confirmButtonText: 'ตกลง',
            cancelButtonText: `ยกเลิก`,
        }).then((result) => {
            if (result.isConfirmed) {
                sendFollow()
            }
        })

    }else{
        sendFollow()
    }
}
function sendFollow() {
    follow_button.disabled = true
    let data = new FormData()
    data.append("targetId", _profile.data.id)
    $.ajax({
        url: "/api/v1/action/follow",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (resp) {
        let res = JSON.parse(resp)
        if (res.code) {
            follow_button.disabled = false
            if (res.isFollow) {
                _isFollow = true
                _profile.followerCount++
                followerCount.innerText = _profile.followerCount
                document.getElementById("follow").innerHTML = `<i class="fas fa-user-check"></i>`
            } else {
                _isFollow = false
                _profile.followerCount--
                followerCount.innerText = _profile.followerCount
                document.getElementById("follow").innerHTML = `<i class="fas fa-user-plus"></i>`
            }
        } else {
            return swal.fire({
                html: `<h1 class="text-3xl text-pink-300 font-semibold">ผิดพลาด!</h1><div class="text-start">${res.msg}!</div>`,
                imageUrl: '/assets/img/icon/ehe.png',
                imageHeight: 250,
                background: 'rgb(14 14 16 / 93%)',
                color: 'WHITE',
                showCancelButton: false,
                confirmButtonColor: '#f9a8d4',
            })
        }
    })
}
function isFollow() {
    let follow_ = new FormData()
    follow_.append("targetId", _profile.data.id)
    $.ajax({
        url: "/api/v1/user/follow",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: follow_
    }).done(function (_resp) {
        let _res = JSON.parse(_resp)
        if(_res.isFollow){
            _isFollow = true
            document.getElementById("follow").innerHTML= `<i class="fas fa-user-check"></i>`
        }else{
            _isFollow = false
            document.getElementById("follow").innerHTML= `<i class="fas fa-user-plus"></i>`
        }
    })
}
