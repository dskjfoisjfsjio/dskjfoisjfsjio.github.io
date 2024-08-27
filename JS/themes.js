function changeTheme(themeIndex) {
    const themes = [
        "CSS/default.css",
        "CSS/theme1.css",
        "CSS/theme2.css",
        "CSS/theme3.css"
    ];

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
    const customthemelink = localStorage.getItem('customtheme');

    if (selectedThemeIndex !== null) {
        changeTheme(selectedThemeIndex);
    }

    if (customthemelink !== null) {
        document.body.style.backgroundImage = `url(${customthemelink})`;
    }
}