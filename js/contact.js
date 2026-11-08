document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".contact-form");
    const submitButton = document.querySelector(".contact-submit-btn");

    if (!form || !submitButton) return;

    let isSubmitting = false;

    // Create the status message dynamically.
    // No HTML or CSS changes are required.
    let statusElement = form.querySelector(".contact-form-status");

    if (!statusElement) {
        statusElement = document.createElement("div");
        statusElement.className = "contact-form-status";
        statusElement.setAttribute("role", "status");
        statusElement.setAttribute("aria-live", "polite");
        form.appendChild(statusElement);
    }

    const originalButtonContent = submitButton.innerHTML;

    /**
     * Display form feedback.
     */
    function showStatus(message, type = "error") {
        statusElement.textContent = message;
        statusElement.className = `contact-form-status ${type}`;
        statusElement.style.display = "block";
    }

    /**
     * Clear previous feedback.
     */
    function clearStatus() {
        statusElement.textContent = "";
        statusElement.className = "contact-form-status";
        statusElement.style.display = "none";
    }

    /**
     * Safely read and parse the API response.
     * Handles JSON, empty responses and unexpected server responses.
     */
    async function parseResponse(response) {
        const responseText = await response.text();

        if (!responseText) {
            throw new Error(
                response.ok
                    ? "The server returned an empty response. Please try again."
                    : `The request failed with status ${response.status}. Please try again.`
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(
                `The server returned an invalid response (${response.status}). Please try again later.`
            );
        }

        if (!response.ok || result.success !== true) {
            const message =
                result.message ||
                getErrorMessage(response.status);

            throw new Error(message);
        }

        return result;
    }

    /**
     * Provide fallback messages for HTTP errors.
     */
    function getErrorMessage(status) {
        switch (status) {
            case 400:
                return "Please check your information and try again.";

            case 405:
                return "This request method is not supported.";

            case 429:
                return "Too many enquiries have been submitted. Please wait before trying again.";

            case 500:
                return "A server error occurred. Please try again later.";

            case 503:
                return "The contact service is temporarily unavailable. Please try again later.";

            default:
                return "Unable to send your enquiry. Please try again.";
        }
    }

    /**
     * Validate the user's input before submission.
     */
    function validateForm(formData) {
        const name = (formData.get("name") || "").trim();
        const email = (formData.get("email") || "").trim();
        const message = (formData.get("message") || "").trim();

        if (name.length < 2) {
            return "Please enter a valid name.";
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return "Please enter a valid email address.";
        }

        if (message.length < 10) {
            return "Your message must contain at least 10 characters.";
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return "Please complete all required fields correctly.";
        }

        return null;
    }

    /**
     * Handle form submission.
     */
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) return;

        clearStatus();

        const formData = new FormData(form);

        // Client-side validation.
        const validationError = validateForm(formData);

        if (validationError) {
            showStatus(validationError, "error");
            return;
        }

        // Match the corrected api/contact.js payload.
        const payload = {
            name: (formData.get("name") || "").trim(),
            email: (formData.get("email") || "").trim(),
            phone: (formData.get("phone") || "").trim(),
            company: (formData.get("company") || "").trim(),

            // Optional field: sends an empty string if absent.
            subject: (formData.get("subject") || "").trim(),

            service: (formData.get("service") || "").trim(),
            budget: (formData.get("budget") || "").trim(),
            message: (formData.get("message") || "").trim(),

            consent: formData.get("consent") || "",

            // Honeypot field for spam protection.
            website: (formData.get("website") || "").trim()
        };

        isSubmitting = true;
        submitButton.disabled = true;
        submitButton.innerHTML = "Sending...";

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await parseResponse(response);

            showStatus(
                result.message || "Your enquiry has been sent successfully. Thank you for contacting NOIRCESS.",
                "success"
            );

            form.reset();

        } catch (error) {
            console.error("NOIRCESS contact form error:", error);

            showStatus(
                error.message || "Unable to send your enquiry. Please try again.",
                "error"
            );

        } finally {
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
        }
    });
});