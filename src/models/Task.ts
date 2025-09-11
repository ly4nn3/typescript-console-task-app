/**
 * Task Model, represents a task in the task management system.
 * Each task has a unique ID, title, description, status, and creation timestamp.
 */
export class Task {
    // Static variable to keep track of next ID to assign
    private static nextId: number = 1;

    public readonly id: number;
    public title: string;
    public description: string;
    public completed: boolean;
    public createdAt: Date;

    constructor(title: string, description: string = "") {
        this.id = Task.nextId++;
        this.title = title;
        this.description = description;
        this.completed = false;
        this.createdAt = new Date();
    }

    markAsCompleted(): void {
        this.completed = true;
    }

    markAsIncomplete(): void {
        this.completed = false;
    }

    toString(): string {
        const status = this.completed ? "✅" : "❌";
        const taskHeader = `[${this.id}] ${status} ${this.title}`;
        const taskDescription = this.description ? ` - ${this.description}` : "";

        return taskHeader + taskDescription;
    }

    // CSV serialization to store tasks
    toCsvRow(): string {
        const id = this.id.toString();
        const title = `"${this.title}"`;
        const description = `"${this.description}"`;
        const completed = this.completed.toString();
        const timestamp = this.createdAt.toISOString();

        return [id, title, description, completed, timestamp].join(",");
    }

    static fromCsvRow(csvRow: string): Task {
        const parts = Task.parseCsvRow(csvRow);

        if (parts.length !== 5) {
            throw new Error(`Invalid CSV format: expected 5 fields, got ${parts.length}`);
        }

        const [id, title, description, completed, createdAt] = parts;

        const task = new Task(
            title!.replace(/"/g, "") || "Untitled",
            description!.replace(/"/g, "")
        );

        (task as any).id = parseInt(id!);
        task.completed = completed === "true";
        (task as any).createdAt = new Date(createdAt!);

        if (task.id >= Task.nextId) {
            Task.nextId = task.id + 1;
        }

        return task;
    }

    private static parseCsvRow(csvRow: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < csvRow.length; i++) {
            const char = csvRow[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }
}
