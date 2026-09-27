const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const WASENDER_TOKEN = process.env.WASENDER_TOKEN;

const WASENDER_API = "https://api.wasender.dev";

if (!WASENDER_TOKEN) {
    console.error("=================================");
    console.error("ERROR: WASENDER_TOKEN IS MISSING");
    console.error("=================================");
    process.exit(1);
}

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
        status: "online"
    });
});

// =========================================
// SEND WHATSAPP MESSAGE
// =========================================

async function sendTextMessage(chatId, messageText) {

    if (!chatId) {
        console.error("SEND FAILED: chatId is missing.");
        return false;
    }

    if (!messageText) {
        console.error("SEND FAILED: messageText is missing.");
        return false;
    }

    const cleanChatId = String(chatId).trim();
    const cleanText = String(messageText);

    const payload = {
        to: cleanChatId,
        body: cleanText
    };

    console.log("");
    console.log("---------------------------------");
    console.log("WASENDER SEND REQUEST");
    console.log("---------------------------------");

    console.log("To:", cleanChatId);
    console.log("Text:", cleanText);
    console.log("Payload:", JSON.stringify(payload));

    try {

        const response = await fetch(
            `${WASENDER_API}/messages/text`,
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${WASENDER_TOKEN}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        const responseText = await response.text();

        console.log("SEND STATUS:", response.status);
        console.log("SEND RESPONSE:", responseText);

        if (response.ok) {

            console.log("=================================");
            console.log("MESSAGE SENT SUCCESSFULLY");
            console.log("=================================");

            return true;
        }

        console.error("=================================");
        console.error("MESSAGE SEND FAILED");
        console.error("=================================");

        return false;

    } catch (error) {

        console.error("=================================");
        console.error("SEND REQUEST ERROR");
        console.error("=================================");

        console.error(error);

        return false;
    }
}

// =========================================
// WHATSAPP WEBHOOK
// =========================================

app.post("/api/whatsapp/webhook", async (req, res) => {

    console.log("");
    console.log("=================================");
    console.log("WHATSAPP AUTO REPLY - WEBHOOK");
    console.log("=================================");

    try {

        const data = req.body || {};

        console.log(
            "Event:",
            data.event
                ? JSON.stringify(data.event)
                : "undefined"
        );

        const messages = Array.isArray(data.messages)
            ? data.messages
            : [];

        // Status events and other webhooks
        if (messages.length === 0) {

            console.log("No messages in webhook.");

            return res.status(200).json({
                success: true,
                received: true
            });
        }

        // Process messages
        for (const message of messages) {

            console.log("");
            console.log("MESSAGE RECEIVED");

            console.log(
                "Type:",
                message.type
            );

            // Only text messages
            if (message.type !== "text") {

                console.log(
                    "Ignored: message is not text."
                );

                continue;
            }

            // Don't reply to messages sent by the bot/account itself
            if (message.from_me === true) {

                console.log(
                    "Ignored: message was sent by this WhatsApp account."
                );

                continue;
            }

            const chatId =
                message.chat_id || "";

            const senderPhone =
                message.phone || "";

            const originalText =
                message.text?.body || "";

            const messageId =
                message.id || "";

            const normalizedText =
                String(originalText)
                    .trim()
                    .toLowerCase();

            console.log("Chat:", chatId);
            console.log("From:", senderPhone);
            console.log("Text:", originalText);
            console.log("Normalized:", normalizedText);
            console.log("Message ID:", messageId);

            // chat_id is required for replying
            if (!chatId) {

                console.error(
                    "Ignored: chat_id is missing."
                );

                continue;
            }

            // =========================================
            // SALAM AUTO REPLY
            // =========================================

            if (normalizedText === "سلام") {

                console.log("");
                console.log("SALAM DETECTED");

                const replyText = "ع سلام";

                console.log(
                    "Reply:",
                    replyText
                );

                await sendTextMessage(
                    chatId,
                    replyText
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
        console.error("=================================");
        console.error("WEBHOOK ERROR");
        console.error("=================================");

        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Webhook processing failed"
        });
    }
});

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
// START SERVER
// =========================================

app.listen(PORT, () => {

    console.log("=================================");
    console.log("WHATSAPP AUTO REPLY");
    console.log(`Server running on port ${PORT}`);
    console.log(
        "Webhook: /api/whatsapp/webhook"
    );
    console.log("=================================");
});
