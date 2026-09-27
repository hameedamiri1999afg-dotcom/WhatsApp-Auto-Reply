const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const WASENDER_TOKEN = process.env.WASENDER_TOKEN;

if (!WASENDER_TOKEN) {
    console.error("ERROR: WASENDER_TOKEN is missing.");
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// =====================================
// HOME
// =====================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "WhatsApp Auto Reply",
        status: "online"
    });
});

// =====================================
// STATUS
// =====================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        service: "WhatsApp Auto Reply",
        status: "online"
    });
});

// =====================================
// SEND TEXT MESSAGE
// =====================================

async function sendTextMessage(to, text) {

    if (!to || !text) {
        console.error("SEND FAILED: Missing to or text.");
        return false;
    }

    const url = "https://api.wasender.dev/messages/text";

    console.log("---------------------------------");
    console.log("WASENDER SEND REQUEST");
    console.log("To:", to);
    console.log("Text:", text);

    try {

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Authorization": `Bearer ${WASENDER_TOKEN}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                to: to,
                text: text
            })
        });

        const responseText = await response.text();

        console.log("SEND STATUS:", response.status);
        console.log("SEND RESPONSE:", responseText);

        if (response.ok) {
            console.log("MESSAGE SENT SUCCESSFULLY");
            console.log("---------------------------------");
            return true;
        }

        console.error("MESSAGE SEND FAILED");
        console.log("---------------------------------");

        return false;

    } catch (error) {

        console.error("SEND REQUEST ERROR:", error);
        console.log("---------------------------------");

        return false;
    }
}

// =====================================
// WHATSAPP WEBHOOK
// =====================================

app.post("/api/whatsapp/webhook", async (req, res) => {

    console.log("");
    console.log("=================================");
    console.log("WHATSAPP AUTO REPLY - WEBHOOK");
    console.log("=================================");

    try {

        const data = req.body || {};

        const messages = Array.isArray(data.messages)
            ? data.messages
            : [];

        if (messages.length === 0) {

            console.log("No messages in webhook.");

            return res.status(200).json({
                success: true,
                received: true
            });
        }

        for (const message of messages) {

            if (message.type !== "text") {
                continue;
            }

            if (message.from_me === true) {
                continue;
            }

            const originalText =
                message.text?.body || "";

            const text =
                String(originalText)
                    .trim()
                    .toLowerCase();

            const chatId = message.chat_id;

            console.log("");
            console.log("MESSAGE RECEIVED");
            console.log("Chat:", chatId);
            console.log("From:", message.phone);
            console.log("Text:", originalText);
            console.log("Message ID:", message.id);

            // =================================
            // SALAM
            // =================================

            if (text === "سلام") {

                console.log("SALAM DETECTED");

                await sendTextMessage(
                    chatId,
                    "ع سلام"
                );

            } else {

                console.log("No automatic reply.");
            }
        }

        return res.status(200).json({
            success: true,
            received: true
        });

    } catch (error) {

        console.error(
            "WEBHOOK ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Webhook processing failed"
        });
    }
});

// =====================================
// 404
// =====================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        error: "Not Found"
    });
});

// =====================================
// START
// =====================================

app.listen(PORT, () => {

    console.log("=================================");
    console.log("WHATSAPP AUTO REPLY");
    console.log(`Server running on port ${PORT}`);
    console.log(
        "Webhook: /api/whatsapp/webhook"
    );
    console.log("=================================");
});
