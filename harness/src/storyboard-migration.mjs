// The old transition entry is retired. Historical journal files remain untouched.
const retired = () => { throw Object.assign(new Error("旧转换入口已停用，请使用 storyboard-rework 按当前规则正常返工。"), {code: "production-entry-retired"}); };
export const prepareStoryboardMigration = retired;
export const startStoryboardMigration = retired;
export const storyboardMigrationPlanView = retired;
