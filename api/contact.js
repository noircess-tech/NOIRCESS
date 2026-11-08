
/* =====================================================
   NOIRCESS — CONTACT API
   File: api/contact.js

   Runtime: Vercel Node.js
   Email: Resend
   Rate Limiting: Upstash Redis
===================================================== */

import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/* =====================================================
   CONFIGURATION
===================================================== */

const RECIPIENT = "noircess@gmail.com";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const redis = (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
)
    ? Redis.fromEnv()
    : null;

/* =====================================================
   RATE LIMITER
===================================================== */

const rateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "noircess:contact",
        analytics: true
    })
    : null;


/* =====================================================
   ALLOWED SERVICE VALUES
===================================================== */

const ALLOWED_SERVICES = [
    "Software Development",
    "Digital Transformation",
    "Creative Services",
    "Tech Advisory",
    "IT Support",

    "Website Development",
    "Mobile Application Development",
    "Enterprise Software Development",
    "API Integration",

    "Business Process Automation",
    "System Integration",
    "Digital Workflow Improvement",
    "Artificial Intelligence",

    "Graphic Design",
    "Branding & Identity Design",
    "UI/UX Design",
    "Digital Creative Content",

    "Platform Consulting",
    "Solutions Consulting",
    "Technology Assessment",
    "Risk Advisory",
    "IT Governance",

    "Technical Support",
    "System Maintenance",
    "Network Support",
    "IT Troubleshooting",

    "Other",
    "General Enquiry"
];


/* =====================================================
   SANITISATION
===================================================== */

function clean(value, maxLength = 2000) {

    if (typeof value !== "string") {
        return "";
    }

    return value
        .normalize("NFKC")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
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


/* =====================================================
   VALIDATION
===================================================== */

function validEmail(email) {

    return (
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

}


function validSubject(subject) {

    return (
        subject.length >= 3 &&
        subject.length <= 150 &&
        !/[\r\n]/.test(subject)
    );

}


function validService(service) {

    return ALLOWED_SERVICES.includes(service);

}


function validConsent(consent) {

    return (
        consent === true ||
        consent === "on" ||
        consent === "true" ||
        consent === "yes"
    );

}


/* =====================================================
   CLIENT IP
===================================================== */

function getClientIP(req) {

    const forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string") {

        const ip = forwarded.split(",")[0].trim();

        if (ip) return ip;

    }

    return (
        req.headers["x-real-ip"] ||
        "unknown"
    );

}


/* =====================================================
   RESPONSE HELPERS
===================================================== */

function success(res, message) {

    return res.status(200).json({
        success: true,
        message
    });

}


function failure(res, status, message) {

    return res.status(status).json({
        success: false,
        message
    });

}


/* =====================================================
   EMAIL TEMPLATE
===================================================== */

function createEmailHTML(data) {

    const safeName = escapeHTML(data.name);
    const safeEmail = escapeHTML(data.email);
    const safePhone = escapeHTML(data.phone);
    const safeCompany = escapeHTML(data.company);
    const safeSubject = escapeHTML(data.subject);
    const safeService = escapeHTML(data.service);
    const safeBudget = escapeHTML(data.budget);

    const safeMessage = escapeHTML(data.message)
        .replace(/\n/g, "<br>");

    return `
        <!DOCTYPE html>
        <html>
        <body style="
            margin:0;
            padding:30px;
            background:#f5f8ff;
            font-family:Arial,sans-serif;
            color:#07152e;
        ">

            <div style="
                max-width:650px;
                margin:auto;
                padding:30px;
                background:#ffffff;
                border:1px solid #e4edfa;
                border-radius:12px;
            ">

                <h2 style="color:#07152e;">
                    NOIRCESS
                    <span style="color:#0866ff;">.</span>
                </h2>

                <p style="color:#0866ff;">
                    NEW WEBSITE ENQUIRY
                </p>

                <h3>Contact Information</h3>

                <p><strong>Name:</strong> ${safeName}</p>
                <p><strong>Email:</strong> ${safeEmail}</p>
                <p><strong>Phone:</strong> ${safePhone || "Not provided"}</p>
                <p><strong>Company:</strong> ${safeCompany || "Not provided"}</p>

                <hr style="border:0;border-top:1px solid #e4edfa;">

                <h3>Project Information</h3>

                <p><strong>Subject:</strong> ${safeSubject || "Not provided"}</p>
                <p><strong>Service:</strong> ${safeService || "Not specified"}</p>
                <p><strong>Budget:</strong> ${safeBudget || "Not specified"}</p>

                <h3>Enquiry Message</h3>

                <div style="
                    padding:18px;
                    background:#f5f9ff;
                    border-radius:8px;
                    line-height:1.8;
                    overflow-wrap:anywhere;
                ">
                    ${safeMessage}
                </div>

                <p style="
                    margin-top:30px;
                    color:#657897;
                    font-size:12px;
                ">
                    Received through the NOIRCESS website contact form.
                </p>

            </div>

        </body>
        </html>
    `;
}


/* =====================================================
   MAIN API HANDLER
===================================================== */

export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method !== "POST") {

        res.setHeader("Allow", "POST");

        return failure(
            res,
            405,
            "Method not allowed."
        );

    }

    try {

        /* ---------------------------------------------
           CHECK CONFIGURATION
        --------------------------------------------- */

        if (!resend || !rateLimiter) {

            console.error(
                "NOIRCESS: Missing Resend or Upstash configuration."
            );

            return failure(
                res,
                503,
                "The enquiry service is temporarily unavailable. Please try again later."
            );

        }


        /* ---------------------------------------------
           VALIDATE REQUEST BODY
        --------------------------------------------- */

        const body = req.body;

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {

            return failure(
                res,
                400,
                "Invalid request."
            );

        }


        /* ---------------------------------------------
           HONEYPOT SPAM PROTECTION
        --------------------------------------------- */

        const website = clean(body.website, 200);

        if (website) {

            // Do not reveal the honeypot to bots.
            return success(
                res,
                "Your enquiry has been received."
            );

        }


        /* ---------------------------------------------
           SANITISE INPUT
        --------------------------------------------- */

        const data = {

            name: clean(body.name, 100),

            email: clean(body.email, 254),

            phone: clean(body.phone, 30),

            company: clean(body.company, 150),

            subject: clean(body.subject, 150),

            service: clean(body.service, 150),

            budget: clean(body.budget, 100),

            message: clean(body.message, 5000)

        };


        /* ---------------------------------------------
           REQUIRED FIELD VALIDATION
        --------------------------------------------- */

        if (data.name.length < 2) {

            return failure(
                res,
                400,
                "Please enter your full name."
            );

        }

        if (!validEmail(data.email)) {

            return failure(
                res,
                400,
                "Please enter a valid email address."
            );

        }

        if (data.subject && !validSubject(data.subject)) {

            return failure(
                res,
                400,
                "Please enter a valid enquiry subject."
            );

        }

        if (data.service && !validService(data.service)) {

            return failure(
                res,
                400,
                "Please select a valid service."
            );

        }

        if (data.message.length < 10) {

            return failure(
                res,
                400,
                "Please provide more details about your enquiry."
            );

        }

        if (!validConsent(body.consent)) {

            return failure(
                res,
                400,
                "Please agree to the contact terms."
            );

        }


        /* ---------------------------------------------
           RATE LIMITING
           5 REQUESTS PER IP / 15 MINUTES
        --------------------------------------------- */

        const ip = getClientIP(req);

        if (ip === "unknown") {

            return failure(
                res,
                400,
                "Unable to verify your request. Please try again."
            );

        }

        const rateLimit = await rateLimiter.limit(ip);

        res.setHeader(
            "X-RateLimit-Limit",
            String(rateLimit.limit)
        );

        res.setHeader(
            "X-RateLimit-Remaining",
            String(rateLimit.remaining)
        );

        if (!rateLimit.success) {

            if (rateLimit.reset) {

                res.setHeader(
                    "Retry-After",
                    String(
                        Math.max(
                            1,
                            Math.ceil(
                                (rateLimit.reset - Date.now()) / 1000
                            )
                        )
                    )
                );

            }

            return failure(
                res,
                429,
                "You have submitted too many enquiries. Please try again in 15 minutes."
            );

        }


        /* ---------------------------------------------
           EMAIL DELIVERY
        --------------------------------------------- */

        const emailResult = await resend.emails.send({

            from: process.env.CONTACT_FROM_EMAIL,

            to: [RECIPIENT],

            replyTo: data.email,

            subject: `New NOIRCESS Enquiry — ${
                data.subject || data.service || data.name
            }`,

            html: createEmailHTML(data)

        });


        /* ---------------------------------------------
           HANDLE RESEND ERRORS
        --------------------------------------------- */

        if (emailResult.error || !emailResult.data?.id) {

            console.error(
                "NOIRCESS Resend delivery error:",
                emailResult.error
            );

            return failure(
                res,
                502,
                "We could not deliver your enquiry. Please try again later."
            );

        }


        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        console.info(
            "NOIRCESS enquiry delivered:",
            emailResult.data.id
        );

        return success(
            res,
            "Your enquiry has been received successfully."
        );


    } catch (error) {

        console.error(
            "NOIRCESS contact API error:",
            error
        );

        return failure(
            res,
            500,
            "An unexpected error occurred. Please try again later."
        );

    }

}
