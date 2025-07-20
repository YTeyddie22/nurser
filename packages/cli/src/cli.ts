import { Effect, pipe, Option } from "effect";

import { intro, select, isCancel, outro, log } from "@clack/prompts";
import * as interactives from "./interactives";

const printHelp = Effect.gen(function* (_) {
	yield* _(Effect.sync(() => log.message("Available commands:")));
	for (const interactive of Object.values(interactives)) {
		yield* _(
			Effect.sync(() =>
				log.message(
					` ${interactive.id.padStart(15)}    ${interactive.description}`
				)
			)
		);
	}
	yield* _(
		Effect.sync(() =>
			log.message("Run `npm nurser` for an interactive experience\n")
		)
	);
	yield* _(Effect.sync(() => outro("")));
	return yield* _(Effect.sync(() => process.exit(0)));
});

const runInteractive = (id: string) =>
	pipe(
		Option.fromNullable(
			Object.values(interactives).find(
				(interactive) => interactive.id === id
			)
		),
		Option.match({
			onNone: () =>
				pipe(
					Effect.sync(() =>
						log.message(`I do not know how to do that, Yet!`)
					),
					Effect.zipRight(Effect.sync(() => outro(""))),
					Effect.zipRight(Effect.sync(() => process.exit(0)))
				),

			onSome: (interactive) =>
				pipe(
					interactive.run,
					Effect.zipRight(Effect.sync(() => outro("Done!"))),
					Effect.zipRight(Effect.sync(() => process.exit(0)))
				),
		})
	);

const program = Effect.gen(function* (_) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		yield* _(Effect.sync(() => intro("`Welcome to Nurser's CLI")));

		const selectedCommand = yield* _(
			Effect.tryPromise(() =>
				select({
					message: `Hello ${process.env.USER}, What do we do?`,
					options: Object.values(interactives).map((interactive) => ({
						label: interactive.description,
						value: interactive.id,
					})),
					maxItems: 5,
				})
			)
		);

		if (isCancel(selectedCommand)) {
			yield* _(Effect.sync(() => outro(`No worries, come anytime`)));
			return yield* _(Effect.sync(() => process.exit(0)));
		}

		return yield* _(runInteractive(selectedCommand as string));
	} else {
		yield* _(Effect.sync(() => `Nurser CLI`));
		const firstArg = args[0];

		if (["help", "-h", "--help"].includes(firstArg)) {
			return yield* _(printHelp);
		}

		return yield* _(runInteractive(firstArg));
	}
});

Effect.runPromise(program).catch((err) => {
	console.error(err);
	process.exit(1);
});
