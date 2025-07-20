export type Command = {
    id: string;
    description: string;
    run: () => Promise<void>;
};

export { command as setEnv } from "./set-env";
