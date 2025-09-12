import { Task } from "../models/Task.js";

/**
 * Displays a task in a formatted way
 */
export function displayTask(task: Task): void {
    const status = task.completed ? "✅" : "⏳";
    const completedAt = task.completed && task.completedAt
        ? ` (completed: ${task.completedAt.toLocaleDateString()})`
        : "";

    const completedSummary = `${status} [ID: ${task.id}] ${task.title}${completedAt}`;
    console.log(completedSummary);

    if (task.description) {
        console.log(`    ┖─ Description: ${task.description}`);
    }

    console.log(`    ┖─ Created: ${task.createdAt.toLocaleDateString()}`);

    if (task.updatedAt > task.createdAt) {
        console.log(`    ┖─ Updated: ${task.updatedAt.toLocaleDateString()}`);
    }
}

/**
 * Displays statistics in a formatted way
 */
export function displayStats(stats: {
        total: number;
        completed: number;
        pending: number
    }): void {
    const allStats = `📊 Total tasks: ${stats.total}
    📈 Completed: ${stats.completed}
    📉 Pending: ${stats.pending}`

    console.log(allStats);

    if (stats.total > 0) {
        const completionRate = ((stats.completed / stats.total) * 100).toFixed(1);
        console.log(`🏆 Completion Rate: ${completionRate}%`);

        const barLength = 20;
        const filledLength = Math.min(Math.round((stats.completed / stats.total) * barLength), barLength);
        const emptyLength = Math.max(barLength - filledLength, 0);
        const progressBar = "█".repeat(filledLength) + "░".repeat(emptyLength);

        console.log(`    ┖─ Progress: [${progressBar}]`);
    }
}