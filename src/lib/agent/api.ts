import { env } from "../../lib/env.js";

export async function sendAgentMessage(
  endpoint: string,
  conversationId: string,
  message: string
) {
  const appUrl = env.NEXT_PUBLIC_AGENT_URL;
  const externalApiUrl = `${appUrl}${endpoint}`;

  try {
    const messageResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-secret": env.RECEIVE_AGENT_SECRET,
      },
      body: JSON.stringify({
        conversationId,
        message,
      }),
    });

    if (!messageResponse.ok) {
      throw new Error(`HTTP error! status: ${messageResponse.status}`);
    }

    return await messageResponse.json();
  } catch (error) {
    console.error("Failed to send agent message:", error);
    throw error;
  }
}
