document.addEventListener("DOMContentLoaded", () => {
    const searchbar = document.querySelector(".game-search");
    const games = document.querySelectorAll(".game-container a");

    searchbar.addEventListener("input", search);

    function search() {
        const searchQuery = searchbar.value.trim().toLowerCase();

        games.forEach((game) => {
            const gameName = game.querySelector(".game-text").textContent.toLowerCase();
            if (gameName.includes(searchQuery)) {
                game.style.display = "block";
            } else {
                game.style.display = "none";
            }
        });
    }
});
