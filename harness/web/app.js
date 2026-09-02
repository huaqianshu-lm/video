import { startApplication } from "./views/application.js";
import { polling } from "./core/polling.js";
import { createRouter } from "./core/router.js";
import { appStore } from "./core/store.js";

const router = createRouter();
router.subscribe((route) => appStore.setState({ route }));
const stopRouter = router.start();
window.addEventListener("beforeunload", () => {
  stopRouter?.();
  polling.stopAll();
});
startApplication();
