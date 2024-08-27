document.addEventListener("DOMContentLoaded", () => {
    const searchbar = document.querySelector(".rom-search");
    const games = document.querySelectorAll(".Rom-container a");

    searchbar.addEventListener("input", search);

    function search() {
        const searchQuery = searchbar.value.trim().toLowerCase();

        games.forEach((game) => {
            const gameName = game.querySelector(".rom-text").textContent.toLowerCase();
            if (gameName.includes(searchQuery)) {
                game.style.display = "block";
            } else {
                game.style.display = "none";
            }
        });
    }
});
