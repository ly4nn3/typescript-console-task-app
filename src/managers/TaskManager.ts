import { Task } from "../models/Task.js";

/**
 * Task Manager - Manages a collection of tasks.
 * 
 * Responsibilities:
 * - Core CRUD operations
 * - Querying tasks (completed, pending, all)
 * - Toggle task status
 * - Utility functions (stats, clearing, setting/loading)
 */
export class TaskManager {
    /** Internal list of all managed tasks */
    private tasks:Task[] = [];

    /**
     * -------------------------------
     * Core CRUD Operations for Tasks
     * -------------------------------
     */

    /**
     * Create new task and add to collection.
     * 
     * @param title - Short title of task
     * @param description - Optional detailed explanation
     * @returns New created Task instance
     */
    addTask(title: string, description?: string): Task {
        const task = new Task(title, description);
        this.tasks.push(task);
        return task;
    }

    /**
     * Remove a task from collection by ID.
     * 
     * @param id - Unique ID of the task
     * @returns True if task found and removed (false otherwise)
     */
    removeTask(id: number): boolean {
        const index = this.tasks.findIndex(task => task.id === id);

        if (index !== -1) {
            this.tasks.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Update task attributes by task ID.
     * 
     * @param id - Unique Id of the task
     * @param updates - Object containing optional new values:
     *                  `{ title?: string. description?: string }`
     * @returns True if updated successfully (false if task not found)
     */
    updateTask(
        id: number,
        updates: {
            title?: string;
            description?: string;
        }
    ): boolean {
        const task =this.findTask(id);

        if (!task) return false; // Task not found

        // Only update if valid non-empty values provided
        if (updates.title !== undefined && updates.title.trim() !== "") {
            task.title = updates.title;
        }

        if (updates.description !== undefined) {
            task.description = updates.description;
        }

        // Refresh modification timestamp
        task.updatedAt = new Date();

        return true;
    }

    /**
     * Retrieve task by ID.
     * 
     * @param id - Unique ID of the task
     * @returns Found Task object (undefined if not found)
     */
    findTask(id: number): Task | undefined {
        return this.tasks.find(task => task.id === id);
    }

    /**
     * --------------------------
     * Task Retrieval & Filtering
     * --------------------------
     */

    /**
     * Retrieve shallow copy of all tasks.
     * 
     * @returns New array containing all tasks
     *          (prevents external mutations of internal state)
     */
    getAllTasks(): Task[] {
        return [...this.tasks];
    }

    /** Retrieve only completed tasks */
    getCompletedTasks(): Task[] {
        return this.tasks.filter(task => task.completed);
    }

    /** Retrieve only pending (incomplete) tasks */
    getPendingTasks(): Task[] {
        return this.tasks.filter(task => !task.completed);
    }

    /**
     * -----------------
     * Status Management
     * -----------------
     */

    /**
     * Toggle completion status of task by ID.
     * 
     * - If task is complete, mark as incomplete
     * - If task is incomple, mark as completed
     * 
     * @param id - Unique ID of the task
     * @returns True if task found and toggled (false otherwise)
     */
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
     * ---------------
     * Utility Methods
     * ---------------
     */

    /**
     * Get summary of task statistics
     * 
     * @returns Object with `total`, `completed`, `pending` counts
     */
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
    
    /**
     * Remove all tasks from collection.
     */
    clearAllTasks(): void {
        this.tasks = [];
    }

    /**
     * Replace internal tasks collection (load from storage).
     * 
     * @param tasks - Array of Task objects to set
     */
    setTasks(tasks: Task[]): void {
        this.tasks = tasks;
    }

}
