const tailwindAlert = (style, msg) => {
    document.getElementById("alert").classList.add(["mb-1"])

    if(style == "err"){
        document.getElementById("alert").innerText = msg
        //style change
        document.getElementById("alert").classList.remove("hidden")
        document.getElementById("alert").classList.remove("text-pink-400")
        document.getElementById("alert").classList.add("text-red-500")
    }else if (style == "ok"){
        document.getElementById("alert").innerText = msg
        //style change
        document.getElementById("alert").classList.remove("hidden")
        document.getElementById("alert").classList.remove("text-red-500")
        document.getElementById("alert").classList.remove("text-pink-400")
        document.getElementById("alert").classList.add("text-lime-400")
    } else {
        document.getElementById("alert").innerText = msg
        //style change
        document.getElementById("alert").classList.remove("hidden")
        document.getElementById("alert").classList.remove("text-red-500")
        document.getElementById("alert").classList.add("text-pink-400")
    }
}