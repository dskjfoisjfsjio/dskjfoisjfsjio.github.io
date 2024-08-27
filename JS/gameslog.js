document.addEventListener("DOMContentLoaded", () =>{
    const icon = document.createElement("link");
            const favicon = "/new logo.png";
            icon.type = "image/png";
            icon.href = favicon;
            icon.rel = "icon";
            document.head.appendChild(icon);
}
)