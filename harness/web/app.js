import { startApplication } from "./views/application.js";

const application = startApplication();
window.addEventListener("beforeunload", () => application.destroy());
