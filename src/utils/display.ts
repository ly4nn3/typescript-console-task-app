import { Task } from "../models/Task.js";

/**
 * Display a single task neatly formatted to console.
 * 
 * Includes:
 * - Task completion status (✅ / ⏳)
 * - Task ID and title
 * - Optional completion date (if task completed)
 * - Description (if provided)
 * - Created/updated timestamps
 * 
 * @param task - Task object to display
 */
export function displayTask(task: Task): void {
    // Choose status icon based on completion status
    const status = task.completed ? "✅" : "⏳";

    // Add "(completed: DATE)" if task marked completed
    const completedAt = task.completed && task.completedAt
        ? ` (completed: ${task.completedAt.toLocaleDateString()})`
        : "";

    // Build summary line: "✅ [ID: 1] Task Title (completed: MM/DD/YYY)"
    const completedSummary = `${status} [ID: ${task.id}] ${task.title}${completedAt}`;
    console.log(completedSummary);

    // Optional description (indented with ┖─)
    if (task.description) {
        console.log(`    ┖─ Description: ${task.description}`);
    }

    // Creation date
    console.log(`    ┖─ Created: ${task.createdAt.toLocaleDateString()}`);

    // Only show "Updated" if updatedAt differs from createdAt timestamp
    if (task.updatedAt > task.createdAt) {
        console.log(`    ┖─ Updated: ${task.updatedAt.toLocaleDateString()}`);
    }
}

/**
 * Display formatted statistics summary of tasks.
 * 
 * Includes:
 * - Total tasks
 * - Completed tasks
 * - Pending tasks
 * - Completion rate (%)
 * - Visual progress bar
 * 
 * @param stats - Object containing task counts:
 *  { total, completed, pending }
 */
export function displayStats(stats: {
        total: number;
        completed: number;
        pending: number
    }): void {
    // Print numeric stats
    const allStats = `📊 Total tasks: ${stats.total}
    📈 Completed: ${stats.completed}
    📉 Pending: ${stats.pending}`

    console.log(allStats);

    // If tasks exist, calculate: show completion rate + progress bar
    if (stats.total > 0) {
        const completionRate = ((stats.completed / stats.total) * 100).toFixed(1);
        console.log(`🏆 Completion Rate: ${completionRate}%`);

        // Progress bar render at 20 characters long
        const barLength = 20;
        const filledLength = Math.min(Math.round((stats.completed / stats.total) * barLength), barLength);
        const emptyLength = Math.max(barLength - filledLength, 0);

        const progressBar = "█".repeat(filledLength) + "░".repeat(emptyLength);

        console.log(`    ┖─ Progress: [${progressBar}]`);
    }
}