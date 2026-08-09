(function () {
    "use strict";

    const THEME_CLASSES = [
        "theme-royal",
        "theme-sage",
        "theme-ocean"
    ];

    function applyTheme(themeName) {
        const validTheme = [
            "royal",
            "sage",
            "ocean"
        ].includes(themeName)
            ? themeName
            : "royal";

        document.body.classList.remove(...THEME_CLASSES);
        document.body.classList.add(`theme-${validTheme}`);

        localStorage.setItem(
            "systemTheme",
            validTheme
        );

        const selector = document.querySelector(
            "[data-sidebar-theme]"
        );

        if (selector) {
            selector.value = validTheme;
        }
    }

    function initializeThemeSwitcher() {
        const selector = document.querySelector(
            "[data-sidebar-theme]"
        );

        const savedTheme =
            localStorage.getItem("systemTheme") ||
            "royal";

        applyTheme(savedTheme);

        if (!selector) {
            return;
        }

        selector.addEventListener("change", function () {
            applyTheme(this.value);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeThemeSwitcher,
            { once: true }
        );
    } else {
        initializeThemeSwitcher();
    }
})();
