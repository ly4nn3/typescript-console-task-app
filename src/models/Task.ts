/**
 * Task Model - Represents a task in the task management system.
 * 
 * Each task has:
 * - A unique auto-incremented `id`
 * - A `title` and optional `description`
 * - A `completed` state (true/false)
 * - A `createdAt` and `updatedAt` timestamp
 * - An optional `completedAt` timestamp (only set if marked completed)
 * 
 * Tasks also support serialization to and from CSV for persistence.
 */
export class Task {
    /**
     * Keeps track of next unique ID to assign to newly created task.
     * Increments each time a Task is constructed/loaded from storage.
     */
    private static nextId: number = 1;

    /** Task information */
    // Unique ID
    public readonly id: number;
    // Short title
    public title: string;
    // Optional detailed description
    public description: string;
    // Whether the task is currently completed
    public completed: boolean;
    // When the task was originally created
    public createdAt: Date;
    // Last modified/updated timestamp
    public updatedAt: Date;
    // When the task was marked completed (if applicable)
    public completedAt?: Date;

    /**
     * Constructor for new tasks.
     * Assigns a unique ID, sets title/description.
     * Initializes timestamps.
     */
    constructor(title: string, description: string = "") {
        this.id = Task.nextId++;        // Assign next avaiable unique ID
        this.title = title;             // Required title
        this.description = description; // Optional description
        this.completed = false;         // Default: incomplete (hence false)
        this.createdAt = new Date();    // Creation timestamp
        this.updatedAt = new Date();    // Last modified/updated timestamp
    }

    /**
     * Mark task as completed:
     * - Updates `completed`: false to true
     * - Sets `completedAt` timestamp
     * - Refreshes `updatedAt` timestamp
     */
    markAsCompleted(): void {
        this.completed = true;
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Mark task as incomplete:
     * - Resets `completed`: true to false
     * - Removes `completedAt` timestamp
     * - Refreshes `updatedAt` timestamp
     */
    markAsIncomplete(): void {
        this.completed = false;
        delete this.completedAt;
        this.updatedAt = new Date();
    }

    /**
     * Returns human-readable string representation of the task.
     * Example: "[1] ❌ Task1 - Description"
     */
    toString(): string {
        const status = this.completed ? "✅" : "❌";    // Completion status symbol
        const taskHeader = `[${this.id}] ${status} ${this.title}`;
        const taskDescription = this.description ? ` - ${this.description}` : "";

        return taskHeader + taskDescription;
    }

    /**
     * Serializes Task into a CSV row string:
     * - Fields separated by semicolons
     * - Escapes quotation marks inside fields by doubling them (" -> "")
     */
    toCsvRow(): string {
        const id = this.id.toString();
        const title = `"${this.title.replace(/"/g, '""')}"`;
        const description = `"${this.description.replace(/"/g, '""')}"`;
        const completed = this.completed.toString();
        const createdAt = this.createdAt.toISOString();
        const updatedAt = this.updatedAt.toISOString();
        const completedAt = this.completedAt ? this.completedAt.toISOString() : "";

        return [id, title, description, completed, createdAt, updatedAt, completedAt].join(";");
    }

    /**
     * Recreates Task instance from a CSV row string:
     * - Validates and parses the row
     * - Restores timestamps
     * - Ensures `Task.nextId` stays ahead of restored IDs
     * 
     * @throws Error if CSV does not have exactly 7 fields
     */
    static fromCsvRow(csvRow: string): Task {
        const parts = Task.parseCsvRow(csvRow);

        if (parts.length !== 7) {
            throw new Error(`Invalid CSV format: expected 7 fields, got ${parts.length}`);
        }

        const [id, title, description, completed, createdAt, updatedAt, completedAt] = parts;

        // Create new task (initially with a fresh ID to be overwritten)
        const task = new Task(
            title || "Untitled",
            description || ""
        );

        // Overwite system-assigned fields with CSV data
        (task as any).id = parseInt(id!);
        task.completed = completed === "true";
        (task as any).createdAt = new Date(createdAt!);
        task.updatedAt = new Date(updatedAt!);

        // Restore completedAt (if present)
        if (completedAt && completedAt.trim() !== "") {
            task.completedAt = new Date(completedAt);
        }

        // Ensure future tasks get IDs > max restoresd ID
        if (task.id >= Task.nextId) {
            Task.nextId = task.id + 1;
        }

        return task;
    }

    /**
     * Custom CSV parser:
     * - Splits CSV row into fields
     * - Correctly handle quoted values and escaped quotes inside fields
     * 
     * Example input:
     *  1;"Task Title";"Desc with ; and ""quotes"""
     */
    private static parseCsvRow(csvRow: string): string[] {
        const result: string[] = [];    // Parsed fields
        let current = "";               // Current field being built
        let inQuotes = false;           // Inside quoted field or not (default false)
        let startedWithQuote;           // Tracks if field started with a quote

        for (let i = 0; i < csvRow.length; i++) {
            const char = csvRow[i];
            const nextChar = csvRow[i + 1];

            if (char === '"') {
                // Case: opening quote
                if (!inQuotes && current.length === 0) {
                    startedWithQuote = true;
                    inQuotes = true;
                // Case: escaped quote ("")
                } else if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                // Case: closing quote
                } else if (inQuotes && (nextChar === ';' || nextChar === undefined)) {
                    inQuotes = false;
                }
            // Field delimiter (;) outside of quotes
            } else if (char === ";" && !inQuotes) {
                result.push(startedWithQuote ? current.trim() : current);
                current = "";
                startedWithQuote = false;
            // Regular character
            } else {
                current += char;
            }
        }

        // Push last field after loop ends
        result.push(current);
        return result;
    }
    
    /**
     * Returns CSV header row string for task export/import
     */
    static getCsvHeaders(): string {
        return "id;title;description;completed;createdAt;updatedAt;completedAt";
    }
}
