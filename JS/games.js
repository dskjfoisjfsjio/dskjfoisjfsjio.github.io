document.addEventListener("DOMContentLoaded", () => {
    const allgames = document.querySelectorAll(".link");
    const clickedmap = new Map();
    const mostpopulardiv = document.querySelector(".most-popular");
    const mainslideshowcontainer = mostpopulardiv.querySelector(".slideshow-container");
    const allpopularlinks = mainslideshowcontainer.querySelectorAll(".mySlides .popular-link");
    const newestreleaselink = document.querySelector(".newest-game-link");
    const input = document.getElementById('game-search');
    const suggestionsContainer = document.getElementById('suggestions');
    const recentGamesContainer = document.querySelector(".recently-played");
    let gamesData = [];

    fetch("JS/games.json")
        .then(response => response.json())
        .then(data => {
            gamesData = data;
            setupGameLinks(data);
            displayRecentlyPlayedGames();
        })
        .catch(err => console.error("An error has occurred when fetching the game descriptions.", err));

    function setupGameLinks(data) {
        allgames.forEach((gameelement) => {
            const gameid = gameelement.dataset.gameid;
            gameelement.removeAttribute("href");
            gameelement.style.color = "white";
            gameelement.setAttribute("data-gameid", gameid);
            gameelement.addEventListener("click", () => playGame(gameid));
        });

        allpopularlinks.forEach((popularelement) => {
            const gameid = popularelement.dataset.gameid;
            popularelement.removeAttribute("href");
            popularelement.style.color = "white";
            popularelement.style.cursor = "pointer";
            popularelement.addEventListener("click", () => playGame(gameid));
        });

        newestreleaselink.addEventListener("click", function(event) {
            event.preventDefault();
            const gameid = this.dataset.gameid;
            playGame(gameid);
        });

        input.addEventListener('input', function() {
            const query = input.value.toLowerCase();
            suggestionsContainer.innerHTML = '';

            if (query) {
                const filteredGames = gamesData.filter(game => game.game.toLowerCase().includes(query));
                filteredGames.forEach(game => {
                    const div = document.createElement('div');
                    div.textContent = game.game;
                    div.classList.add('suggestion-item');
                    div.addEventListener('click', () => {
                        input.value = game.game;
                        suggestionsContainer.innerHTML = '';
                        playGame(game.gameid);
                    });
                    suggestionsContainer.appendChild(div);
                });
            }
        });

        document.addEventListener('click', (event) => {
            if (!suggestionsContainer.contains(event.target) && event.target !== input) {
                suggestionsContainer.innerHTML = '';
            }
        });
    }

    function playGame(gameid) {
        if (!clickedmap.get(gameid)) {
            clickedmap.set(gameid, true);
            handle(gamesData, gameid);
            updateRecentlyPlayedGames(gameid);
        }
    }

    function updateRecentlyPlayedGames(gameid) {
        let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
        recentlyPlayed = recentlyPlayed.filter(item => item.id !== gameid);
        recentlyPlayed.unshift({ id: gameid, date: new Date().toLocaleDateString() });
    
        if (recentlyPlayed.length > 5) {
            recentlyPlayed.pop();
        }
    
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
        displayRecentlyPlayedGames();
    }
    
    function displayRecentlyPlayedGames() {
        const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
        
        if (recentGamesContainer) {
            recentGamesContainer.innerHTML = '';
    
            const title = document.createElement("h1");
            title.classList.add("recently-played-title");
            title.textContent = "Recently Played Games";
            recentGamesContainer.appendChild(title);
    
            if (recentlyPlayed.length > 0) {
                recentlyPlayed.forEach(item => {
                    const gameData = gamesData.find(game => game.gameid === item.id);
                    if (gameData) {
                        const gameCard = document.createElement("div");
                        gameCard.classList.add("game-card");
    
                        const gameImage = document.createElement("img");
                        gameImage.src = gameData.image;
                        gameImage.alt = gameData.game;
    
                        const gameTitle = document.createElement("div");
                        gameTitle.classList.add("game-title");
                        gameTitle.textContent = gameData.game;
    
                        const gameLink = document.createElement("a");
                        gameLink.href = gameData.link;
                        gameLink.textContent = "Play Now";
                        gameLink.classList.add("play-link");
    
                        const gamePlayed = document.createElement("div");
                        gamePlayed.classList.add("game-played");
                        gamePlayed.textContent = "Played on: " + item.date;
    
                        gameCard.appendChild(gameImage);
                        gameCard.appendChild(gameTitle);
                        gameCard.appendChild(gameLink);
                        gameCard.appendChild(gamePlayed);
                        recentGamesContainer.appendChild(gameCard);
                    }
                });
            } else {
                const noGamesMessage = document.createElement("p");
                noGamesMessage.textContent = "No recently played games.";
                recentGamesContainer.appendChild(noGamesMessage);
            }
        }
    }
    
    

    function handle(data, gameid) {
        const gamedata = data.find(game => game.gameid === gameid);

        if (gamedata) {
            const container = document.createElement("div");
            container.classList.add("descholder");

            const image = document.createElement("img");
            image.src = gamedata.image;
            image.classList.add("holderimg");
            container.appendChild(image);

            const descriptionContainer = document.createElement("div");
            descriptionContainer.classList.add("description-content");

            const desctext = document.createElement("p");
            desctext.textContent = gamedata.description;
            desctext.classList.add("desctext");
            descriptionContainer.appendChild(desctext);

            const aelement = document.createElement("a");
            aelement.href = gamedata.link;
            aelement.textContent = "Play Now";
            aelement.classList.add("aelement");
            descriptionContainer.appendChild(aelement);

            container.appendChild(descriptionContainer);

            const xout = document.createElement("button");
            xout.textContent = "X";
            xout.classList.add("xoutbtn");
            xout.style.backgroundColor = "red";
            container.appendChild(xout);

            const prevent = document.createElement("div");
            prevent.classList.add("prevent-overlay");
            document.body.appendChild(prevent);

            document.body.appendChild(container);

            xout.onclick = function () {
                document.body.removeChild(container);
                document.body.removeChild(prevent);
                clickedmap.set(gameid, false);
            };

            aelement.onclick = function () {
                document.body.removeChild(prevent);
                document.body.removeChild(container);
                window.open(gamedata.link, '_self');
                clickedmap.set(gameid, false);
            };
        } else {
            console.warn(`Game data not found for gameid ${gameid}`);
        }
    }
});
