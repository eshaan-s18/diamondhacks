import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { title, location, description } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Simulate generating a lesson plan
    const lessonPlan = `Lesson Plan for "${title}" at "${location}":\n\n${description}\n\nThis is a simulated lesson plan.`;

    return res.status(200).json({ lessonPlan });
  }

  return res.status(405).json({ error: "Method not allowed" });
}