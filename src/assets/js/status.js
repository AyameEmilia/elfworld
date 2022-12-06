//check user
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

let user = {}
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

//get data
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let getData = new FormData()
getData.append("statusId", params.s)
let postData_ = {}

$.ajax({
    url: "/api/v1/post/get",
    method: "POST",
    processData: false,
    mimeType: "multipart/form-data",
    contentType: false,
    data: getData
}).done(function (resp) {
    let res = JSON.parse(resp)
    if (res.code === 0) {

        statusContent.classList.replace("flex", "hidden")
        document.getElementById("comment").classList.replace("flex", "hidden")
        loadmore.classList.add("hidden")
        alert_post_msg.innerText = res.msg
        alert_post.classList.remove("hidden")

        return;
    }
    $("#author_post").text(res.findStatus.author.profile.displayName)
    document.getElementById("gotoprofile").href = "/user?q="+res.findStatus.author.username
    document.getElementById("author_post").href = "/user?q="+res.findStatus.author.username
    $("#username_post").text(res.findStatus.author.username)
    if(res.findStatus.author.profile.avatar) profile_img_post.src = res.findStatus.author.profile.avatar
    $("#dataPost").text(" · " + timeDifference(new Date().getTime(), new Date(res.findStatus.updatedAt).getTime()))
    $("#content_post").text(res.findStatus.content)
    $("#like_button").html(`<i class="fas fa-heart"></i> ${res.findStatus.Like.length}`)
    $("#repost_button").html(`<i class="fad fa-sync-alt"></i> ${res.findStatus.Repost.length}`)

    if (res.findStatus.authorId == user.id) deletepostButton.classList.remove("hidden")
    if (res.findStatus.Like.find(e => e.userId === user.id)) document.getElementById("like_button").classList.add("text-red-500")
    if (res.findStatus.Repost.find(e => e.userId === user.id)) document.getElementById("repost_button").classList.add("text-lime-500")
    if (res.findStatus.img) $("#imgPost_").append(`<img src="${res.findStatus.img}" class="rounded-lg" style="height: 512;">`)
    postData_ = res.findStatus
    query(0, "scoll")
})

let comment = {
    list: [],
    count: 0,
    page: 0
}
function query(skip, renew) {
    let getComment = new FormData()
    getComment.append("statusId", params.s)
    getComment.append("skip", skip)

    $.ajax({
        url: "/api/v1/post/getcomment",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: getComment
    }).done(function (resp) {
        let res = JSON.parse(resp)
        comment.list = res.list
        comment.count = res.count
        if (renew === "new") document.getElementById("commentlist").innerHTML = ""
        res.list.forEach(e => {
            $("#commentlist").append(`<div class="w-full">
        
        <div class="flex justify-start">
        <a style="min-height: 50px; min-width: 50px;" href="/user?q=${encodeHTML(e.author.username)}">
            <img src="${e.author.profile.avatar ?? "/assets/img/icon/dummy-profile-pic.png"}"
            class="object-cover object-center rounded-full w-14 h-14"
            style="display: inline-flex !important; height: 50px; width: 50px;">
        </a>
<div class="pl-2 w-full mt-1">
    <div class="mb-1">
            <div class="flex justify-between w-full">
                <div>
                    <div class="-mb-1">
                        <a href="/user?q=${encodeHTML(e.author.username)}"class="text-white truncate"><span>${encodeHTML(e.author.profile.displayName)}</span></a>
                    </div>
                    <div class="text-white opacity-30 truncate overflow-x-hidden text-sm">
                        <span>@${encodeHTML(e.author.username)} · ${timeDifference(new Date().getTime(), new Date(e.createdAt).getTime())}</span>
                    </div>
                </div>
                ${e.authorId === user.id ||e.post.authorId === user.id?`<div class="text-white text-opacity-30"><button onclick="deleteComment(${e.id})" class="transition-all duration-200 hover:scale-125 hover:text-red-500"><i class="fas fa-trash"></i></button></div>`:""}
            </div>
            <p class="text-white font-light text-sm mt-2" style="word-break: break-all;">${encodeHTML(e.content)}</p>
    </div>
    ${e.img ? '<div><img src="' + e.img + '" class="rounded-lg" style="height: 512;"></div>' : ""}
    </div>`)
        });
    })

}
function loadmoreComment() {
    comment.page++
    query(comment.page, "scoll")
    if ((comment.count / (comment.page + 1)).toFixed(0) < 10) document.getElementById("loadmore").classList.add("hidden")
}

function checklength(word) {
    if (word >= 50) countword_preview.innerHTML = word + "/100"
    else countword_preview.innerHTML = ""
    if (word >= 90) countword_preview.classList.replace("text-white", "text-red-400")
    else countword_preview.classList.remove("text-red-400")
}

$("form#comment").submit((e) => {
    e.preventDefault();
    submit.disabled = true
    let _data_ = new FormData(e.target)
    _data_.append("postId", params.s)

    $.ajax({
        url: "/api/v1/post/comment",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: _data_
    }).done(function (response) {
        let res = JSON.parse(response)
        if (res.code === 1) {
            inputComment.value = ""
            countword_preview.innerHTML = ""
            comment.page = 0
            removeImg()
            query(0, "new")
            submit.disabled = false
        } else {
            submit.disabled = false
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


function deleteComment (id) {
    let deleteComment_data = new FormData()
    deleteComment_data.append("commentId", id)

    swal.fire({
        html: `<h1 class="text-3xl text-pink-300 font-semibold">โยนมันลงถังขยะ?</h1><div class="text-start">แน่ใจหรือไม่ที่ต้องการดำเนินการสิ่งนี้เม้นของคุณจะหายไปตลอดกาลและไม่สามารถกู้ได้</div>`,
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
                url: "/api/v1/post/remove/comment",
                method: "POST",
                processData: false,
                mimeType: "multipart/form-data",
                contentType: false,
                data: deleteComment_data
            }).done(function (response) {
                let res = JSON.parse(response)
                if (res.code === 1) {
                    inputComment.value = ""
                    countword_preview.innerHTML = ""
                    comment.page = 0
                    removeImg()
                    query(0, "new")
                    submit.disabled = false
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

function deletepost() {
    let deletepostData_ = new FormData()
    deletepostData_.append("postId", postData_.id)

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
                data: deletepostData_
            }).done(function (response) {
                let res = JSON.parse(response)
                if (res.code === 1) {
                    return window.location.replace("/")
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

function share() {
    if (navigator.share) {
        navigator.share({
            text: 'ลองดูสิ่งนี้สิ: ',
            url: "/status?s=" + postData_.id
        }).then(() => { })
            .catch((err) => console.error(err));
    } else {
        navigator.clipboard.writeText(location.hostname + "/status?s=" + postData_.id)
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
function like() {
    document.getElementById("like_button").disabled = true
    let data = new FormData()
    data.append("postId", postData_.id)
    $.ajax({
        url: "/api/v1/action/like",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (resp) {
        let res = JSON.parse(resp)
        document.getElementById("like_button").disabled = false
        if (res.code) {
            document.getElementById("like_button").innerHTML = `<i class="fas fa-heart"></i> ${res.code === 1 ? res.count : 0}`
            if (res.isLike) document.getElementById("like_button").classList.add("text-red-500")
            else document.getElementById("like_button").classList.remove("text-red-500")
        }
    })
}
function repost() {
    document.getElementById("repost_button").disabled = true
    let data = new FormData()
    data.append("postId", postData_.id)
    $.ajax({
        url: "/api/v1/action/repost",
        method: "POST",
        processData: false,
        mimeType: "multipart/form-data",
        contentType: false,
        data: data
    }).done(function (resp) {
        let res = JSON.parse(resp)
        document.getElementById("repost_button").disabled = false
        if (res.code) {
            document.getElementById("repost_button").innerHTML = `<i class="fas fa-sync-alt"></i> ${res.code === 1 ? res.count : 0}`
            if (res.isRepost) document.getElementById("repost_button").classList.add("text-lime-500")
            else document.getElementById("repost_button").classList.remove("text-lime-500")
        }
    })
}
function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
