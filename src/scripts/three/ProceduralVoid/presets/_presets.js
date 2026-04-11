const modules = import.meta.glob("./!(_*).json", { eager: true });

const presets = {};
for (const [path, module] of Object.entries(modules)) {
    presets[path.replace("./", "").replace(".json", "")] = module.default;
}

export default presets;
