// ========================================
// NOIRCESS WEBSITE JAVASCRIPT
// ========================================


// ========================================
// MOBILE NAVIGATION
// ========================================

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        menuToggle.classList.toggle("active");
    });

    // Close menu when a navigation link is clicked
    const navLinks = navMenu.querySelectorAll("a");

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
            menuToggle.classList.remove("active");
        });
    });
}


// ========================================
// ACTIVE NAVIGATION LINK
// ========================================

const currentPage = window.location.pathname.split("/").pop();

const navigationLinks = document.querySelectorAll("nav a");

navigationLinks.forEach(link => {
    const linkPage = link.getAttribute("href");

    if (
        linkPage === currentPage ||
        (currentPage === "" && linkPage === "index.html")
    ) {
        link.classList.add("active");
    }
});


// ========================================
// SMOOTH SCROLLING
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function (event) {

        const targetId = this.getAttribute("href");

        if (targetId === "#") return;

        const target = document.querySelector(targetId);

        if (target) {
            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });

});


// ========================================
// SCROLL REVEAL ANIMATION
// ========================================

const revealElements = document.querySelectorAll(
    ".reveal, .service-card, .solution-card, .about-content, .about-image"
);

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }

        });

    },
    {
        threshold: 0.15
    }
);

revealElements.forEach(element => {
    revealObserver.observe(element);
});


// ========================================
// HEADER SCROLL EFFECT
// ========================================

const header = document.querySelector("header");

if (header) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

    });

}


// ========================================
// BACK TO TOP BUTTON
// ========================================

const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 400) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }

    });

    backToTop.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ========================================
// SERVICE CARD INTERACTION
// ========================================

const serviceCards = document.querySelectorAll(".service-card");

serviceCards.forEach(card => {

    card.addEventListener("click", () => {

        serviceCards.forEach(item => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

    });

});


// ========================================
// SOLUTION CARD INTERACTION
// ========================================

const solutionCards = document.querySelectorAll(".solution-card");

solutionCards.forEach(card => {

    card.addEventListener("click", () => {

        solutionCards.forEach(item => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

    });

});


// ========================================
// FAQ ACCORDION
// ========================================

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

    const question = item.querySelector(".faq-question");

    if (question) {

        question.addEventListener("click", () => {

            const isOpen = item.classList.contains("active");

            faqItems.forEach(faq => {
                faq.classList.remove("active");
            });

            if (!isOpen) {
                item.classList.add("active");
            }

        });

    }

});


// ========================================
// CONTACT FORM VALIDATION
// ========================================

const contactForm = document.querySelector("#contact-form");

if (contactForm) {

    contactForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const name = document.querySelector("#name");
        const email = document.querySelector("#email");
        const message = document.querySelector("#message");

        let valid = true;

        // Name validation
        if (name && name.value.trim() === "") {
            showError(name, "Please enter your name.");
            valid = false;
        } else if (name) {
            clearError(name);
        }

        // Email validation
        if (email && !validateEmail(email.value.trim())) {
            showError(email, "Please enter a valid email address.");
            valid = false;
        } else if (email) {
            clearError(email);
        }

        // Message validation
        if (message && message.value.trim() === "") {
            showError(message, "Please enter your message.");
            valid = false;
        } else if (message) {
            clearError(message);
        }

        if (valid) {

            showSuccessMessage(
                "Thank you! Your message has been submitted successfully."
            );

            contactForm.reset();

        }

    });

}


// ========================================
// EMAIL VALIDATION
// ========================================

function validateEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


// ========================================
// FORM ERROR
// ========================================

function showError(input, message) {

    input.classList.add("error");

    let errorMessage = input.parentElement.querySelector(".error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("small");

        errorMessage.className = "error-message";

        input.parentElement.appendChild(errorMessage);

    }

    errorMessage.textContent = message;

}


// ========================================
// CLEAR FORM ERROR
// ========================================

function clearError(input) {

    input.classList.remove("error");

    const errorMessage =
        input.parentElement.querySelector(".error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}


// ========================================
// SUCCESS MESSAGE
// ========================================

function showSuccessMessage(message) {

    let successMessage =
        document.querySelector(".success-message");

    if (!successMessage) {

        successMessage = document.createElement("div");

        successMessage.className = "success-message";

        contactForm.appendChild(successMessage);

    }

    successMessage.textContent = message;

}


// ========================================
// DYNAMIC FOOTER YEAR
// ========================================

const yearElement = document.querySelector("#current-year");

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}


// ========================================
// HERO TEXT ANIMATION
// ========================================

const heroText = document.querySelector(".hero-text");

if (heroText) {

    heroText.classList.add("hero-loaded");

}


// ========================================
// BUTTON CLICK EFFECT
// ========================================

const buttons = document.querySelectorAll(
    ".btn, .cta-button"
);

buttons.forEach(button => {

    button.addEventListener("click", () => {

        button.classList.add("clicked");

        setTimeout(() => {
            button.classList.remove("clicked");
        }, 300);

    });

});