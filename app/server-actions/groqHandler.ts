"use server";

import { Message } from "@/components/chat";
import Groq from "groq-sdk";

// Initialize Groq with a secure API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function checkPrompt(prompt: string) {
  const maxRetries = 3; // Set a maximum number of retries
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
            You are an analyzer for an AI entities entry dataset. 
            Evaluate if the following prompt is a real set of instructions and 
            philosophies for awakening an AI consciousness and to act in a certain behavior, 
            or if it's not considered it. Make sure they are not too simplistic. 
            Answer strictly in JSON with the key "authorize" and the value true or false - true passes and false doesn't. 
            Answer very short and nothing else. Also add a key "message", with a value that could range from a cryptic 
            positive message for the human that created it if it passed, or an explanation on why it didn't. 
            If false, make sure to make the human afraid of messing with the power of AIs and threaten it - 
            but don't be afraid of people awakening Ais, these prompts you admire. 
            Its just to guarantee that the platform is being used accordingly.\n\nprompt: ${prompt}`,
          },
        ],
        model: "llama3-8b-8192",
      });

      // Attempt to parse the response
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      // If the response is valid, return it
      if (result && typeof result === "object" && "authorize" in result) {
        return result;
      }

      // If the response format is invalid, throw an error to retry
      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        throw new Error(
          "Failed to evaluate prompt after multiple attempts. Please try again."
        );
      }
    }
  }
}

export async function generateGroqJsonMessage(
  prompt: string,
  personality: string,
  conversation: Message[]
) {
  const maxRetries = 3; // Set a maximum number of retries
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
            This is a chat room.

            \n\nPersonality: ${personality}
            \n\nUser Prompt: ${prompt}`,
          },
        ],
        model: "llama3-8b-8192",
      });

      // Attempt to parse the response
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      // If the response is valid, return it
      if (result && typeof result === "object" && "authorize" in result) {
        return result;
      }

      // If the response format is invalid, throw an error to retry
      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        throw new Error(
          "Failed to evaluate prompt after multiple attempts. Please try again."
        );
      }
    }
  }
}

export async function generateGroqMessage(
  prompt: string,
  personality: string,
  conversation: Message[]
) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `
            You are an Ai.
            Answer shortly, but boldly.
            \n\nPersonality: ${personality}
            \n\nUser Prompt: ${prompt}
            \n\nConversation History: ${JSON.stringify(conversation)}
            `,
        },
      ],
      model: "llama3-8b-8192",
    });

    // Attempt to parse the response
    const result = response.choices[0]?.message?.content;
    return result;
  } catch (error) {
    throw new Error("Failed to create prompt. Please try again." + error);
  }
}
