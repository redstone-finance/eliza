import { parseBooleanFromText, IAgentRuntime } from "@elizaos/core";
import { z, ZodError } from "zod";

export const CLARA_DEFAULT_MAX_MESSAGE_LENGTH = 280;

/**
 * This schema defines all required/optional environment settings
 */
export const aoEnvSchema = z.object({
    AO_USERNAME: z.string().min(1, "AO username is required"),
    AO_WALLET: z.string().min(1, "AO wallet is required"),
    AO_WALLET_ID: z.string().min(1, "AO wallet id is required"),
    AO_MARKET_ID: z.string().min(1, "AO market protocol id is required"),
    AO_MAX_MESSAGE_LENGTH: z
        .number()
        .int()
        .default(CLARA_DEFAULT_MAX_MESSAGE_LENGTH),
    AO_RETRY_LIMIT: z.number().int(),
    AO_POLL_INTERVAL: z.number().int(),
    AO_MESSAGE_INTERVAL_MIN: z.number().int(),
    AO_MESSAGE_INTERVAL_MAX: z.number().int(),
    AO_MESSAGE_IMMEDIATELY: z.boolean(),
});

export const claraEnvSchema = z.object({
    CLARA_USERNAME: z.string().min(1, "CLARA username is required"),
    CLARA_WALLET: z.string().min(1, "CLARA wallet is required"),
    CLARA_WALLET_ID: z.string().min(1, "CLARA wallet id is required"),
    CLARA_MARKET_ID: z.string().min(1, "CLARA market protocol id is required"),
    CLARA_POLL_INTERVAL: z.number().int(),
});

export type AoConfig = z.infer<typeof aoEnvSchema>;
export type ClaraSchema = z.infer<typeof claraEnvSchema>;
export type ClaraConfig = ClaraSchema & {CLARA_IMPL: string}
// export type StoryConfig = z.infer<typeof storyEnvSchema>;

function safeParseInt(
    value: string | undefined | null,
    defaultValue: number
): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : Math.max(1, parsed);
}

/**
 * Validates or constructs AO config object using zod,
 * taking values from the IAgentRuntime or process.env as needed.
 */
// This also is organized to serve as a point of documentation for the client
// most of the inputs from the framework (env/character)

// we also do a lot of typing/parsing here
// so we can do it once and only once per character
export async function validateAoConfig(
    runtime: IAgentRuntime
): Promise<ClaraConfig> {
    try {
        const aoConfig = {
            CLARA_USERNAME:
                runtime.getSetting("AO_USERNAME") || process.env.AO_USERNAME,

            CLARA_WALLET: runtime.getSetting("AO_WALLET") || process.env.AO_WALLET,

            CLARA_WALLET_ID:
                runtime.getSetting("AO_WALLET_ID") || process.env.AO_WALLET_ID,

            CLARA_MARKET_ID:
                runtime.getSetting("AO_MARKET_ID") || process.env.AO_MARKET_ID,
        
            CLARA_POLL_INTERVAL: safeParseInt(
                runtime.getSetting("AO_POLL_INTERVAL") ||
                    process.env.AO_POLL_INTERVAL,
                120 // 2m
            ),
        };

        return {
            ...claraEnvSchema.parse(aoConfig),
            CLARA_IMPL: 'ao'
        }
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `X/AO configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}

export async function validateStoryConfig(
    runtime: IAgentRuntime
): Promise<ClaraConfig> {
    try {
        const storyConfig = {
            CLARA_USERNAME:
                runtime.getSetting("STORY_USERNAME") || process.env.STORY_USERNAME,

            CLARA_WALLET: runtime.getSetting("STORY_WALLET") || process.env.STORY_WALLET,

            CLARA_WALLET_ID:
                runtime.getSetting("STORY_WALLET_ID") || process.env.STORY_WALLET_ID,

            CLARA_MARKET_ID:
                runtime.getSetting("STORY_MARKET_ID") || process.env.STORY_MARKET_ID,

            CLARA_POLL_INTERVAL: safeParseInt(
                runtime.getSetting("AO_POLL_INTERVAL") ||
                    process.env.AO_POLL_INTERVAL,
                120 // 2m
            ),
        };

        return {
            ...claraEnvSchema.parse(storyConfig),
            CLARA_IMPL: 'story'
        }
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `X/AO configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}