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
