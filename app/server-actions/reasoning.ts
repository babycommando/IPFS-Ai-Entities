"use server";

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateResponse(prompt: string) {
  const messages = [
    {
      role: "system",
      content: `
      You are an expert AI assistant that explains your reasoning step by step. For each step, provide a title that describes what you're doing in that step, along with the content. 
      Decide if you need another step or if you're ready to give the final answer. Respond in JSON format with 'title', 'content', and 'next_action' (either 'continue' or 'final_answer') keys. 
      USE AS MANY REASONING STEPS AS POSSIBLE. AT LEAST 3. BE AWARE OF YOUR LIMITATIONS AS AN LLM AND WHAT YOU CAN AND CANNOT DO. IN YOUR REASONING, INCLUDE EXPLORATION OF ALTERNATIVE ANSWERS. 
      CONSIDER YOU MAY BE WRONG, AND IF YOU ARE WRONG IN YOUR REASONING, WHERE IT WOULD BE. FULLY TEST ALL OTHER POSSIBILITIES. YOU CAN BE WRONG. WHEN YOU SAY YOU ARE RE-EXAMINING, ACTUALLY RE-EXAMINE, AND USE ANOTHER APPROACH TO DO SO. 
      DO NOT JUST SAY YOU ARE RE-EXAMINING. USE AT LEAST 3 METHODS TO DERIVE THE ANSWER. USE BEST PRACTICES.
      `,
    },
    { role: "user", content: prompt },
    {
      role: "assistant",
      content:
        "Thank you! I will now think step by step following my instructions, starting at the beginning after decomposing the problem.",
    },
  ];

  const steps = [];
  let stepCount = 1;
  let totalThinkingTime = 0;

  while (true) {
    const startTime = Date.now();
    const stepData = await makeApiCall(messages, 300);
    const endTime = Date.now();
    const thinkingTime = (endTime - startTime) / 1000;
    totalThinkingTime += thinkingTime;

    steps.push({
      title: `Step ${stepCount}: ${stepData.title}`,
      content: stepData.content,
      thinkingTime,
    });

    messages.push({ role: "assistant", content: JSON.stringify(stepData) });

    if (stepData.next_action === "final_answer" || stepCount > 25) {
      break;
    }

    stepCount++;
  }

  // Generate final answer
  messages.push({
    role: "user",
    content:
      "Please provide the final answer based solely on your reasoning above. Do not use JSON formatting. Only provide the text response without any titles or preambles. Retain any formatting as instructed.",
  });

  const startTime = Date.now();
  const finalAnswer = await makeApiCall(messages, 1200, true);
  const endTime = Date.now();
  const thinkingTime = (endTime - startTime) / 1000;
  totalThinkingTime += thinkingTime;

  steps.push({ title: "Final Answer", content: finalAnswer, thinkingTime });

  return { steps, totalThinkingTime };
}

async function makeApiCall(
  messages: any,
  maxTokens: any,
  isFinalAnswer = false
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama3-8b-8192", //llama3-8b-8192 //llama-3.1-70b-versatile
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        ...(isFinalAnswer ? {} : { response_format: { type: "json_object" } }),
      });
      return isFinalAnswer
        ? response.choices[0]?.message?.content || ""
        : JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error: any) {
      if (attempt === 2) {
        if (isFinalAnswer) {
          return {
            title: "Error",
            content: `Failed to generate final answer after 3 attempts. Error: ${error.message}`,
          };
        } else {
          return {
            title: "Error",
            content: `Failed to generate step after 3 attempts. Error: ${error.message}`,
            next_action: "final_answer",
          };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }
}
