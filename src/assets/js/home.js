uploadimg.onchange = evt => {
    const [file] = uploadimg.files
    if (file) {
        previewImg.src = URL.createObjectURL(file)
        img_catagory.classList.remove("hidden")
    }
}

let removeImg = () => {
    document.getElementById("uploadimg").value = "";
    img_catagory.classList.add("hidden")
}
function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + 's';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + 'm';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + 'hr';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + 'D';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + 'M';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + 'Y';   
    }
}

let countword = (x) => {
    if (x >= 100) countword_preview.innerHTML = x + "/500"
    else countword_preview.innerHTML = ""
    if (x >= 480) countword_preview.classList.add("text-red-400")
    else countword_preview.classList.remove("text-red-400")
}
let user = {}
//get data
let page = 0
let countPost = 0
function query(skip, renew) {
    let data = new FormData()
    data.append("skip", skip)
    $.ajax({
        url: "/api/v1/post/getall",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (response) {
        let res = JSON.parse(response)
        if (res.code === 1) {
            if (renew === "new") document.getElementById("content").innerHTML = ""
            countPost = res.count
            let array = []
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
                                    class="object-cover object-center rounded-full w-14 h-14"
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
                                    <div class="-mb-1">
                                        <a href="/user?q=${encodeHTML(e.author.username)}" class="text-white truncate"><span>${encodeHTML(e.author.profile.displayName)}</span></a>
                                    </div>
                                    <div class="text-white opacity-30 truncate overflow-x-hidden text-sm"><span>@${encodeHTML(e.author.username)}</span><span> · ${timeDifference(new Date().getTime(), new Date(e.updatedAt).getTime())}</span></div>
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

$.ajax({
    url: "/api/v1/user",
    method: "POST"
}).done(function (res) {
    if (res.code != 1) return window.location.replace("/auth/login")
    if (res.data.profile.avatar) document.getElementById("profile_dummy_image").src = res.data.profile.avatar
    $("#username_profile").text(res.data.username)
    $("#displayname_profile").text(res.data.profile.displayName)
    $("#myprofile").attr("href", "/user?q=" + res.data.username)
    user = res.data
})

query(0, "scoll")
$("#content_main").scroll(function () {
    let _screen = document.getElementById("content_main")
    if (_screen.scrollHeight - _screen.clientHeight == _screen.scrollTop) {
        page++
        if ((countPost / (page)).toFixed(0) < 10) return
        query(page, "scoll")
    }
});

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
                    document.getElementById("post_content").value = ""
                    removeImg()
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


$("form#postInput").submit((e) => {
    e.preventDefault();
    let settings = {
        url: "/api/v1/post",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: new FormData(e.target)
    };

    $.ajax(settings).done(function (response) {
        let res = JSON.parse(response)
        if (res.code === 1) {
            document.getElementById("post_content").value = ""
            removeImg()
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
})
function share(id) {
    if (navigator.share) {
        navigator.share({
          text: 'ลองดูสิ่งนี้สิ: ',
          url: "/status?s="+id
        }).then(() => {})
          .catch((err) => console.error(err));
      } else {
        navigator.clipboard.writeText(location.hostname+"/status?s="+id)
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