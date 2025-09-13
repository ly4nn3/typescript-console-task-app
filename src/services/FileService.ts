import { promises as fileSystem } from "fs";
import { join } from "path";
import { Task } from "../models/Task.js";
import { TaskManager } from "../managers/TaskManager.js";

/**
 * File service for handling file operations:
 * Reading from and writing to CSV files.
 */
export class FileService {
    private filePath: string;

    constructor(filename: string = "tasks.csv") {
        // Store in "data" directory
        this.filePath = join(process.cwd(), "data", filename);
    }

    // Check directory exists
    private async ensureDirectoryExists(): Promise<void> {
        const dataDirectory = join(process.cwd(), "data");

        try {
            await fileSystem.access(dataDirectory);
        } catch {
            await fileSystem.mkdir(dataDirectory, { recursive: true });
        }
    }

    // Save tasks to CSV file
    async saveTasks(taskManager: TaskManager): Promise<void> {
        try {
            await this.ensureDirectoryExists();

            const tasks = taskManager.getAllTasks();
            const lines: string[] = [Task.getCsvHeaders()];

            for (const task of tasks) {
                lines.push(task.toCsvRow());
            }

            const content = lines.join("\n");

            await fileSystem.writeFile(this.filePath, content, "utf-8");

            console.log(`📩 Saved ${tasks.length} tasks to ${this.filePath}`);
        } catch (e) {
            console.error("❌ Error saving tasks:", e);
            throw new Error(`Failed to save tasks: ${e instanceof Error ? e.message : "Unknown Error"}`);
        }
    }

    // Load tasks from CSV file
    async loadTasks(): Promise<Task[]> {
        try {
            await this.ensureDirectoryExists();

            const content = await fileSystem.readFile(this.filePath, "utf-8");
            const lines = content.trim().split("\n");
            
            if (lines.length === 1 && lines[0] === "") {
                return [];
            }

            // Skip header line
            const firstLine = lines[0];
            const hasHeader = firstLine?.includes("id;title;description");
            const dataLines = hasHeader ? lines.slice(1) : lines;

            const tasks: Task[] = [];
            const errors: string[] = [];

            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i]?.trim();

                if (line === "") continue;

                try {
                    const task = Task.fromCsvRow(line!);
                    tasks.push(task);
                } catch (e) {
                    errors.push(`Line ${i + 2}: ${e instanceof Error ? e.message : "Unknown error"}`);
                }
            }

            if (errors.length > 0) {
                console.warn("⚠️ Some lines could not be loaded:");
                errors.forEach(e => console.warn(`    -${e}`));
            }

            console.log(`📂 Loaded ${tasks.length} tasks from ${this.filePath}`);
            return tasks;
        } catch (e) {
            if ((e as any).code === "ENOENT") {
                console.log(`📝 No save file found. Starting fresh!`);
                return [];
            }

            console.error("❌ Error loading tasks:", e);
            throw new Error(`Failed to load tasks: ${e instanceof Error ? e.message : "Unknown Error"}`);
        }
    }

    // Check if file exists
    async exists(): Promise<boolean> {
        try {
            await fileSystem.access(this.filePath);
            return true;
        } catch {
            return false;
        }
    }

    // Delete the save file
    async deleteSaveFile(): Promise<void> {
        try {
            await fileSystem.unlink(this.filePath);
            console.log("🗑 Save file deleted!");
        } catch (e) {
            if ((e as any).code !== "ENOENT") {
                throw new Error(`Failed to delete save file: ${e instanceof Error ? e.message : "Unknown error"}`);
            }
        }
    }

    // Backup current save file
    async backup(): Promise<void> {
        try {
            const exists = await this.exists();

            if (!exists) {
                console.log("📝 No save file to backup");
                return;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = join(process.cwd(), "data", `tasks-backup-${timestamp}.csv`);

            await fileSystem.copyFile(this.filePath, backupPath);
            console.log(`📄 Backup created: ${backupPath}`);
        } catch (e) {
            console.error("❌ Error creating backup: ", e);
            throw new Error(`Failed to create backup: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
    }
}