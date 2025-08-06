import { env } from "./env";

export const baseOrigins = [
	"https://squabble.lol",
	"https://dev.squabble.lol",
];
export const localOrigins = [
	"http://localhost:3000",
	env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:3000",
];
