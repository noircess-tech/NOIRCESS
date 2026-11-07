
/* ============================================================
   NOIRCESS — CONTACT API
   File: api/contact.js

   Runtime: Node.js
   Platform: Vercel Serverless Functions

   Integrations:
   - Resend Email API
   - Upstash Redis
   - Upstash Rate Limiter

   Security:
   - Server-side validation
   - Input sanitisation
   - HTML escaping
   - Honeypot protection
   - Distributed rate limiting
   - Request-size restriction
   - Safe error responses
============================================================ */

import { Resend } from "resend";

import { Redis } from "@upstash/redis";

import { Ratelimit } from "@upstash/ratelimit";


/* ============================================================
   01. CONFIGURATION
============================================================ */

const RECIPIENT = "noircess@gmail.com";

const MAX_REQUEST_SIZE = 12 * 1024;

const ALLOWED_SERVICES = [
    "software-development",
    "digital-transformation",
    "creative-services",
    "technology-advisory",
    "it-support",
    "other"
];

const ALLOWED_BUDGETS = [
    "",
    "below-50000",
    "50000-100000",
    "100000-300000",
    "300000-500000",
    "500000-1000000",
    "above-1000000",
    "not-decided"
];

const SERVICE_LABELS = {
    "software-development": "Software Development",
    "digital-transformation": "Digital Transformation",
    "creative-services": "Creative Services",
    "technology-advisory": "Technology Advisory",
    "it-support": "IT Support",
    "other": "Other Enquiry"
};

const BUDGET_LABELS = {
    "": "Not specified",
    "below-50000": "Below KES 50,000",
    "50000-100000": "KES 50,000 – 100,000",
    "100000-300000": "KES 100,000 – 300,000",
    "300000-500000": "KES 300,000 – 500,000",
    "500000-1000000": "KES 500,000 – 1,000,000",
    "above-1000000": "Above KES 1,000,000",
    "not-decided": "Not yet decided"
};


/* ============================================================
   02. INITIALISE SERVICES
============================================================ */

let resendClient;

let rateLimiter;


function getResend() {

    if (resendClient) return resendClient;

    if (!process.env.RESEND_API_KEY) {

        throw new Error("Resend configuration missing.");

    }

    resendClient = new Resend(
        process.env.RESEND_API_KEY
    );

    return resendClient;

}


function getRateLimiter() {

    if (rateLimiter) return rateLimiter;

    const redis = Redis.fromEnv();

    rateLimiter = new Ratelimit({

        redis,

        limiter: Ratelimit.slidingWindow(
            5,
            "10 m"
        ),

        prefix: "noircess:contact",

        analytics: true,

        enableProtection: true

    });

    return rateLimiter;

}


/* ============================================================
   03. RESPONSE HELPER
============================================================ */

function respond(res, status, message, extra = {}) {

    return res.status(status).json({

        success: status >= 200 && status < 300,

        message,

        ...extra

    });

}


/* ============================================================
   04. INPUT SANITISATION
============================================================ */

function cleanString(value, maxLength) {

    if (typeof value !== "string") return "";

    return value

        .normalize("NFC")

        .replace(
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
            ""
        )

        .trim()

        .slice(0, maxLength);

}


function escapeHTML(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        character => ({

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            '"': "&quot;",

            "'": "&#39;"

        })[character]
    );

}


function normaliseEmail(value) {

    return cleanString(value, 254).toLowerCase();

}


/* ============================================================
   05. VALIDATION HELPERS
============================================================ */

function validEmail(email) {

    return (
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

}


function validPhone(phone) {

    if (!phone) return true;

    return /^\+?[0-9\s().-]{7,30}$/.test(phone);

}


function validConsent(value) {

    return (
        value === true ||
        value === "true" ||
        value === "yes" ||
        value === "on"
    );

}


/* ============================================================
   06. VALIDATE FORM DATA
============================================================ */

function validatePayload(data) {

    const errors = {};

    if (data.name.length < 2) {

        errors.name = "Please enter your full name.";

    }

    if (!validEmail(data.email)) {

        errors.email = "Please enter a valid email address.";

    }

    if (!validPhone(data.phone)) {

        errors.phone = "Please enter a valid phone number.";

    }

    if (data.company.length > 150) {

        errors.company = "Company name is too long.";

    }

    if (
        data.subject.length < 3 ||
        data.subject.length > 150
    ) {

        errors.subject = "Please enter a valid subject.";

    }

    if (!ALLOWED_SERVICES.includes(data.service)) {

        errors.service = "Please select a valid service.";

    }

    if (!ALLOWED_BUDGETS.includes(data.budget)) {

        errors.budget = "Please select a valid budget.";

    }

    if (
        data.message.length < 10 ||
        data.message.length > 5000
    ) {

        errors.message = "Please provide a message between 10 and 5000 characters.";

    }

    if (!validConsent(data.consent)) {

        errors.consent = "Consent is required.";

    }

    return errors;

}


/* ============================================================
   07. CLIENT IP
============================================================ */

function getClientIP(req) {

    const vercelIP =
        req.headers["x-vercel-forwarded-for"];

    if (
        typeof vercelIP === "string" &&
        vercelIP.trim()
    ) {

        return vercelIP.split(",")[0].trim();

    }

    const forwarded =
        req.headers["x-forwarded-for"];

    if (
        typeof forwarded === "string" &&
        forwarded.trim()
    ) {

        return forwarded.split(",")[0].trim();

    }

    return req.socket?.remoteAddress || null;

}


/* ============================================================
   08. EMAIL TEMPLATE
============================================================ */

function buildEmail(data) {

    const name = escapeHTML(data.name);

    const email = escapeHTML(data.email);

    const phone = escapeHTML(
        data.phone || "Not provided"
    );

    const company = escapeHTML(
        data.company || "Not provided"
    );

    const subject = escapeHTML(data.subject);

    const service = escapeHTML(
        SERVICE_LABELS[data.service]
    );

    const budget = escapeHTML(
        BUDGET_LABELS[data.budget]
    );

    const message = escapeHTML(data.message)
        .replace(/\r\n|\r|\n/g, "<br>");

    const html = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NOIRCESS Enquiry</title>
    </head>

    <body style="
        margin:0;
        padding:30px 15px;
        background:#f5f8ff;
        font-family:Arial,Helvetica,sans-serif;
        color:#07152e;
    ">

        <div style="
            max-width:650px;
            margin:0 auto;
            padding:30px;
            background:#ffffff;
            border:1px solid #e4edfa;
            border-radius:12px;
        ">

            <div style="
                padding-bottom:20px;
                border-bottom:1px solid #e4edfa;
            ">

                <h1 style="
                    margin:0;
                    font-size:25px;
                    color:#07152e;
                ">
                    NOIRCESS<span style="color:#0866ff;">.</span>
                </h1>

                <p style="
                    color:#0866ff;
                    font-size:11px;
                    font-weight:bold;
                    letter-spacing:2px;
                ">
                    TECHNOLOGY. INNOVATION. IMPACT.
                </p>

            </div>

            <h2>New Website Enquiry</h2>

            <p style="color:#657897;font-size:13px;">
                A new enquiry has been submitted through the NOIRCESS website.
            </p>

            <h3>Contact Information</h3>

            <table style="
                width:100%;
                border-collapse:collapse;
                font-size:13px;
            ">

                <tr>
                    <td style="padding:10px;color:#657897;">Name</td>
                    <td style="padding:10px;">${name}</td>
                </tr>

                <tr>
                    <td style="padding:10px;color:#657897;">Email</td>
                    <td style="padding:10px;">${email}</td>
                </tr>

                <tr>
                    <td style="padding:10px;color:#657897;">Phone</td>
                    <td style="padding:10px;">${phone}</td>
                </tr>

                <tr>
                    <td style="padding:10px;color:#657897;">Company</td>
                    <td style="padding:10px;">${company}</td>
                </tr>

            </table>

            <hr style="
                border:0;
                border-top:1px solid #e4edfa;
                margin:20px 0;
            ">

            <h3>Project Information</h3>

            <p><strong>Subject:</strong> ${subject}</p>

            <p><strong>Service:</strong> ${service}</p>

            <p><strong>Budget:</strong> ${budget}</p>

            <h3>Enquiry Message</h3>

            <div style="
                padding:18px;
                background:#f5f9ff;
                border-radius:8px;
                line-height:1.8;
                font-size:13px;
                overflow-wrap:anywhere;
            ">
                ${message}
            </div>

            <div style="
                margin-top:30px;
                padding-top:20px;
                border-top:1px solid #e4edfa;
                color:#91a1b9;
                font-size:11px;
            ">
                NOIRCESS — Technology. Innovation. Impact.
            </div>

        </div>

    </body>
    </html>
    `;

    const text = `
NOIRCESS — NEW WEBSITE ENQUIRY

CONTACT INFORMATION

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Company: ${data.company || "Not provided"}

PROJECT INFORMATION

Subject: ${data.subject}
Service: ${SERVICE_LABELS[data.service]}
Budget: ${BUDGET_LABELS[data.budget]}

MESSAGE

${data.message}

NOIRCESS
Technology. Innovation. Impact.
    `;

    return { html, text };

}


/* ============================================================
   09. MAIN API HANDLER
============================================================ */

export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    /* HTTP METHOD */

    if (req.method !== "POST") {

        res.setHeader("Allow", "POST");

        return respond(
            res,
            405,
            "Method not allowed."
        );

    }


    /* CONTENT TYPE */

    const contentType =
        req.headers["content-type"] || "";

    if (
        !contentType.toLowerCase().includes("application/json")
    ) {

        return respond(
            res,
            415,
            "Unsupported request format."
        );

    }


    /* REQUEST SIZE */

    const contentLength = Number(
        req.headers["content-length"] || 0
    );

    if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_REQUEST_SIZE
    ) {

        return respond(
            res,
            413,
            "Your submission is too large."
        );

    }


    try {

        /* BODY VALIDATION */

        const body = req.body;

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {

            return respond(
                res,
                400,
                "Invalid submission."
            );

        }

        if (
            Buffer.byteLength(
                JSON.stringify(body),
                "utf8"
            ) > MAX_REQUEST_SIZE
        ) {

            return respond(
                res,
                413,
                "Your submission is too large."
            );

        }


        /* HONEYPOT */

        const honeypot = cleanString(
            body.website,
            200
        );

        if (honeypot) {

            return respond(
                res,
                200,
                "Your enquiry has been received."
            );

        }


        /* SANITISE INPUT */

        const data = {

            name: cleanString(body.name, 100),

            email: normaliseEmail(body.email),

            phone: cleanString(body.phone, 30),

            company: cleanString(body.company, 150),

            service: cleanString(body.service, 100),

            budget: cleanString(body.budget, 100),

            subject: cleanString(body.subject, 150),

            message: cleanString(body.message, 5000),

            consent: body.consent

        };


        /* VALIDATION */

        const errors = validatePayload(data);

        if (Object.keys(errors).length > 0) {

            return res.status(400).json({

                success: false,

                message: "Please correct the highlighted fields.",

                errors

            });

        }


        /* RATE LIMITING */

        const ip = getClientIP(req);

        if (!ip || ip === "unknown") {

            return respond(
                res,
                503,
                "Unable to verify your connection. Please try again later."
            );

        }

        const limiter = getRateLimiter();

        const limit = await limiter.limit(ip);

        res.setHeader(
            "X-RateLimit-Limit",
            String(limit.limit)
        );

        res.setHeader(
            "X-RateLimit-Remaining",
            String(limit.remaining)
        );

        res.setHeader(
            "X-RateLimit-Reset",
            String(limit.reset)
        );

        if (!limit.success) {

            res.setHeader(
                "Retry-After",
                String(
                    Math.max(
                        1,
                        Math.ceil(
                            (limit.reset - Date.now()) / 1000
                        )
                    )
                )
            );

            return respond(
                res,
                429,
                "Too many enquiries. Please try again later."
            );

        }


        /* EMAIL CONFIGURATION */

        const fromEmail =
            process.env.CONTACT_FROM_EMAIL;

        if (!fromEmail || !process.env.RESEND_API_KEY) {

            throw new Error("Email service configuration missing.");

        }


        /* BUILD EMAIL */

        const email = buildEmail(data);


        /* SEND EMAIL */

        const resend = getResend();

        const result = await resend.emails.send({

            from: fromEmail,

            to: [RECIPIENT],

            replyTo: data.email,

            subject: `NOIRCESS Enquiry: ${data.subject} — ${data.name}`,

            html: email.html,

            text: email.text

        });


        if (result.error) {

            console.error(
                "[NOIRCESS EMAIL]",
                result.error.message
            );

            throw new Error("Email delivery failed.");

        }


        /* SUCCESS */

        return respond(
            res,
            200,
            "Thank you! Your enquiry has been received successfully."
        );


    } catch (error) {

        console.error(
            "[NOIRCESS CONTACT API]",
            error.message || "Unexpected server error."
        );

        return respond(
            res,
            500,
            "We could not process your enquiry. Please try again later."
        );

    }

}
