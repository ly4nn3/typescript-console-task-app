import { Task } from "../models/Task.js";

/**
 * Task Manager, handles task operations for adding, removing, and updating.
 */
export class TaskManager {
    private tasks:Task[] = [];

    // Add new task to collection
    addTask(title: string, description?: string): Task {
        const task = new Task(title, description);
        this.tasks.push(task);
        return task;
    }

    // Remove task by ID
    removeTask(id: number): boolean {
        const index = this.tasks.findIndex(task => task.id === id);

        if (index !== -1) {
            this.tasks.splice(index, 1);
            return true;
        }

        return false;
    }

    // Find task by ID
    findTask(id: number): Task | undefined {
        return this.tasks.find(task => task.id === id);
    }

    // Get all tasks
    getAllTasks(): Task[] {
        // Copying as array to prevent mutation
        return [...this.tasks];
    }

    // Get only completed tasks
    getCompletedTasks(): Task[] {
        return this.tasks.filter(task => task.completed);
    }

    // Get pending tasks (incomplete)
    getPendingTasks(): Task[] {
        return this.tasks.filter(task => !task.completed);
    }

    // Mark as completed by ID
    markAsCompleted(id: number): boolean {
        const task = this.findTask(id);
        
        if (task) {
            task.markAsCompleted();
            return true;
        }

        return false;
    }

    // Mark as incomplete by ID
    markAsIncomplete(id: number): boolean {
        const task = this.findTask(id);

        if (task) {
            task.markAsIncomplete();
            return true;
        }

        return false;
    }

    // Display all tasks
    listTasks(): void {
        if (this.tasks.length === 0) {
            console.log("📝 There are no tasks!");
            return;
        }

        console.log("\n📝 All tasks:");
        console.log("=".repeat(50));
        this.tasks.forEach(task => {
            console.log(task.toString());
        });
        console.log("=".repeat(50));
        console.log(`Total: ${this.tasks.length} tasks\n`);
    }

    // Total number of tasks
    getTaskCount(): string {
        const taskCount = this.tasks.length;
        return `Total: ${taskCount} tasks`;
    }

    // Clear all tasks
    clearAllTasks(): void {
        this.tasks = [];
    }

    // Set tasks (loading from file)
    setTasks(tasks: Task[]): void {
        this.tasks = tasks;
    }

    // Get stats summary
    getStats(): {
        total: number;
        completed: number;
        pending: number
    } {
        const total = this.tasks.length;
        const completed = this.getCompletedTasks().length;
        const pending = this.getPendingTasks().length;

        return { total, completed, pending };
    }
}
