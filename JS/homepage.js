document.addEventListener("DOMContentLoaded", () => {
    const themes = [
        "CSS/default.css",
        "CSS/theme1.css",
        "CSS/theme2.css",
        "CSS/theme3.css"
    ];

    let selectedTheme = parseInt(localStorage.getItem('selectedTheme')) || 0;
    let previousTheme = selectedTheme;

    function changeTheme(themeIndex) {
        const themeLink = document.getElementById('theme-link');
        if (themes[themeIndex]) {
            themeLink.href = themes[themeIndex];
            localStorage.setItem('selectedTheme', themeIndex);
            localStorage.removeItem('customtheme');
            document.body.style.backgroundImage = "";
        }
    }


    function loadTheme() {
        const selectedThemeIndex = localStorage.getItem('selectedTheme');
        const customThemeLink = localStorage.getItem('customtheme');

        if (selectedThemeIndex !== null) {
            changeTheme(selectedThemeIndex);
        }

        if (customThemeLink !== null) {
            document.body.style.backgroundImage = `url(${customThemeLink})`;
        }
    }

    loadTheme();

    const boxtwo = document.querySelector(".box2");
    const boxone = document.querySelector(".box1");
    const boxthree = document.querySelector(".box3");
    const boxfour = document.querySelector(".box4");

    function handleMouseOver(box, themeClass) {
        document.body.classList.add(themeClass);
        document.body.style.backgroundImage = "";
    }
    
    function handleMouseOut(box, themeClass) {
        document.body.classList.remove(themeClass);
        restoreTheme();
    }

    boxtwo.addEventListener("mouseover", () => handleMouseOver(boxtwo, 'slope-background'));
    boxtwo.addEventListener("mouseout", () => handleMouseOut(boxtwo, 'slope-background'));

    boxone.addEventListener("mouseover", () => handleMouseOver(boxone, 'oldwebsite-background'));
    boxone.addEventListener("mouseout", () => handleMouseOut(boxone, 'oldwebsite-background'));

    boxthree.addEventListener("mouseover", () => handleMouseOver(boxthree, 'disclaimer-background'));
    boxthree.addEventListener("mouseout", () => handleMouseOut(boxthree, 'disclaimer-background'));

    boxfour.addEventListener("mouseover", () => handleMouseOver(boxfour, 'black-background'));
    boxfour.addEventListener("mouseout", () => handleMouseOut(boxfour, 'black-background'));

    function restoreTheme() {
        const selectedThemeIndex = localStorage.getItem('selectedTheme');
        if (selectedThemeIndex !== null) {
            changeTheme(selectedThemeIndex);
        } else {
            const customThemeLink = localStorage.getItem('customtheme');
            if (customThemeLink !== null) {
                document.body.style.backgroundImage = `url(${customThemeLink})`;
            } else {
                document.body.style.backgroundImage = "";
            }
        }
    }
});