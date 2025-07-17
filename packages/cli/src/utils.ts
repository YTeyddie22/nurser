import { Effect, Console } from "effect";
import { spawn, type SpawnOptions } from "child_process";
import { readFile } from "fs/promises";
import { log } from "@clack/prompts";
import { join } from "path";

/**
 * Custom error type for incorrectly running project root
 * Parses elements from an env file
 */

type EnvVariables = {
    key: string;
    value: string;
};

class InvalidProjectRootError {
    readonly _tag = "InvalidProjectRootError";
    constructor(readonly message: string) {
        message = "error getting root of project";
    }
}

export const getProjectRoot = Effect.gen(function* ($) {
    const cwd = process.cwd();
    const jsonPath = join(cwd, "package.json");

    const jsonContent = yield* $(
        Effect.tryPromise({
            try: () => readFile(jsonPath, "utf-8"),
            catch: (e) =>
                new Error(`Failed to read package.json at ${jsonPath}: ${e}`),
        })
    );
    const jsonObject = yield* $(
        Effect.try({
            try: () => JSON.parse(jsonContent) as { name?: string },
            catch: (e) => new Error(`Failed to parse package.json: ${e}`),
        })
    );

    const rootName = jsonObject.name;

    if (!rootName || rootName !== "nurser") {
        const errorMessage =
            'Please run this command from the root of the project (where package.json has name "nurser").';
        yield* $(Console.error(errorMessage));

        return yield* $(Effect.fail(new InvalidProjectRootError(errorMessage)));
    }

    return cwd;
});

export const parseEnv = (
    env: string
): Effect.Effect<Array<EnvVariables>, never, never> => {
    return Effect.succeed(
        env
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
            .map((line) => {
                const equalSign = line.indexOf("=");
                if (equalSign === -1) {
                    return null;
                }

                const key = line.slice(0, equalSign).trim();
                let value = line.slice(equalSign + 1).trim();

                if (
                    (value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))
                ) {
                    value = value.slice(1, 1);
                }
                return { key, value };
            })
            .filter((entry): entry is EnvVariables => entry !== null)
    );
};
