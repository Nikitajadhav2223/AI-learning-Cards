// import { WebSocketServer } from "ws";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";

// dotenv.config();

// const PORT = process.env.PORT || 3001;
// const wss = new WebSocketServer({ port: PORT });

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// // Helper: send a structured message to the client
// function send(ws, data) {
//   if (ws.readyState === 1) {
//     ws.send(JSON.stringify(data));
//   }
// }

// // Generate a single card via Gemini
// async function generateCard(topic, cardNumber, ws, simulateFailure = false) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = `Generate learning card #${cardNumber} of 3 about "${topic}".
// Return ONLY valid JSON (no markdown, no backticks) in this exact format:
// {
//   "title": "A short catchy card title",
//   "concept": "2-3 sentences explaining a key concept about the topic.",
//   "funFact": "One surprising or memorable fun fact about the topic."
// }`;

//   send(ws, { type: "card_start", cardIndex: cardNumber - 1 });

//   // Simulate failure: Card 3 fails on first attempt (simulateFailure flag)
//   if (simulateFailure && cardNumber === 3) {
//     // Simulate partial delay before failing
//     await new Promise((r) => setTimeout(r, 1200));
//     send(ws, {
//       type: "card_error",
//       cardIndex: cardNumber - 1,
//       error: "Connection interrupted while generating Card 3.",
//     });
//     return false;
//   }

//   try {
//     const result = await model.generateContent(prompt);
//     const text = result.response.text().trim();

//     // Strip markdown code fences if model adds them anyway
//     const cleaned = text.replace(/```json|```/g, "").trim();
//     const card = JSON.parse(cleaned);

//     send(ws, {
//       type: "card_complete",
//       cardIndex: cardNumber - 1,
//       card: { ...card, id: cardNumber },
//     });
//     return true;
//   } catch (err) {
//     console.error(`Card ${cardNumber} error:`, err.message);
//     send(ws, {
//       type: "card_error",
//       cardIndex: cardNumber - 1,
//       error: "Failed to generate this card. Please retry.",
//     });
//     return false;
//   }
// }

// wss.on("connection", (ws) => {
//   console.log("Client connected");
//   let hasFailedCard3 = false; // track if card 3 already failed this session

//   ws.on("message", async (raw) => {
//     let msg;
//     try {
//       msg = JSON.parse(raw.toString());
//     } catch {
//       send(ws, { type: "error", error: "Invalid message format." });
//       return;
//     }

//     // ── GENERATE all 3 cards ──────────────────────────────────────────────
//     if (msg.type === "generate") {
//       const { topic, mode } = msg; // mode: "success" | "failure"
//       const simulateFailure = mode === "failure";
//       hasFailedCard3 = simulateFailure;

//       send(ws, { type: "start", topic });

//       for (let i = 1; i <= 3; i++) {
//         // Only simulate failure on first pass; retry always succeeds
//         const fail = simulateFailure && i === 3;
//         await generateCard(topic, i, ws, fail);
//         // Small gap between cards for better UX
//         if (i < 3) await new Promise((r) => setTimeout(r, 300));
//       }

//       send(ws, { type: "done" });
//     }

//     // ── RETRY card 3 only ─────────────────────────────────────────────────
//     if (msg.type === "retry_card") {
//       const { topic, cardIndex } = msg;
//       console.log(`Retrying card ${cardIndex + 1} for topic: "${topic}"`);
//       // Retry always succeeds (simulateFailure = false)
//       await generateCard(topic, cardIndex + 1, ws, false);
//       send(ws, { type: "retry_done", cardIndex });
//     }
//   });

//   ws.on("close", () => console.log("Client disconnected"));
//   ws.on("error", (err) => console.error("WS error:", err.message));
// });

// console.log(`WebSocket server running on ws://localhost:${PORT}`);





import { WebSocketServer } from "ws";

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

function send(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function getMockCard(topic, cardNumber) {
  const cards = {
    1: {
      title: `Introduction to ${topic}`,
      concept: `${topic} is a fundamental concept that shapes our understanding of the world. It involves key principles that have been studied and refined over centuries of research and observation. Understanding ${topic} gives us powerful tools to explain natural phenomena.`,
      funFact: `Did you know? The study of ${topic} has led to some of the most important discoveries in human history, revolutionizing how we see the universe!`,
    },
    2: {
      title: `Core Principles of ${topic}`,
      concept: `The core principles of ${topic} are built on a foundation of careful observation and experimentation. Scientists and researchers have developed mathematical models to describe ${topic} with incredible precision. These principles apply universally, from the smallest particles to the largest structures.`,
      funFact: `Fun fact: Many everyday technologies we take for granted — from smartphones to medical devices — rely directly on principles of ${topic}!`,
    },
    3: {
      title: `${topic} in the Real World`,
      concept: `${topic} has countless real-world applications that affect our daily lives. From engineering to medicine, the principles of ${topic} are applied to solve complex problems and create innovative solutions. Its impact on modern society cannot be overstated.`,
      funFact: `Amazing fact: Researchers are currently exploring how ${topic} could be used to develop breakthrough technologies that will transform industries in the next decade!`,
    },
  };
  return cards[cardNumber];
}

async function generateCard(topic, cardNumber, ws, simulateFailure = false) {
  send(ws, { type: "card_start", cardIndex: cardNumber - 1 });

  if (simulateFailure && cardNumber === 3) {
    await new Promise((r) => setTimeout(r, 1500));
    send(ws, {
      type: "card_error",
      cardIndex: cardNumber - 1,
      error: "Connection interrupted while generating Card 3.",
    });
    return false;
  }

  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

  const card = getMockCard(topic, cardNumber);

  send(ws, {
    type: "card_complete",
    cardIndex: cardNumber - 1,
    card: { ...card, id: cardNumber },
  });
  return true;
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", error: "Invalid message format." });
      return;
    }

    if (msg.type === "generate") {
      const { topic, mode } = msg;
      const simulateFailure = mode === "failure";
      send(ws, { type: "start", topic });

      for (let i = 1; i <= 3; i++) {
        const fail = simulateFailure && i === 3;
        await generateCard(topic, i, ws, fail);
        if (i < 3) await new Promise((r) => setTimeout(r, 300));
      }

      send(ws, { type: "done" });
    }

    if (msg.type === "retry_card") {
      const { topic, cardIndex } = msg;
      await generateCard(topic, cardIndex + 1, ws, false);
      send(ws, { type: "retry_done", cardIndex });
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (err) => console.error("WS error:", err.message));
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);