export function activeTask(tasks = []) {
  return tasks.find((task) => ["ready", "in-progress", "blocked", "failed"].includes(task.status)) ?? null;
}
