import { Task } from "../models/Task.js";

/**
 * Task Manager, handles task operations for adding, removing, and updating.
 */
export class TaskManager {
    private tasks:Task[] = [];

    /**
     * Core CRUD operaations for tasks
     */

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

    // Update task by ID
    updateTask(
        id: number,
        updates: {
            title?: string;
            description?: string;
        }
    ): boolean {
        const task =this.findTask(id);

        if (!task) return false;

        if (updates.title !== undefined && updates.title.trim() !== "") {
            task.title = updates.title;
        }

        if (updates.description !== undefined) {
            task.description = updates.description;
        }
        task.updatedAt = new Date();
        return true;
    }

    // Find task by ID
    findTask(id: number): Task | undefined {
        return this.tasks.find(task => task.id === id);
    }

    /**
     * Task retrieval and display methods
     */

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

    /**
     * Status management methods
     */

    // Toggle task completion status ny ID
    toggleTaskCompletion(id: number): boolean {
        const task = this.findTask(id);
        
        if (task) {
            if (task.completed) {
                task.markAsIncomplete();
            } else {
                task.markAsCompleted();
            }

            return true;
        }

        return false;
    }

    /**
     * Utility methods
     */

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
    // Clear all tasks
    clearAllTasks(): void {
        this.tasks = [];
    }

    // Set tasks (loading from file)
    setTasks(tasks: Task[]): void {
        this.tasks = tasks;
    }

}
