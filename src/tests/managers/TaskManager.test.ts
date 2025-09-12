import { TaskManager } from "../../managers/TaskManager.js";
import { Task } from "../../models/Task.js";
import { jest } from '@jest/globals';

describe("TaskManager", () => {
    let taskManager: TaskManager;

    beforeEach(() => {
        taskManager = new TaskManager();
        // Reset static nextId before each test
        (Task as any).nextId = 1;
    });

    describe("addTask", () => {
        it("Case 1: Create a new task and return it", () => {
            const task = taskManager.addTask("Test Task 1", "Test task 1 description");

            expect(task).toBeInstanceOf(Task);
            expect(task.title).toBe("Test Task 1");
            expect(task.description).toBe("Test task 1 description");
            expect(taskManager.getAllTasks()).toHaveLength(1);
        });

        it("Case 2: Add task without description successfully", () => {
            const task = taskManager.addTask("Test Task 2");

            expect(task.description).toBeUndefined;
        });
    });

    describe("removeTask", () => {
        it("Case 1: Remove existing task, return true", () => {
            const task = taskManager.addTask("Test Task 2");
            const result = taskManager.removeTask(task.id);

            expect(result).toBe(true);
            expect(taskManager.getAllTasks()).toHaveLength(0);
        });

        it("Case 2: Return false when removing non-existent task", () => {
            const result = taskManager.removeTask(999);

            expect(result).toBe(false);
        });
    });

    describe("updateTask", () => {
        it("Case 1: Update task title successfully", () => {
            jest.useFakeTimers();

            const task = taskManager.addTask("Old Title", "Old description");

            jest.advanceTimersByTime(10);

            const result = taskManager.updateTask(task.id, { title: "New title" });

            expect(result).toBe(true);
            expect(task.title).toBe("New title");
            expect(task.description).toBe("Old description");
        });

        it("Case 2: Update task description successfully", () => {
            const task = taskManager.addTask("Title", "Old description");
            const result = taskManager.updateTask(task.id, { description: "New description" });

            expect(result).toBe(true);
            expect(task.description).toBe("New description");
        });

        it("Case 3: Update task title and description simultaneously successfully", () => {
            const task = taskManager.addTask("Old Title", "Old description");
            const result = taskManager.updateTask(task.id, {
                title: "New title",
                description: "New description"
            });

            expect(result).toBe(true);
            expect(task.title).toBe("New title");
            expect(task.description).toBe("New description");
        });

        it("Case 4: Title unchanged if updating with blank/empty title", () => {
            const task = taskManager.addTask("Title", "Description");
            const result = taskManager.updateTask(task.id, { title: " " });

            expect(result).toBe(true);
            expect(task.title).toBe("Title");
        });

        it("Case 5: Return false if task is non-existent", () => {
            const result = taskManager.updateTask(999, { title: "New title" });

            expect(result).toBe(false);
        });

        it("Case 6: Update updatedAt timestamp successfully, must be > previous updatedAt", () => {
            jest.useFakeTimers();
            
            const task = taskManager.addTask("Title", "Description");
            const originalUpdatedAt = task.updatedAt;

            jest.advanceTimersByTime(10);

            taskManager.updateTask(task.id, { title: "New Title" });

            expect(task.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe("findTask", () => {
        it("Case 1: Find an existing task successfully", () => {
            const task = taskManager.addTask("Test Task");
            const found = taskManager.findTask(task.id);

            expect(found).toBe(task);
        });

        it("Case 2: Return undefined for non-existent task", () => {
            const found = taskManager.findTask(999);

            expect(found).toBeUndefined();
        });
    });

    describe("getAllTasks", () => {
        it("Case 1: Return empty array when no tasks found", () => {
            expect(taskManager.getAllTasks()).toEqual([]);
        });

        it("Case 2: Return all tasks successfully", () => {
            taskManager.addTask("Task 1");
            taskManager.addTask("Task 2");
            taskManager.addTask("Task 3");

            const tasks = taskManager.getAllTasks();

            expect(tasks).toHaveLength(3);
            expect(tasks[0]?.title).toBe("Task 1");
            expect(tasks[1]?.title).toBe("Task 2");
            expect(tasks[2]?.title).toBe("Task 3");
        });

        it("Case 3: Return a copy of tasks array to avoid mutation", () => {
            taskManager.addTask("Task 1");

            const tasks1 = taskManager.getAllTasks();
            const tasks2 = taskManager.getAllTasks();

            expect(tasks1).not.toBe(tasks2);
            expect(tasks1).toEqual(tasks2);
        });
    });

    describe("getCompletedTasks", () => {
        it("Case 1: Return only completed tasks", () => {
            const task1 = taskManager.addTask("Task 1");
            const task2 = taskManager.addTask("Task 2");
            const task3 = taskManager.addTask("Task 3");

            task1.markAsCompleted();
            task2.markAsIncomplete();
            task3.markAsCompleted();

            const completed = taskManager.getCompletedTasks();

            expect(completed).toHaveLength(2);
            expect(completed[0]?.id).toBe(task1.id);
            expect(completed[1]?.id).toBe(task3.id);
        });

        it("Case 2: Return empty array when no completed tasks found", () => {
            taskManager.addTask("Task 1");
            taskManager.addTask("Task 2");

            expect(taskManager.getCompletedTasks()).toEqual([]);
        });
    });

    describe("getPendingTasks", () => {
        it("Case 1: Return only pending tasks", () => {
            const task1 = taskManager.addTask("Task 1");
            const task2 = taskManager.addTask("Task 2");
            const task3 = taskManager.addTask("Task 3");

            task2.markAsCompleted();

            const pending = taskManager.getPendingTasks();

            
            expect(pending).toHaveLength(2);
            expect(pending[0]?.id).toBe(task1.id);
            expect(pending[1]?.id).toBe(task3.id);
        });

        it("Case 2: Return empty array when all tasks acre completed", () => {
            const task1 = taskManager.addTask("Task 1");
            const task2 = taskManager.addTask("Task 2");
            
            task1.markAsCompleted();
            task2.markAsCompleted();

            expect(taskManager.getPendingTasks()).toEqual([]);
        });
    });

    describe("toggleTaskCompletion", () => {
        it("Case 1: Toggle incomplete tasks to completed successfully", () => {
            const task = taskManager.addTask("Test Task 1");

            const result = taskManager.toggleTaskCompletion(task.id);

            expect(result).toBe(true);
            expect(task.completed).toBe(true);
            expect(task.completedAt).toBeInstanceOf(Date);
        });

        it("Case 2: Toggle completed task to incomplete successfully", () => {
            const task = taskManager.addTask("Test Task 2");
            task.markAsCompleted();

            const result = taskManager.toggleTaskCompletion(task.id);

            expect(result).toBe(true);
            expect(task.completed).toBe(false);
            expect(task.completedAt).toBeUndefined();
        });

        it("Case 3: Return false for non-existent task", () => {
            const result = taskManager.toggleTaskCompletion(999);

            expect(result).toBe(false);
        });
    });

    describe("getStats", () => {
        it("Case 1: Return correct statistics successfully", () => {
            const task1 = taskManager.addTask("Task 1");
            const task2 = taskManager.addTask("Task 2");
            const task3 = taskManager.addTask("Task 3");

            task1.markAsCompleted();
            task2.markAsIncomplete();
            task3.markAsCompleted();

            const stats = taskManager.getStats();

            expect(stats).toEqual({ total: 3, completed: 2, pending: 1 });
        });

        it("Case 2: Return all zeroes when no tasks found", () => {
            const stats = taskManager.getStats();

            expect(stats).toEqual({ total: 0, completed: 0, pending: 0 });
        });
    });

    describe("clearAllTasks", () => {
        it("Case 1: Remove all tasks successfully", () => {
            taskManager.addTask("Task 1");
            taskManager.addTask("Task 2");
            taskManager.addTask("Task 3");

            taskManager.clearAllTasks();

            expect(taskManager.getAllTasks()).toHaveLength(0);
            expect(taskManager.getStats().total).toBe(0);
        });

        it("Case 2: Work successfully still when already empty", () => {
            taskManager.clearAllTasks();

            expect(taskManager.getAllTasks()).toHaveLength(0);
        });
    });

    describe("setTasks", () => {
        it("Case 1: Replace all tasks with new ones/existing ones", () => {
            taskManager.addTask("Old Task 1");
            taskManager.addTask("Old Task 2");

            const newTasks = [
                new Task("New Task 1"),
                new Task("New Task 2"),
                new Task("New Task 3")
            ];

            taskManager.setTasks(newTasks);

            const allTasks = taskManager.getAllTasks();

            expect(allTasks).toHaveLength(3);
            expect(allTasks[0]?.title).toBe("New Task 1");
            expect(allTasks[1]?.title).toBe("New Task 2");
            expect(allTasks[2]?.title).toBe("New Task 3");
        });

        it("Case 2: Handle empty arrays", () => {
            taskManager.addTask("task 1");

            taskManager.setTasks([]);

            expect(taskManager.getAllTasks()).toHaveLength(0);
        });
    });
})