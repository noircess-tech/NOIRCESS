
/* ============================================================
   NOIRCESS — CONTACT FORM
   File: public/js/contact.js

   Features:
   - Client-side validation
   - Backend integration
   - Field-level error messages
   - Loading and success states
   - Duplicate submission prevention
   - Accessible status feedback
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".contact-form");

    if (!form) return;

    const button = form.querySelector(".contact-submit-btn");

    if (!button) return;

    const originalButtonContent = button.innerHTML;

    let isSubmitting = false;

    /* ========================================================
       01. STATUS MESSAGE
    ======================================================== */

    let status = form.querySelector(".contact-form-status");

    if (!status) {

        status = document.createElement("div");

        status.className = "contact-form-status";

        status.setAttribute("role", "status");

        status.setAttribute("aria-live", "polite");

        form.appendChild(status);

    }


    function showStatus(message, type = "info") {

        status.textContent = message;

        status.dataset.type = type;

    }


    /* ========================================================
       02. FIELD HELPERS
    ======================================================== */

    function getField(name) {

        return form.querySelector(`[name="${name}"]`);

    }


    function getValue(name) {

        const field = getField(name);

        if (!field) return "";

        if (field.type === "checkbox") {
            return field.checked;
        }

        return typeof field.value === "string"
            ? field.value.trim()
            : "";

    }


    /* ========================================================
       03. FIELD ERROR HANDLING
    ======================================================== */

    function clearFieldError(field) {

        if (!field) return;

        field.removeAttribute("aria-invalid");

        const error = field.parentElement?.querySelector(
            `[data-error-for="${field.name}"]`
        );

        error?.remove();

    }


    function clearAllErrors() {

        form.querySelectorAll("[data-error-for]").forEach(
            error => error.remove()
        );

        form.querySelectorAll("[aria-invalid]").forEach(
            field => field.removeAttribute("aria-invalid")
        );

    }


    function showFieldError(name, message) {

        const field = getField(name);

        if (!field) return;

        clearFieldError(field);

        field.setAttribute("aria-invalid", "true");

        const error = document.createElement("small");

        error.className = "contact-field-error";

        error.dataset.errorFor = name;

        error.setAttribute("role", "alert");

        error.textContent = message;

        field.insertAdjacentElement("afterend", error);

    }


    function displayErrors(errors = {}) {

        clearAllErrors();

        const fields = Object.keys(errors);

        fields.forEach(name => {

            showFieldError(name, errors[name]);

        });

        if (fields.length > 0) {

            getField(fields[0])?.focus();

        }

    }


    /* ========================================================
       04. CLIENT-SIDE VALIDATION
    ======================================================== */

    function validateForm() {

        clearAllErrors();

        const errors = {};

        const name = getValue("name");

        const email = getValue("email");

        const phone = getValue("phone");

        const subject = getValue("subject");

        const service = getValue("service");

        const message = getValue("message");

        const consent = getValue("consent");

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const phonePattern =
            /^\+?[0-9\s().-]{7,30}$/;

        const allowedServices = [
            "software-development",
            "digital-transformation",
            "creative-services",
            "technology-advisory",
            "it-support",
            "other"
        ];


        if (name.length < 2) {

            errors.name =
                "Please enter your full name.";

        }

        if (!emailPattern.test(email)) {

            errors.email =
                "Please enter a valid email address.";

        }

        if (
            phone &&
            !phonePattern.test(phone)
        ) {

            errors.phone =
                "Please enter a valid phone number.";

        }

        if (subject.length < 3) {

            errors.subject =
                "Please enter a subject.";

        }

        if (!allowedServices.includes(service)) {

            errors.service =
                "Please select a valid service.";

        }

        if (message.length < 10) {

            errors.message =
                "Please provide more details about your enquiry.";

        }

        if (consent !== true) {

            errors.consent =
                "Please agree to the processing of your information.";

        }


        if (Object.keys(errors).length > 0) {

            displayErrors(errors);

            showStatus(
                "Please correct the highlighted fields.",
                "error"
            );

            return false;

        }

        return true;

    }


    /* ========================================================
       05. REMOVE FIELD ERRORS ON INPUT
    ======================================================== */

    form.addEventListener("input", event => {

        const field = event.target;

        if (field.name) {

            clearFieldError(field);

        }

        if (status.dataset.type === "error") {

            showStatus("", "info");

        }

    });


    form.addEventListener("change", event => {

        const field = event.target;

        if (field.name) {

            clearFieldError(field);

        }

    });


    /* ========================================================
       06. BUTTON STATE
    ======================================================== */

    function setLoading(loading) {

        button.disabled = loading;

        button.setAttribute(
            "aria-busy",
            String(loading)
        );

        if (loading) {

            button.textContent = "Sending...";

        } else {

            button.innerHTML = originalButtonContent;

        }

    }


    /* ========================================================
       07. FORM SUBMISSION
    ======================================================== */

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (isSubmitting) return;

        if (!validateForm()) return;

        if (!form.reportValidity()) return;

        isSubmitting = true;

        setLoading(true);

        showStatus(
            "Sending your enquiry...",
            "loading"
        );


        /* Build payload */

        const payload = {

            name: getValue("name"),

            email: getValue("email"),

            phone: getValue("phone"),

            company: getValue("company"),

            service: getValue("service"),

            budget: getValue("budget"),

            subject: getValue("subject"),

            message: getValue("message"),

            consent: getValue("consent"),

            website: getValue("website")

        };


        try {

            const response = await fetch("/api/contact", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(payload)

            });


            const result = await response.json();


            /* Handle backend validation errors */

            if (response.status === 400 && result.errors) {

                displayErrors(result.errors);

                showStatus(
                    result.message ||
                    "Please correct the highlighted fields.",
                    "error"
                );

                return;

            }


            /* Handle rate limiting */

            if (response.status === 429) {

                showStatus(
                    result.message ||
                    "Too many submissions. Please try again later.",
                    "error"
                );

                return;

            }


            /* Handle other backend errors */

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Unable to send your enquiry."
                );

            }


            /* Successful submission */

            form.reset();

            clearAllErrors();

            showStatus(
                result.message ||
                "Thank you! Your enquiry has been sent successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "NOIRCESS contact form:",
                error
            );

            showStatus(
                error.message ||
                "Something went wrong. Please try again.",
                "error"
            );


        } finally {

            isSubmitting = false;

            setLoading(false);

        }

    });

});
