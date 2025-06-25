console.log(`
    \ _   _      _ _         _____ _
    | | | | ___| | | ___   |_   _| |__   ___ _ __ ___
    | |_| |/ _ \\ | |/ _ \\    | | | '_ \\ / _ \\ '__/ _ \\
    |  _  |  __/ | | (_) |   | | | | | |  __/ | |  __/
    |_| |_|\\___|_|_|\\___/    |_| |_| |_|\\___|_|  \\___|
    `);

export function createLogger(metaUrl, isDebugging) {
    const isDeveloping = import.meta.env.MODE === "development";

    if (!isDeveloping || !isDebugging) {
        return () => {};
    }

    const pathname = new URL(metaUrl).pathname;
    const namespace = pathname.split("/").pop();

    const logStyle =
        "border: 1px solid #555; margin-block: .5rem; padding: .5rem; border-radius: 0.375rem; background-color: #111;";

    return (message, ...args) => {
        console.log(`%c[${namespace}] ${message}`, logStyle, ...args);
    };
}
