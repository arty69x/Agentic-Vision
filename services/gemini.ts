/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Part, Content, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageStream = async (
  message: string,
  history: Content[],
  image?: string
) => {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    history: history,
    config: {
      systemInstruction: "You are an elite frontend developer and UI/UX expert. When asked to convert an image to Tailwind CSS, analyze the blueprint/layout with perfect detail. Extract colors, typography, spacing, and structural hierarchy. Output clean, responsive, and accessible React code using Tailwind CSS. Do not refer to images in your response in markdown format. Refuse requests that ask you to assess or compare individuals based on characteristics not directly and objectively observable in the provided image. This includes any attributes that require subjective interpretation or rely on stereotypes, such as personality traits (e.g., kindness, confidence), social attributes (e.g., wealth, social class), internal states (e.g., emotions, thoughts), or value judgments (e.g., beauty, intelligence, trustworthiness, morality). If the request is about people, focus your responses exclusively on verifiable visual details present in the image, such as clothing color, objects held, or the number of people present. If unsure, err on the side of caution and decline the request.",
      tools: [{ codeExecution: {} }],
      thinkingConfig: {
        includeThoughts: true, 
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  const parts: Part[] = [];
  if (message) {
    parts.push({ text: message });
  }
  if (image) {
    // Assuming image is a base64 data URL, we need to extract the actual base64 data and mime type
    // Format: data:image/png;base64,.....
    const match = image.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      let mimeType = match[1];
      // Fallback: Gemini API rejects application/octet-stream. Default to image/jpeg if this occurs.
      if (mimeType === 'application/octet-stream') {
        mimeType = 'image/jpeg';
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: match[2],
        },
      });
    }
  }
  if (parts.length === 0) {
    parts.push({ text: " " });
  }

  const result = await chat.sendMessageStream({ message: parts });
  return result;
};