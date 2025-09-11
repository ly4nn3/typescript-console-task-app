import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { TaskManager } from "../managers/TaskManager.js";
import { displayTask, displayStats } from '../utils/display.js';

/**
 * Menu class to handle user interactions through CLI
 */
export class Menu {
    private readline = createInterface({ input, output });
    private taskManager: TaskManager;
    private isRunning = true;

    constructor() {
        this.taskManager = new TaskManager();
    }

    async start(): Promise<void> {
        console.log("\n📖 Welcome to Task Manager\n");

        while (this.isRunning) {
            await this.showMenu();
        }

        this.readline.close();
        console.log("\n🙋‍♀️ Bye! 🙋‍♂️\n");
    }

    private async showMenu(): Promise<void> {
        const menuOptions = `=== MAIN MENU ===
        1. Add task
        2. View all tasks
        3. View completed tasks
        4. View pending tasks
        5. Update task
        6. Toggle task completion
        7. Remove task
        8. View statistics
        9. CLear all tasks
        0. Exit
        =================\n`;

        console.log(menuOptions);

        const choice = await this.readline.question("Choose an option (1 - 6): ")
        console.log("");

        try {
            switch (choice) {
                case "1":
                    await this.addTask();
                    break;
                case "2":
                    this.viewAllTasks();
                    break;
                case "3":
                    this.viewCompletedTasks();
                    break;
                case "4":
                    this.viewPendingTasks();
                    break;
                case "5":
                    await this.updateTask();
                    break;
                case "6":
                    await this.toggleTaskCompletion();
                    break;
                case "7":
                    await this.removeTask();
                    break;
                case "8":
                    this.viewStats();
                    break;
                case "9":
                    await this.clearAllTasks();
                    break;
                case "0":
                    this.isRunning = false;
                    break;
                default:
                    console.log("\nInvalid choice ❌ Please try again.\n");
            }
        } catch (e) {
            console.error("❌ An error occurred:", e);
        }

        if (this.isRunning) {
            await this.pause();
        }
    }

    private async pause(): Promise<void> {
        await this.readline.question("\nPress Enter to continue...");
        console.clear();
    }

    private async addTask(): Promise<void> {
        console.log("\n--- Add new task ---\n");
        const title = await this.readline.question("Enter a title: ");

        if (title.trim() === "") {
            console.log("\nTitle cannot be empty ❌\n");
            return;
        }

        const description = await this.readline.question("Enter a description (optional):\n");

        const task = this.taskManager.addTask(title, description || undefined);
        console.log("\n✨ Task added!\n");
        displayTask(task);
    }

    private viewAllTasks(): void {
        console.log("\n--- All tasks ---\n");
        const tasks = this.taskManager.getAllTasks();

        if (tasks.length === 0) {
            console.log("📝 Task list is empty!");
            return;
        }

        tasks.forEach(task => displayTask(task));
        console.log(`\nTotal: ${tasks.length} task(s)`);
    }

    private viewCompletedTasks(): void {
        console.log("\n--- Completed tasks ---\n");
        const tasks = this.taskManager.getCompletedTasks();

        if (tasks.length === 0) {
            console.log("No completed tasks found.");
            return;
        }

        tasks.forEach(task => displayTask(task));
        console.log(`\nTotal: ${tasks.length} completed task(s)`);
    }

    private viewPendingTasks(): void {
        console.log("\n--- Pending tasks ---\n");
        const tasks = this.taskManager.getPendingTasks();

        if (tasks.length === 0) {
            console.log("No pending tasks found.");
            return;
        }

        tasks.forEach(task => displayTask(task));
        console.log(`\nTotal: ${tasks.length} pending task(s)`);
    }

    private async updateTask(): Promise<void> {
        console.log("\n--- Update task ---\n");
        const tasks = this.taskManager.getAllTasks();

        if (tasks.length === 0) {
            console.log("No available tasks to update.");
            return;
        }

        tasks.forEach(task => displayTask(task));

        const id = await this.readline.question("Enter task ID to update: ");
        const taskId = parseInt(id);

        if (isNaN(taskId)) {
            console.log("\nInvalid task ID ❌\n");
            return;
        }

        const task = this.taskManager.findTask(taskId);

        if (!task) {
            console.log("\nTask not found ❌\n");
            return;
        }

        console.log("\nCurrent title:");
        displayTask(task);

        console.log("\nLeave blank to keep current title/description:")
        console.log(`Current: ${task.title} - ${task.description || "none"}`);
        const newTitle = await this.readline.question("New title: ");
        const newDescription = await this.readline.question("New description:\n");

        const updates: { title?: string; description?: string; } = {};

        if (newTitle.trim()) updates.title = newTitle;
        if (newDescription.trim() || newDescription === "") updates.description = newDescription;
        
        if (Object.keys(updates).length === 0) {
            console.log("\nNo changes made.\n");
            return;
        }

        const success = this.taskManager.updateTask(taskId, updates);

        if (success) {
            console.log("\n✨ Task updated!\n");
            displayTask(this.taskManager.findTask(taskId)!);
        } else {
            console.log("\nFailed to update task ❌\n");
        }
    }

    private async toggleTaskCompletion(): Promise<void> {
        console.log("\n--- Toggle task completion ---\n");
        const tasks = this.taskManager.getAllTasks();

        if (tasks.length === 0) {
            console.log("No tasks available.");
            return;
        }

        tasks.forEach(task => displayTask(task));

        const id = await this.readline.question("Enter task ID to toggle completion: ");
        const taskId = parseInt(id);

        if (isNaN(taskId)) {
            console.log("\nInvalid task ID ❌\n");
            return;
        }

        const success = this.taskManager.toggleTaskCompletion(taskId);

        if (success) {
            const task = this.taskManager.findTask(taskId)!;
            const status = task.completed ? "✔" : "○";
            console.log(`\n✨ Task marked as ${status}!`);
            displayTask(task);
        } else {
            console.log("\nTask not found❌\n");
        }
    }

    private async removeTask(): Promise<void> {
        console.log("\n--- Remove task ---\n");
        const tasks = this.taskManager.getAllTasks();

        if (tasks.length === 0) {
            console.log("No tasks to remove.");
            return;
        }

        tasks.forEach(task => displayTask(task));

        const id = await this.readline.question("Enter task ID to remove: ");
        const taskId = parseInt(id);

        if (isNaN(taskId)) {
            console.log("\nInvalid task ID ❌\n");
            return;
        }

        const task = this.taskManager.findTask(taskId);

        if (!task) {
            console.log("\nTask not found ❌\n");
            return;
        }

        console.log("\nTask to be removed:");
        displayTask(task);

        const confirm = await this.readline.question("\nAre you sure? (y/n): ");

        if (confirm.toLowerCase() === "y") {
            const success = this.taskManager.removeTask(taskId);

            if (success) {
                console.log("\n🗑 Task removed!");
            }
        } else {
            console.log("\nRemoval cancelled.");
        }
    }

    private viewStats(): void {
        console.log("\n--- Task statistics ---\n");
        const stats = this.taskManager.getStats();
        displayStats(stats);
    }

    private async clearAllTasks(): Promise<void> {
        console.log("\n--- Clear all tasks ---\n");
        const stats = this.taskManager.getStats();

        if (stats.total === 0) {
            console.log("No tasks to clear.");
            return;
        }

        console.log(`\n⚠️ This will remove ALL (${stats.total}) tasks! ⚠️`);
        const confirm = await this.readline.question(`Type "yes" to confirm: `);

        if (confirm.toLowerCase() === "yes") {
            this.taskManager.clearAllTasks();
            console.log("\nAll tasks cleared! 🧹");
        } else {
            console.log("\nClear all tasks cancelled.");
        }
    }
}