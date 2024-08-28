document.addEventListener("DOMContentLoaded", () => {
    const roms = [
        {
            "href": "roms/pokemon - ruby version (usa, europe) (rev 2).gba",
            "class": "rom",
            "image": "rom images/pokemon ruby.jpg",
            "imagealt": "Pokemon Ruby Version",
            "text": "Pokemon Ruby Version"
        },
        {
            "href": "roms/pokemon - sapphire version (usa, europe) (rev 2).gba",
            "class": "rom",
            "image": "rom images/pokemon sapphire.jpg",
            "imagealt": "Pokemon Sapphire Version",
            "text": "Pokemon Sapphire Version"
        },
        {
            "href": "roms/pokemon - emerald version (usa, europe).gba",
            "class": "rom",
            "image": "rom images/pokemon emerald.jpg",
            "imagealt": "Pokemon Emerald Version",
            "text": "Pokemon Emerald Version"
        },

        {
            "href": "roms/pokemon - firered version (usa, europe) (rev 1).gba",
            "class": "rom",
            "image": "rom images/pokemon firered.jpg",
            "imagealt": "Pokemon Firered Version",
            "text": "Pokemon Firered Version"
        },

        {
            "href": "roms/pokemon - leafgreen version (usa, europe) (rev 1).gba",
            "class": "rom",
            "image": "rom images/pokemon leafgreen.jpg",
            "imagealt": "Pokemon Leafgreen Version",
            "text": "Pokemon Leafgreen Version"
        },


        {
            "href": "roms/mario kart super circuit (u) [!].gba",
            "class": "rom",
            "image": "rom images/mariokart.jpg",
            "imagealt": "Mario Kart Super Circuit",
            "text": "Mario Kart Super Circuit"
        }
    ];

    function createIcons() {
        const container = document.querySelector(".container");
    
        const romContainer = document.createElement("div");
        romContainer.className = "Rom-container";
    
        roms.forEach(rom => {
            const link = document.createElement("a");
            link.href = rom.href;
            link.className = rom.class;
    
            const romIconContainer = document.createElement("div");
            romIconContainer.className = "rom-holder";
    
            const image = document.createElement("img");
            image.alt = rom.imagealt;
            image.src = rom.image;
            image.height = 200;
            image.width = 200;
    
            const headingText = document.createElement("h1");
            headingText.className = "rom-text";
            headingText.textContent = rom.text;
    
            romIconContainer.appendChild(image);
            romIconContainer.appendChild(headingText);
            link.appendChild(romIconContainer);
            romContainer.appendChild(link);
        });
    
        container.appendChild(romContainer);
    }
    
    createIcons();
    
});
