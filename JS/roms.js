document.addEventListener("DOMContentLoaded", () => {
    const roms = [
        {
            "href": "ROMS/Pokemon - Ruby Version (USA, Europe) (Rev 2).gba",
            "class": "rom",
            "image": "Rom Images/Pokemon Ruby.jpg",
            "imagealt": "Pokemon Ruby Version",
            "text": "Pokemon Ruby Version"
        },
        {
            "href": "ROMS/Pokemon - Sapphire Version (USA, Europe) (Rev 2).gba",
            "class": "rom",
            "image": "Rom Images/Pokemon Sapphire.jpg",
            "imagealt": "Pokemon Sapphire Version",
            "text": "Pokemon Sapphire Version"
        },
        {
            "href": "ROMS/Pokemon - Emerald Version (USA, Europe).gba",
            "class": "rom",
            "image": "Rom Images/Pokemon Emerald.jpg",
            "imagealt": "Pokemon Emerald Version",
            "text": "Pokemon Emerald Version"
        },

        {
            "href": "ROMS/Pokemon - FireRed Version (USA, Europe) (Rev 1).gba",
            "class": "rom",
            "image": "Rom Images/Pokemon Firered.jpg",
            "imagealt": "Pokemon Firered Version",
            "text": "Pokemon Firered Version"
        },

        {
            "href": "ROMS/Pokemon - LeafGreen Version (USA, Europe) (Rev 1).gba",
            "class": "rom",
            "image": "Rom Images/Pokemon Leafgreen.jpg",
            "imagealt": "Pokemon Leafgreen Version",
            "text": "Pokemon Leafgreen Version"
        },


        {
            "href": "ROMS/Mario Kart Super Circuit (U) [!].gba",
            "class": "rom",
            "image": "Rom Images/Mariokart.jpg",
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
