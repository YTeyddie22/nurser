import { Effect, pipe, Option, Console } from "effect";
import * as Prompt from "@clack/prompts";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { Command } from ".";

import { getProjectRoot, parseEnv } from "../utils";

class CancelledError {
	readonly _tag = "CancelledError"; // Unique tag for pattern matching with Effect.catchTag
}

type EnvVariable = {
	key: string;
	value: string;
};

interface Command {
	id: string;
	description: string;
	run: Effect.Effect<void, Error, Console.Console>;
}

const promptText = (options: Prompt.TextOptions) =>
	Effect.async<string, CancelledError>((resume) => {
		Prompt.text(options).then((value) => {
			if (Prompt.isCancel(value)) {
				resume(Effect.fail(new CancelledError()));
			} else {
				resume(Effect.succeed(value));
			}
		});
	});

const requiredManualVariables = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"MICROSOFT_CLIENT_ID",
	"MICROSOFT_CLIENT_SECRET",
];

export const command: Command = {
	id: "env",
	description: "Setup the environment variables",
	run: Effect.gen(function* ($) {
		const root = yield* $(getProjectRoot);
		const envPath = join(root, ".env");
		const exampleEnvPath = join(root, ".env.example");

		const envFileContent = yield* $(
			Effect.tryPromise({
				try: () => readFile(envPath, "utf8"),
				catch: (e) => new Error(`Failed to read .env file: ${e}`),
			}).option
		);

		const envExampleFileContent = yield* $(
			Effect.tryPromise({
				try: () => readFile(exampleEnvPath, "utf8"),
				catch: (e) =>
					new Error(`Failed to read .env.example file: ${e}`),
			}).option
		);

		if (Option.isNone(envExampleFileContent)) {
			yield* $(
				Console.error("No .env.example file found, cannot continue")
			);
			return yield* $(
				Effect.die(new Error("No .env.example file found"))
			);
		}

		let envVariables = yield* $(
			Option.match({
				onNone: () => Effect.succeed([]),
				onSome: (content) => parseEnv(content),
			})(envFileContent)
		);

		const envExampleVariables = yield* $(
			parseEnv(envExampleFileContent.value)
		);

		//Log based on whether the env file exists

		if (Option.isNone(envFileContent)) {
			yield* $(Console.log("No .env file exists, CREATING ONE"));
		} else {
			if (
				envVariables.some((variables) =>
					variables.key.startsWith("NEXT_PUBLIC_")
				)
			) {
				yield* $(
					Console.log("Found old variables, MIGRATING to NEW FORMAT")
				);
				envVariables = envVariables.map((variable) => {
					if (variable.key.startsWith("NEXT_PUBLIC_")) {
						return {
							key: variable.key.replace(
								"NEXT_PUBLIC_",
								"VITE_PUBLIC"
							),
							value: variable.value,
						};
					}

					return variable;
				});
			}
		}

		for (const key of requiredManualVariables) {
			const currentValue =
				envVariables.find((variable) => variable.key === key)?.value ||
				"";
			const newValue = yield* $(
				promptText({
					message: `Enter value for ${key}`,
					initialValue: currentValue,
					validate: (value) =>
						value.length > 0 ? undefined : "Value is required",
				})
			);

			envVariables = envVariables.filter(
				(variable) => variable.key !== key
			);
			envVariables.push({ key, value: newValue });
		}

		const missingVariables = envExampleVariables.filter(
			(primary) =>
				!envVariables.find((secondary) => secondary.key === primary.key)
		);

		// Inform user of missing varibles
		if (missingVariables.length > 0) {
			yield* $(Console.log(`Missing variables in current .env file`));

			for (const variable of missingVariables) {
				yield* $(Console.log(`${variable.key} = ${variable.value}`));
			}
		}

		for (const variable of missingVariables) {
			const newValue = yield* $(
				promptText({
					message: `Enter the value for key: ${variable.key}`,
					initialValue: variable.value,
					defaultValue: "",
				})
			);

			envVariables.push({
				key: variable.key,
				value: newValue,
			});
		}

		const finalMap = envVariables.reduce(
			(acc, { key, value }) => {
				acc[key] = value?.trim() ?? "";
				return acc;
			},
			{} as Record<string, string>
		);

		const formattedEnvContent = Object.entries(finalMap)
			.map(([key, value]) => `${key}="${value}"`)
			.join("\n");

		yield* $(
			Effect.tryPromise({
				try: () => writeFile(envPath, formattedEnvContent),
				catch: (e) => new Error(`Failed to write .env file:${e}`),
			})
		);

		yield* $(Console.log("Environment variables updated successfully."));
	}).pipe(
		Effect.catchTag(`CancelledError`, () =>
			Console.error("Operation cancelled by User")
		),
		Effect.catchAll((e) =>
			Console.error(
				`An unexpected error occured: ${e instanceof Error ? e.message : String(e)}`
			)
		)
	),
};
