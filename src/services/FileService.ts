import { promises as fileSystem } from "fs";
import { join } from "path";
import { Task } from "../models/Task.js";
import { TaskManager } from "../managers/TaskManager.js";

/**
 * File service - Handles persistence of tasks to and from CSV files.
 * 
 * Responsibilities:
 * - Ensure `data/` directory exists
 * - Save tasks to CSV file with headers
 * - Load tasks from CSV file (with validation/recovery from invalid rows)
 * - Provide file utilities (checking existence, deletion, backups)
 */
export class FileService {
    /** Full absolute path to CSV file being used for storage */
    private filePath: string;

    /**
     * Constructor
     * 
     * @param filename - Name of CSV file (default `tasks.csv`
     * 
     * Files always stored inside project `data/` folder.)
     */
    constructor(filename: string = "tasks.csv") {
        this.filePath = join(process.cwd(), "data", filename);
    }

    /**
     * Ensure `data` directory exists.
     * Creates it (recursively) if it does not.
     */
    private async ensureDirectoryExists(): Promise<void> {
        const dataDirectory = join(process.cwd(), "data");

        try {
            await fileSystem.access(dataDirectory); // Check if directory already exists
        } catch {
            await fileSystem.mkdir(dataDirectory, { recursive: true });
        }
    }

    /**
     * Save all tasks from TaskManager into a CSV file.
     * 
     * - Ensures directory exists
     * - Writes CSV header + one row per task
     * - Overwrites existing save file
     * 
     * @param taskManager - TaskManager tasks that should be saved
     */
    async saveTasks(taskManager: TaskManager): Promise<void> {
        try {
            await this.ensureDirectoryExists();

            const tasks = taskManager.getAllTasks();
            const lines: string[] = [Task.getCsvHeaders()]; // CSV header

            // Serialize each task into CSV row
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

    /**
     * Load tasks from CSV save file (if exists).
     * 
     * - Ensures directory exists
     * - Reads CSV file, skip headers automatically
     * - Converts valid rows into Task objects
     * - Collects error for invalid rows (prevents crashing)
     * 
     * @returns Array of successfully loaded tasks
     */
    async loadTasks(): Promise<Task[]> {
        try {
            await this.ensureDirectoryExists();

            const content = await fileSystem.readFile(this.filePath, "utf-8");
            const lines = content.trim().split("\n");
            
            // Handle case where file exists but empty
            if (lines.length === 1 && lines[0] === "") {
                return [];
            }

            // Detect and skip header line if present
            const firstLine = lines[0];
            const hasHeader = firstLine?.includes("id;title;description");
            const dataLines = hasHeader ? lines.slice(1) : lines;

            const tasks: Task[] = [];
            const errors: string[] = [];

            // Parse each data line to a Task
            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i]?.trim();

                if (line === "") continue; // Skip blank lines

                try {
                    const task = Task.fromCsvRow(line!);
                    tasks.push(task);
                } catch (e) {
                    // Collect errors instead of crashing
                    errors.push(`Line ${i + 2}: ${e instanceof Error ? e.message : "Unknown error"}`);
                }
            }

            // Report partial parse errors; continue loading valid data
            if (errors.length > 0) {
                console.warn("⚠️ Some lines could not be loaded:");
                errors.forEach(e => console.warn(`    -${e}`));
            }

            console.log(`📂 Loaded ${tasks.length} tasks from ${this.filePath}`);
            return tasks;
        } catch (e) {
            // Graceful handling of ERROR NO ENTITY (file doesn't exist yet)
            if ((e as any).code === "ENOENT") {
                console.log(`📝 No save file found. Starting fresh!`);
                return [];
            }

            console.error("❌ Error loading tasks:", e);
            throw new Error(`Failed to load tasks: ${e instanceof Error ? e.message : "Unknown Error"}`);
        }
    }

    /**
     * Check if save file currently exists.
     * 
     * 
     * @returns True if file exists (false otherwise)
     */
    async exists(): Promise<boolean> {
        try {
            await fileSystem.access(this.filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete current save file if present.
     * Silently ignore if file doesn't exist.
     */
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

    /**
     * Create backup of current save file.
     * - Versioned with ISO timestamp in filename
     * 
     * Stored in same `data/` directory with naming format:
     * `tasks-backup-YYY-MM-DDTHH-MM-SS.csv`
     */
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