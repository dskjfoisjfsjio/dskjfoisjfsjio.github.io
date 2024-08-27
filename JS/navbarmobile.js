const container = document.querySelector(".container");
const button = document.createElement("button");
const covercontainer = document.createElement("div");
const xoutbutton = document.createElement("button");
const navbar = document.querySelector(".container .nav-bar");
const navbardiv = document.querySelector(".nav");

button.className = "Nav-open";
button.textContent = "Menu";









if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    container.appendChild(button);

    button.addEventListener("click", () => {
        covercontainer.className = "cover";
        xoutbutton.className = "Xout";
        xoutbutton.textContent = "X";
        container.appendChild(covercontainer);
        container.appendChild(xoutbutton);
        navbar.style.display = "flex";
        navbar.style.flexDirection = "column";
        navbar.style.zIndex = "2";
        navbar.style.border = "none";
    });

    xoutbutton.addEventListener("click", () => {
        console.log("clicked");
        container.removeChild(covercontainer);
        container.removeChild(xoutbutton);
        navbar.style.display = "none"; 
    });
}
