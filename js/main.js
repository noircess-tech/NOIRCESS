
/* =========================================
   NOIRCESS — MAIN JAVASCRIPT
   File: public/js/main.js
   ========================================= */

"use strict";

const NoircessMain = (() => {

    const config = {
        revealSelector: "[data-reveal]",
        visibleClass: "is-visible",
        pendingClass: "reveal-pending",
        yearSelector: "[data-current-year]"
    };


    /* =====================================
       INITIALISE REVEAL ANIMATIONS
    ====================================== */

    function initRevealAnimations() {

        const elements = document.querySelectorAll(
            config.revealSelector
        );

        if (!elements.length) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reducedMotion || !("IntersectionObserver" in window)) {
            elements.forEach(element => {
                element.classList.add(config.visibleClass);
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) return;

                    entry.target.classList.add(
                        config.visibleClass
                    );

                    entry.target.classList.remove(
                        config.pendingClass
                    );

                    currentObserver.unobserve(entry.target);
                });

            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        elements.forEach((element, index) => {

            element.classList.add(config.pendingClass);

            element.style.transitionDelay =
                `${Math.min(index % 4, 3) * 90}ms`;

            observer.observe(element);

        });
    }


    /* =====================================
       CURRENT COPYRIGHT YEAR
    ====================================== */

    function initCurrentYear() {

        const yearElements = document.querySelectorAll(
            config.yearSelector
        );

        const currentYear = new Date().getFullYear();

        yearElements.forEach(element => {
            element.textContent = currentYear;
        });

    }


    /* =====================================
       INITIALISE
    ====================================== */

    function init() {

        initCurrentYear();
        initRevealAnimations();

    }


    return {
        init,
        initCurrentYear,
        initRevealAnimations
    };

})();


/* =========================================
   DOM READY
   ========================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        NoircessMain.init,
        { once: true }
    );

} else {

    NoircessMain.init();

}
