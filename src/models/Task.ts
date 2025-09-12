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
    public updatedAt: Date;
    public completedAt?: Date;

    constructor(title: string, description: string = "") {
        this.id = Task.nextId++;
        this.title = title;
        this.description = description;
        this.completed = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    markAsCompleted(): void {
        this.completed = true;
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }

    markAsIncomplete(): void {
        this.completed = false;
        delete this.completedAt;
        this.updatedAt = new Date();
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
        const title = `"${this.title.replace(/"/g, '""')}"`;
        const description = `"${this.description.replace(/"/g, '""')}"`;
        const completed = this.completed.toString();
        const createdAt = this.createdAt.toISOString();
        const updatedAt = this.updatedAt.toISOString();
        const completedAt = this.completedAt ? this.completedAt.toISOString() : "";

        return [id, title, description, completed, createdAt, updatedAt, completedAt].join(";");
    }

    static fromCsvRow(csvRow: string): Task {
        const parts = Task.parseCsvRow(csvRow);

        if (parts.length !== 7) {
            throw new Error(`Invalid CSV format: expected 7 fields, got ${parts.length}`);
        }

        const [id, title, description, completed, createdAt, updatedAt, completedAt] = parts;

        const task = new Task(
            title || "Untitled",
            description || ""
        );

        (task as any).id = parseInt(id!);
        task.completed = completed === "true";
        (task as any).createdAt = new Date(createdAt!);
        task.updatedAt = new Date(updatedAt!);

        if (completedAt && completedAt.trim() !== "") {
            task.completedAt = new Date(completedAt);
        }

        if (task.id >= Task.nextId) {
            Task.nextId = task.id + 1;
        }

        return task;
    }

    private static parseCsvRow(csvRow: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        let startedWithQuote = false;

        for (let i = 0; i < csvRow.length; i++) {
            const char = csvRow[i];
            const nextChar = csvRow[i + 1];

            if (char === '"') {
                if (!inQuotes && current.length === 0) {
                    startedWithQuote = true;
                    inQuotes = true;
                } else if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else if (inQuotes && (nextChar === ';' || nextChar === undefined)) {
                    inQuotes = false;
                } else if (inQuotes) {
                    current += char;
                }
            } else if (char === ";" && !inQuotes) {
                result.push(current);
                current = "";
                startedWithQuote = false;
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }
    
    static getCsvHeaders(): string {
        return "id;title;description;completed;createdAt;updatedAt;completedAt";
    }
}
