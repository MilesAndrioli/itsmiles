const modules = import.meta.glob("./!(_*).js", { eager: true });

const animations = {};
for (const module of Object.values(modules)) {
    Object.assign(animations, module.default);
}

export default animations;
