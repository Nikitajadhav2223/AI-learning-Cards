
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
      title: `What is ${topic}?`,
      concept: `${topic} is one of the most fascinating and widely studied subjects across science and education. It forms the foundation of many modern discoveries and continues to inspire researchers worldwide. A deep understanding of ${topic} opens doors to innovation in technology, medicine, and beyond.`,
      funFact: `The earliest recorded study of ${topic} dates back thousands of years — ancient civilizations were already trying to understand and harness its principles long before modern science existed!`,
    },
    2: {
      title: `The Core Principles of ${topic}`,
      concept: `At the heart of ${topic} lie a set of governing rules that explain how and why things behave the way they do. These principles have been tested and verified through countless experiments over decades. Mastering these fundamentals of ${topic} is essential for anyone entering fields like engineering, research, or design.`,
      funFact: `Scientists once believed the principles of ${topic} had a completely different explanation — it took a revolutionary experiment to prove the current theory correct and change everything we knew!`,
    },
    3: {
      title: `${topic} Changing the World`,
      concept: `The real-world impact of ${topic} is visible everywhere — from the devices we use daily to the infrastructure that powers cities. Industries ranging from healthcare to aerospace rely on ${topic} to solve their most complex challenges. As technology advances, the role of ${topic} will only grow more critical in shaping our future.`,
      funFact: `NASA engineers use principles of ${topic} on every single mission they launch — without it, modern space exploration would be virtually impossible!`,
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