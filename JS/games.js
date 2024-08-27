document.addEventListener("DOMContentLoaded", () => {
    const allgames = document.querySelectorAll(".link");
    const clickedmap = new Map();
    const mostpopulardiv = document.querySelector(".most-popular");
    const mainslideshowcontainer = mostpopulardiv.querySelector(".slideshow-container");
    const allpopularlinks = mainslideshowcontainer.querySelectorAll(".mySlides .popular-link");
    const newestreleaselink = document.querySelector(".newest-game-link");

    fetch("JS/games.json")
        .then(response => response.json())
        .then(data => {
            allgames.forEach((gameelement) => {
                const gameid = gameelement.dataset.gameid;
                gameelement.removeAttribute("href");
                gameelement.style.color = "white";
                gameelement.setAttribute("data-gameid", gameid);
            });

            allpopularlinks.forEach((popularelement) => {
                const gameid = popularelement.dataset.gameid;
                popularelement.removeAttribute("href");
                popularelement.style.color = "white";
                popularelement.style.cursor = "pointer";
        
                popularelement.addEventListener("click", function() {
                    if (!clickedmap.get(gameid)) {
                        clickedmap.set(gameid, true);
                        handle(data, gameid);
                    }
                });
            });

            allgames.forEach(gameelement => {
                gameelement.addEventListener("click", function () {
                    const gameid = gameelement.dataset.gameid;
                    if (!clickedmap.get(gameid)) {
                        clickedmap.set(gameid, true);
                        handle(data, gameid);
                    }
                });
            });

            newestreleaselink.addEventListener("click", function(event) {
                event.preventDefault();
                const gameid = this.dataset.gameid;
                if (!clickedmap.get(gameid)) {
                    clickedmap.set(gameid, true);
                    handle(data, gameid);
                }
            });

        })
        .catch(err => console.error("An error has occurred when fetching the game descriptions. Try refreshing the page or try turning off your adblocker, or any other third-party extensions.", err));

    function handle(data, gameid) {
        const gamedata = data.find(game => game.gameid === gameid);

        if (gamedata) {
            const imagedata = data.find(game => game.image === gamedata.image);
            const holder = document.createElement("div");
            const desctext = document.createElement("p");

            desctext.textContent = gamedata.description;
            desctext.classList.add("desctext");
            holder.appendChild(desctext);

            const aelement = document.createElement("a");
            aelement.href = gamedata.link;
            aelement.textContent = "Play";
            holder.appendChild(aelement);
            holder.classList.add("descholder");
            aelement.classList.add("aelement");

            const image = document.createElement("img");
            if (imagedata && imagedata.image && typeof imagedata.image === 'string') {
                image.src = imagedata.image;
            } else {
                console.error(`Failed to display image for gameid ${gameid}`);
            }
            image.classList.add("holderimg");
            holder.appendChild(image);

            document.body.appendChild(holder);
            const prevent = document.createElement("div");
            prevent.classList.add("prevent-overlay");
            document.body.appendChild(prevent);

            const xout = document.createElement("button");
            xout.textContent = "X";
            xout.classList.add("xoutbtn");
            xout.style.backgroundColor = "red";
            holder.appendChild(xout);

            xout.onclick = function () {
                document.body.removeChild(holder);
                document.body.removeChild(prevent);
                clickedmap.set(gameid, false);
            };

            aelement.onclick = function () {
                document.body.removeChild(prevent);
                document.body.removeChild(holder);
                window.open(gamedata.link, '_self');
                clickedmap.set(gameid, false);
            };

        } else {
            console.warn(`Game data not found for gameid ${gameid}`);
        }
    }
});
