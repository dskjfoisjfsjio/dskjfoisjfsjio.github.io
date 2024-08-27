document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container");
    
  

    function isLandscape() {
        const orientation = window.orientation;
        return orientation === 90 || orientation === -90;
    }


    function handleOrientationChange() {
        const cover = document.createElement("div");
        const header = document.createElement("h1");
        const text = document.createElement("p");
        const rotateimg = document.createElement("img");

        cover.className = "landscapecover";
        header.textContent = "Your screen is not large enough to embed this in landscape mode";
        text.textContent = "Please rotate back to portrait mode to continue use";
        rotateimg.src = "/rotate.png";

        function updateCover() {
            if (isLandscape()) {
                document.body.appendChild(cover);
                cover.appendChild(header);
                cover.appendChild(text);
                cover.appendChild(rotateimg);
                container.style.display = "none";
            } else {
                if (cover.parentNode) {
                    cover.remove();
                }
                container.style.display = "block";
            }
        }

        window.addEventListener("orientationchange", updateCover);
        updateCover();
    }

    handleOrientationChange();


});
