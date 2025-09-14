import { Menu } from "./utils/menu.js";

async function main() {
    const menu = new Menu();
    await menu.start();
}

main().catch(e => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
});