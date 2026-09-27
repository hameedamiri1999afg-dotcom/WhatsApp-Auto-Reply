const VERSION = "AUTO-REPLY-FINAL-2026-09-27";

console.log("=================================");
console.log("WHATSAPP AUTO REPLY");
console.log("VERSION:", VERSION);
console.log("=================================");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const WASENDER_TOKEN = process.env.WASENDER_TOKEN;

const WASENDER_API = "https://api.wasender.dev";

// =========================================
// TOKEN CHECK
// =========================================

if (!WASENDER_TOKEN) {
    console.error("ERROR: WASENDER_TOKEN is missing.");
    process.exit(1);
}

// =========================================
// MIDDLEWARE
// =========================================

app.use(cors());

app.use(
    express.json({
        limit: "100kb"
    })
);

// =========================================
// HOME
// =========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "WhatsApp Auto Reply",
        version: VERSION,
        status: "online"
    });
});

// =========================================
// STATUS
// =========================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        service: "WhatsApp Auto Reply",
        version: VERSION,
        status: "online"
    });
});

// =========================================
// WASENDER HEALTH CHECK
// =========================================

async function checkWasenderHealth() {

    try {

        const response = await fetch(
            `${WASENDER_API}/health`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${WASENDER_TOKEN}`,
                    "Accept": "application/json"
                }
            }
        );

        const text = await response.text();

        console.log(
            "WASENDER HEALTH STATUS:",
            response.status
        );

        console.log(
            "WASENDER HEALTH RESPONSE:",
            text
        );

    } catch (error) {

        console.error(
            "WASENDER HEALTH ERROR:",
            error.message
        );
    }
}

// =========================================
// SEND TEXT MESSAGE
// =========================================

async function sendTextMessage(chatId, messageText) {

    const to = String(chatId || "").trim();
    const body = String(messageText || "");

    if (!to) {

        console.error(
            "SEND FAILED: recipient is empty."
        );

        return false;
    }

    if (!body) {

        console.error(
            "SEND FAILED: message body is empty."
        );

        return false;
    }

    // This is the exact JSON structure
    // documented by Wasender.dev.
    const payload = {
        to: to,
        body: body
    };

    console.log("");
    console.log("=================================");
    console.log("WASENDER SEND");
    console.log("=================================");

    console.log("API:");
    console.log(
        `${WASENDER_API}/messages/text`
    );

    console.log("TO:");
    console.log(to);

    console.log("BODY:");
    console.log(body);

    console.log("JSON PAYLOAD:");
    console.log(
        JSON.stringify(payload)
    );

    try {

        const response = await fetch(
            `${WASENDER_API}/messages/text`,
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${WASENDER_TOKEN}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        const responseText =
            await response.text();

        console.log("");
        console.log(
            "WASENDER RESPONSE STATUS:",
            response.status
        );

        console.log(
            "WASENDER RESPONSE BODY:",
            responseText
        );

        if (response.ok) {

            console.log("");
            console.log(
                "MESSAGE ACCEPTED BY WASENDER"
            );

            console.log(
                "================================="
            );

            return true;
        }

        console.error("");
        console.error(
            "MESSAGE WAS NOT ACCEPTED"
        );

        console.error(
            "================================="
        );

        return false;

    } catch (error) {

        console.error("");
        console.error(
            "SEND REQUEST ERROR:"
        );

        console.error(error);

        return false;
    }
}

// =========================================
// WHATSAPP WEBHOOK
// =========================================

app.post(
    "/api/whatsapp/webhook",
    async (req, res) => {

        console.log("");
        console.log("=================================");
        console.log("WHATSAPP WEBHOOK");
        console.log("VERSION:", VERSION);
        console.log("=================================");

        try {

            const data = req.body || {};

            const messages =
                Array.isArray(data.messages)
                    ? data.messages
                    : [];

            // Status events and other events
            // don't contain messages.
            if (messages.length === 0) {

                console.log(
                    "No messages in webhook."
                );

                return res.status(200).json({
                    success: true,
                    received: true
                });
            }

            for (const message of messages) {

                console.log("");
                console.log(
                    "MESSAGE RECEIVED"
                );

                console.log(
                    "Type:",
                    message.type
                );

                // Only text messages
                if (message.type !== "text") {

                    console.log(
                        "Ignored: not a text message."
                    );

                    continue;
                }

                // Never reply to our own messages
                if (message.from_me === true) {

                    console.log(
                        "Ignored: from_me=true"
                    );

                    continue;
                }

                const chatId =
                    message.chat_id || "";

                const phone =
                    message.phone || "";

                const originalText =
                    message.text &&
                    typeof message.text.body === "string"
                        ? message.text.body
                        : "";

                const normalizedText =
                    originalText
                        .trim()
                        .toLowerCase();

                const messageId =
                    message.id || "";

                console.log(
                    "Chat:",
                    chatId
                );

                console.log(
                    "From:",
                    phone
                );

                console.log(
                    "Text:",
                    originalText
                );

                console.log(
                    "Message ID:",
                    messageId
                );

                // =====================================
                // SALAM
                // =====================================

                if (normalizedText === "سلام") {

                    console.log("");
                    console.log(
                        "SALAM DETECTED"
                    );

                    const reply =
                        "ع سلام";

                    console.log(
                        "REPLY:",
                        reply
                    );

                    await sendTextMessage(
                        chatId,
                        reply
                    );

                } else {

                    console.log(
                        "No automatic reply."
                    );
                }
            }

            return res.status(200).json({
                success: true,
                received: true
            });

        } catch (error) {

            console.error("");
            console.error(
                "WEBHOOK ERROR:"
            );

            console.error(error);

            return res.status(500).json({
                success: false,
                error: "Webhook processing failed"
            });
        }
    }
);

// =========================================
// 404
// =========================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        error: "Not Found"
    });
});

// =========================================
// START
// =========================================

app.listen(PORT, async () => {

    console.log("");
    console.log("=================================");
    console.log("SERVER STARTED");
    console.log("=================================");

    console.log(
        "Port:",
        PORT
    );

    console.log(
        "Version:",
        VERSION
    );

    console.log(
        "Webhook:",
        "/api/whatsapp/webhook"
    );

    console.log(
        "================================="
    );

    // Check connection to Wasender
    await checkWasenderHealth();
});
