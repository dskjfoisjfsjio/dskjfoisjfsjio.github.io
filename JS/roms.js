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
        },

         {
            "href": "Games/N64/Mario Kart 64 (USA).z64",
            "class": "rom",
            "image": "game images/mario kart 64.jpg",
            "imagealt": "Mario Kart 64",
            "text": "Mario Kart 64"
        },


        {
            "href": "Games/N64/Mario Party 2 (USA).z64",
            "class": "rom",
            "image": "game images/mario party 2.jpg",
            "imagealt": "Mario Party 2",
            "text": "Mario Party 2"
        },


        {
            "href": "Games/N64/Pokemon Stadium (USA).z64",
            "class": "rom",
            "image": "game images/pokemonstadium.jpg",
            "imagealt": "Pokemon Stadium",
            "text": "Pokemon Stadium"
        },

        {
            "href": "Games/N64/Pokemon Stadium 2 (USA).z64",
            "class": "rom",
            "image": "game images/pokemonstadium2.jpg",
            "imagealt": "Pokemon Stadium 2",
            "text": "Pokemon Stadium 2"
        },

        {
            "href": "Games/N64/Super Smash Bros. (U) [!].z64",
            "class": "rom",
            "image": "game images/supersmashbros.jpg",
            "imagealt": "Super Smash Bros",
            "text": "Super Smash Bros"
        },

        {
            "href": "Games/NES/Punch-Out!! (USA).nes",
            "class": "rom",
            "image": "game images/punchout.jpg",
            "imagealt": "Punch Out",
            "text": "Punch Out!!"
        },

        
        {
            "href": "Games/NES/SMBros3.nes",
            "class": "rom",
            "image": "game images/super mario bros 3.jpg",
            "imagealt": "Super Mario Bros 3",
            "text": "Super Mario Bros 3"
        },

        {
            "href": "Games/NDS/mario kart ds.nds",
            "class": "rom",
            "image": "game images/mario kart ds.jpg",
            "imagealt": "Mario Kart DS",
            "text": "Mario Kart DS"
        },

        
        {
            "href": "Games/NDS/Namco Museum DS (USA).nds",
            "class": "rom",
            "image": "game images/namco.jpg",
            "imagealt": "Namco Museum",
            "text": "Namco Museum"
        },
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
