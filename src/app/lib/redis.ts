import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
	username: config.redis_user,
	password: config.redis_password,
	socket: {
		host: config.redis_host,
		port: Number(config.redis_port),
	},
});

redisClient.on("error", (error) => {
	console.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
	console.log("Redis connecting...");
});

redisClient.on("ready", () => {
	console.log("Redis connected successfully.");
});

redisClient.on("reconnecting", () => {
	console.log("Redis reconnecting...");
});

redisClient.on("end", () => {
	console.log("Redis connection closed.");
});
