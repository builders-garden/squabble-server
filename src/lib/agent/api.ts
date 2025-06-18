import { env } from "../../lib/env.js";

export async function sendAgentMessage(
  endpoint: string,
  conversationId: string,
  message: string
) {
  const appUrl = env.NEXT_PUBLIC_AGENT_URL;
  const externalApiUrl = `${appUrl}${endpoint}`;

  console.log("externalApiUrl", externalApiUrl);

  try {
    console.log("externalApiUrl", externalApiUrl);

    console.log("conversationId", conversationId);
    console.log("message", message);
    console.log("secret", env.RECEIVE_AGENT_SECRET);
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
    console.log("conversationId", conversationId);
    console.log("message", message);
    console.log("secret", env.RECEIVE_AGENT_SECRET);

    console.log("messageResponse", await messageResponse.json());

    if (!messageResponse.ok) {
      throw new Error(`HTTP error! status: ${messageResponse.status}`);
    }

    return await messageResponse.json();
  } catch (error) {
    console.error("Failed to send agent message:", error);
    throw error;
  }
}
