const dismissLoader = () => {
    document.documentElement.classList.add("Page--HasLoaded");

    const loader = document.getElementById("app-loader");

    if (loader) {
        loader.addEventListener("transitionend", () => loader.remove(), {
            once: true,
        });
    }
};

export default dismissLoader;
