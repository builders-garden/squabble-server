import { createClient } from "redis";
import { env } from "../env";

class RedisClient {
	private static instance: RedisClient;
	private client: ReturnType<typeof createClient>;

	private constructor() {
		this.client = createClient({
			url: env.REDIS_URL,
		})
			.on("error", (err: Error) => {
				console.error("Redis Client Error:", err);
			})
			.on("connect", () => {
				console.log("Redis Client Connected");
			});
		this.client.connect();
	}

	public static getInstance(): RedisClient {
		if (!RedisClient.instance) {
			RedisClient.instance = new RedisClient();
		}
		return RedisClient.instance;
	}

	public getClient(): ReturnType<typeof createClient> {
		return this.client;
	}

	public async set(key: string, value: string): Promise<void> {
		await this.client.set(key, value);
	}

	public async setEx(key: string, ttl: number, value: string): Promise<void> {
		await this.client.setEx(key, ttl, value);
	}

	public async get(key: string): Promise<string | null> {
		return await this.client.get(key);
	}

	public async del(key: string): Promise<void> {
		await this.client.del(key);
	}

	public async keys(pattern: string): Promise<string[]> {
		return await this.client.keys(pattern);
	}

	public async quit(): Promise<void> {
		await this.client.quit();
	}
}

// Export a singleton instance
export const redisClient = RedisClient.getInstance();
