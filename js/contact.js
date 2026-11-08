
/* =====================================================
   NOIRCESS — CONTACT FORM
   File: contact.js
   Backend: Formspree
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".contact-form");

    if (!form) return;

    // Formspree Configuration
    const FORMSPREE_ENDPOINT =
        "https://formspree.io/f/YOUR_FORM_ID";

    const submitButton = form.querySelector(
        ".contact-submit-btn"
    );

    const originalButtonContent =
        submitButton?.innerHTML;

    // Create status message without changing HTML
    const status = document.createElement("div");

    status.className = "contact-form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    form.appendChild(status);

    // Display submission status
    function showStatus(message, type) {
        status.textContent = message;
        status.dataset.type = type;
    }

    // Get form field
    function getField(name) {
        return form.querySelector(`[name="${name}"]`);
    }

    // Get trimmed field value
    function getValue(name) {
        return getField(name)?.value.trim() || "";
    }

    // Form validation
    function validateForm() {

        const name = getValue("name");
        const email = getValue("email");
        const message = getValue("message");

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name.length < 2) {
            showStatus(
                "Please enter your full name.",
                "error"
            );

            getField("name")?.focus();
            return false;
        }

        if (!emailPattern.test(email)) {
            showStatus(
                "Please enter a valid email address.",
                "error"
            );

            getField("email")?.focus();
            return false;
        }

        if (message.length < 10) {
            showStatus(
                "Please provide more details about your enquiry.",
                "error"
            );

            getField("message")?.focus();
            return false;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        return true;
    }

    // Form submission
    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        // Prevent duplicate submissions
        if (submitButton?.disabled) return;

        // Honeypot spam protection
        if (getValue("website")) {
            console.warn(
                "NOIRCESS: Spam submission detected."
            );

            form.reset();
            return;
        }

        // Validate form
        if (!validateForm()) return;

        try {

            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Sending...";
            }

            showStatus(
                "Sending your enquiry...",
                "loading"
            );

            // Prepare form data
            const formData = new FormData(form);

            // Submit directly to Formspree
            const response = await fetch(
                FORMSPREE_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Accept": "application/json"
                    },

                    body: formData
                }
            );

            const result = await response.json();

            // Handle unsuccessful submission
            if (!response.ok) {

                throw new Error(
                    result.errors
                        ?.map(error => error.message)
                        .join(", ") ||
                    result.error ||
                    "Unable to send your enquiry."
                );
            }

            // Successful submission
            showStatus(
                "Thank you! Your enquiry has been sent successfully. Our team will get back to you.",
                "success"
            );

            // Reset form
            form.reset();

        } catch (error) {

            console.error(
                "NOIRCESS contact form error:",
                error
            );

            showStatus(
                error.message ||
                "Something went wrong. Please try again.",
                "error"
            );

        } finally {

            // Restore submit button
            if (submitButton) {
                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalButtonContent;
            }
        }
    });

});
