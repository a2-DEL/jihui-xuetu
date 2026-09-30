import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ActorContext } from "@/lib/platform/authorization";
import type { CommandPlan, PreparedTask } from "./types";

type TaskStatus = "prepared" | "executing" | "completed";
type StoredTask = PreparedTask & { status: TaskStatus };
const file = join(process.cwd(), ".runtime", "agent-prepared-tasks.json");
const lockFile = `${file}.lock`;
const ttlMs = 30 * 60 * 1000;

// DEMO ONLY: single-host JSON is not a transactional production task queue.
// Store only SHA-256 of the command; confirmed tools must never require raw input.
function requireDemo() {
  if (process.env.NODE_ENV === "production") throw new Error("AGENT_RUNTIME_UNAVAILABLE");
}
function load(): StoredTask[] {
  requireDemo();
  if (!existsSync(file)) return [];
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AGENT_TASK_STORE_INVALID");
  const data = parsed as { version?: unknown; tasks?: unknown };
  if (data.version !== 1 || !Array.isArray(data.tasks) || data.tasks.some((item: unknown) =>
    !item || typeof item !== "object" || typeof (item as StoredTask).plan?.taskId !== "string" ||
    typeof (item as StoredTask).actorId !== "string" ||
    !["prepared", "executing", "completed"].includes((item as StoredTask).status))) {
    throw new Error("AGENT_TASK_STORE_INVALID");
  }
  return data.tasks as StoredTask[];
}
function save(tasks: StoredTask[]) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ version: 1, tasks })}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  try { renameSync(temporary, file); } catch (error) { unlinkSync(temporary); throw error; }
}
function locked<T>(action: (tasks: StoredTask[]) => T): T {
  requireDemo();
  mkdirSync(dirname(file), { recursive: true });
  let fd: number;
  try { fd = openSync(lockFile, "wx", 0o600); }
  catch (error) { throw new Error((error as NodeJS.ErrnoException).code === "EEXIST" ? "AGENT_TASK_STORE_BUSY" : "AGENT_TASK_STORE_UNAVAILABLE"); }
  try { return action(load()); }
  finally { closeSync(fd); unlinkSync(lockFile); }
}
function owned(tasks: StoredTask[], id: string, actor: ActorContext): StoredTask {
  const task = tasks.find((item) => item.plan.taskId === id);
  if (!task || task.actorId !== actor.userId || task.actorRole !== actor.role) throw new Error("TASK_NOT_FOUND_OR_FORBIDDEN");
  if (!Number.isFinite(Date.parse(task.plan.createdAt)) || Date.now() - Date.parse(task.plan.createdAt) > ttlMs) throw new Error("TASK_EXPIRED");
  if (task.status !== "prepared") throw new Error(task.status === "executing" ? "TASK_EXECUTION_UNCERTAIN" : "TASK_ALREADY_EXECUTED");
  return task;
}
export function rememberPreparedTask(plan: CommandPlan, actor: ActorContext, message: string) {
  locked((tasks) => {
    // Never write raw commands, tokens or student data to the demo task file.
    tasks.push({ plan, actorId: actor.userId, actorRole: actor.role,
      messageDigest: createHash("sha256").update(message).digest("hex"), status: "prepared" });
    save(tasks.filter((item) => Date.now() - Date.parse(item.plan.createdAt) < 24 * 60 * 60 * 1000).slice(-200));
  });
}
export function readPreparedTask(id: string, actor: ActorContext): PreparedTask {
  return owned(load(), id, actor);
}
export function claimPreparedTask(id: string, actor: ActorContext) {
  locked((tasks) => { const task = owned(tasks, id, actor); task.status = "executing"; save(tasks); });
}
export function finishPreparedTask(id: string, actor: ActorContext) {
  locked((tasks) => {
    const task = tasks.find((item) => item.plan.taskId === id);
    if (!task || task.actorId !== actor.userId || task.actorRole !== actor.role || task.status !== "executing") throw new Error("TASK_EXECUTION_UNCERTAIN");
    task.status = "completed"; task.executedAt = new Date().toISOString(); save(tasks);
  });
}
