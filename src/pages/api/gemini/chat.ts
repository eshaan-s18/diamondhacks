import { NextApiRequest, NextApiResponse } from "next";
import { VertexAI } from "@google-cloud/aiplatform";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Initialize Vertex AI client
      const vertexAI = new VertexAI({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, // Use the project ID from the .env file
        location: "us-central1", // Adjust the location if needed
      });

      // Define the chat context and user message
      const chatContext = context
        ? context.split("\n").map((line) => {
            const [role, content] = line.startsWith("You:")
              ? ["user", line.replace("You: ", "")]
              : ["assistant", line.replace("Gemini: ", "")];
            return { role, content };
          })
        : [];

      // Add the current user message to the context
      chatContext.push({ role: "user", content: message });

      // Call the Gemini API
      const [response] = await vertexAI.chat({
        model: "gemini-1", // Use the appropriate Gemini model
        messages: chatContext,
      });

      // Extract the assistant's reply
      const reply = response?.content || "No response from Gemini.";

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Error interacting with Gemini API:", error);
      return res.status(500).json({ error: "Failed to interact with Gemini API" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}