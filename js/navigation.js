
/* =========================================
   NOIRCESS — NAVIGATION JAVASCRIPT
   File: public/js/navigation.js
   ========================================= */

"use strict";

const NoircessNavigation = (() => {

    const selectors = {
        header: ".site-header",
        menuButton: ".header-menu-toggle",
        navigation: "#main-navigation",
        navigationLinks: ".header-nav__link"
    };


    let header;
    let menuButton;
    let navigation;


    /* =====================================
       UPDATE MENU STATE
    ====================================== */

    function setMenuState(isOpen) {

        if (!menuButton || !navigation) return;

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Toggle navigation"
        );

        navigation.classList.toggle(
            "is-open",
            isOpen
        );

        header?.classList.toggle(
            "navigation-open",
            isOpen
        );

        document.body.classList.toggle(
            "navigation-active",
            isOpen
        );

    }


    /* =====================================
       TOGGLE MENU
    ====================================== */

    function toggleMenu() {

        const isOpen =
            menuButton.getAttribute("aria-expanded") === "true";

        setMenuState(!isOpen);

    }


    /* =====================================
       CLOSE AFTER NAVIGATION
    ====================================== */

    function initNavigationLinks() {

        const links = navigation.querySelectorAll(
            selectors.navigationLinks
        );

        links.forEach(link => {

            link.addEventListener("click", () => {

                setMenuState(false);

            });

        });

    }


    /* =====================================
       ESCAPE KEY
    ====================================== */

    function initKeyboardControls() {

        document.addEventListener("keydown", event => {

            if (event.key !== "Escape") return;

            if (
                menuButton.getAttribute("aria-expanded") === "true"
            ) {
                setMenuState(false);
                menuButton.focus();
            }

        });

    }


    /* =====================================
       CLICK OUTSIDE NAVIGATION
    ====================================== */

    function initOutsideClick() {

        document.addEventListener("click", event => {

            const isOpen =
                menuButton.getAttribute("aria-expanded") === "true";

            if (!isOpen) return;

            if (!header.contains(event.target)) {
                setMenuState(false);
            }

        });

    }


    /* =====================================
       HANDLE RESIZE
    ====================================== */

    function initResize() {

        window.addEventListener("resize", () => {

            if (window.innerWidth > 900) {
                setMenuState(false);
            }

        });

    }


    /* =====================================
       INITIALISE
    ====================================== */

    function init() {

        header = document.querySelector(selectors.header);

        if (!header) return;

        menuButton = header.querySelector(
            selectors.menuButton
        );

        navigation = header.querySelector(
            selectors.navigation
        );

        if (!menuButton || !navigation) return;

        menuButton.addEventListener(
            "click",
            toggleMenu
        );

        initNavigationLinks();
        initKeyboardControls();
        initOutsideClick();
        initResize();

        setMenuState(false);

    }


    return {
        init,
        setMenuState
    };

})();


/* =========================================
   DOM READY
   ========================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        NoircessNavigation.init,
        { once: true }
    );

} else {

    NoircessNavigation.init();

}
