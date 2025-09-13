import { TaskManager } from "../../managers/TaskManager.js";
import { Task } from "../../models/Task.js";
import { join } from "path";
import { jest } from "@jest/globals";

jest.unstable_mockModule("fs", () => ({
    promises: {
        access: jest.fn(),
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        readFile: jest.fn(),
        unlink: jest.fn(),
        copyFile: jest.fn()
    }
}));

// Import fs and FileService after mocking
const { promises: fs } = await import("fs");
const { FileService } = await import("../../services/FileService.js");

describe("FileService", () => {
    let fileService: InstanceType<typeof FileService>;
    let taskManager: TaskManager;
    const mockFileSystem = fs as jest.Mocked<typeof fs>;

    beforeEach(() => {
        fileService = new FileService("test-tasks.csv");
        taskManager = new TaskManager();
        jest.clearAllMocks();
        (Task as any).nextId = 1;
    });

    describe("saveTasks", () => {
        it("Case 1: Save tasks to CSV file successfully", async () => {
            taskManager.addTask("Task 1", "Description 1");
            taskManager.addTask("Task 2", "Description 2");

            mockFileSystem.access.mockRejectedValue(new Error("ENOENT"));
            mockFileSystem.mkdir.mockResolvedValue(undefined);
            mockFileSystem.writeFile.mockResolvedValue(undefined);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            await fileService.saveTasks(taskManager);

            expect(mockFileSystem.mkdir).toHaveBeenCalledWith(
                join(process.cwd(), "data"),
                { recursive: true }
            );

            expect(mockFileSystem.writeFile).toHaveBeenCalled();

            const writeCall = mockFileSystem.writeFile.mock.calls[0];
            expect(writeCall?.[0]).toContain("test-tasks.csv");

            const content = writeCall?.[1] as string;
            expect(content).toContain("id;title;description;completed;createdAt;updatedAt;completedAt");
            expect(content).toContain(`"Task 1";"Description 1"`);
            expect(content).toContain(`"Task 2";"Description 2"`);

            consoleLogSpy.mockRestore();
        });
        
        it("Case 2: Do not create directory if already exists", async () => {
            taskManager.addTask("Task 1");

            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.writeFile.mockResolvedValueOnce(undefined);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            await fileService.saveTasks(taskManager);

            expect(mockFileSystem.mkdir).not.toHaveBeenCalled();
            expect(mockFileSystem.writeFile).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it("Case 3: Handle write error", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.writeFile.mockRejectedValueOnce(new Error("Write failed"));

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

            await expect(fileService.saveTasks(taskManager)).rejects.toThrow("Failed to save tasks");

            consoleErrorSpy.mockRestore();
        });
    });

    describe("loadTasks", () => {
        it("Case 1: Load tasks from CSV file successfully", async () => {
            const csvContent = `id;title;description;completed;createdAt;updatedAt;completedAt
            1;"Task 1";"Description 1";false;2024-01-01T00:00:00.000Z;2024-01-01T00:00:00.000Z;
            2;"Task 2";"Description 2";true;2024-01-01T00:00:00.000Z;2024-01-01T00:00:00.000Z;2024-01-01T01:00:00.000Z`;

            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.readFile.mockResolvedValueOnce(csvContent);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            const tasks = await fileService.loadTasks();

            expect(tasks).toHaveLength(2);
            expect(tasks[0]?.title).toBe("Task 1");
            expect(tasks[0]?.completed).toBe(false);
            expect(tasks[1]?.title).toBe("Task 2");
            expect(tasks[1]?.completed).toBe(true);

            consoleLogSpy.mockRestore();
        });

        it("Case 2: Return empty array when filed doesn't exist", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);
            const error: any = new Error("ENOENT");
            error.code = "ENOENT";
            mockFileSystem.readFile.mockRejectedValueOnce(error);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            const tasks = await fileService.loadTasks();

            expect(tasks).toEqual([]);

            consoleLogSpy.mockRestore();
        });

        it("Case 3: Handle empty file", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.readFile.mockResolvedValueOnce("");

            const tasks = await fileService.loadTasks();

            expect(tasks).toEqual([]);
        });

        it("Case 4: Skip invalid lines and continue loading properly", async () => {
            const csvContent = [
                "id;title;description;completed;createdAt;updatedAt;completedAt",
                '1;"Valid Task";"Description";false;2024-01-01T00:00:00.000Z;2024-01-01T00:00:00.000Z;',
                "2;invalid;line;only;six;fields",
                '3;"Another Valid";"";true;2024-01-01T00:00:00.000Z;2024-01-01T00:00:00.000Z;2024-01-01T01:00:00.000Z'
            ].join("\n");

            mockFileSystem.access.mockResolvedValueOnce(undefined as any);
            mockFileSystem.readFile.mockResolvedValueOnce(csvContent as any);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

            const tasks = await fileService.loadTasks();

            expect(tasks).toHaveLength(2);
            expect(tasks[0]?.title).toBe("Valid Task");
            expect(tasks[1]?.title).toBe("Another Valid");
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

        it("Case 5: Handle file without header", async () => {
            const csvContent = `1;"Task Title";"Description 1";false;2024-01-01T00:00:00.000Z;2024-01-01T00:00:00.000Z;`;

            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.readFile.mockResolvedValueOnce(csvContent);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            const tasks = await fileService.loadTasks();

            expect(tasks).toHaveLength(1);
            expect(tasks[0]?.title).toBe("Task Title");

            consoleLogSpy.mockRestore();
        });

        it("Case 6: Handle read errors", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.readFile.mockRejectedValueOnce(new Error("Read failed"));

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

            await expect(fileService.loadTasks()).rejects.toThrow("Failed to load tasks");

            consoleErrorSpy.mockRestore();
        });
    });

    describe("exists", () => {
        it("Case 1: Return true when file exists", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);

            const exists = await fileService.exists();

            expect(exists).toBe(true);
            expect(mockFileSystem.access).toHaveBeenCalledWith(join(process.cwd(), "data", "test-tasks.csv"));
        });

        it("Case 2: Return false when file doesn't exist", async () => {
            mockFileSystem.access.mockRejectedValueOnce(undefined);

            const exists = await fileService.exists();

            expect(exists).toBe(false);
        });
    });

    describe("deleteSaveFile", () => {
        it("Case 1: Delete the save file successfully", async () => {
            mockFileSystem.unlink.mockResolvedValueOnce(undefined);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            await fileService.deleteSaveFile();

            expect(mockFileSystem.unlink).toHaveBeenCalledWith(join(process.cwd(), "data", "test-tasks.csv"));

            consoleLogSpy.mockRestore();
        });

        it("Case 2: Handle file not found gracefully", async () => {
            const error: any = new Error("ENOENT");
            error.code = "ENOENT";
            mockFileSystem.unlink.mockRejectedValueOnce(error);

            await expect(fileService.deleteSaveFile()).resolves.not.toThrow();
        });

        it("Case 3: Throw error for other delete failtures", async () => {
            mockFileSystem.unlink.mockRejectedValueOnce(new Error("Permission denied"));

            await expect(fileService.deleteSaveFile()).rejects.toThrow("Failed to delete save file");
        });
    });

    describe("backup", () => {
        it("Case 1: Create backup when file exists successfully", async () => {
            const mockDate = new Date();
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);

            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.copyFile.mockResolvedValue(undefined);

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            await fileService.backup();

            expect(mockFileSystem.copyFile).toHaveBeenCalled();

            const copyCall = mockFileSystem.copyFile.mock.calls[0];
            expect(copyCall?.[0]).toContain("test-tasks.csv");
            expect(copyCall?.[1]).toMatch(/tasks-backup-.*\.csv/);

            consoleLogSpy.mockRestore();
            jest.restoreAllMocks();
        });

        it("Case 2: Skip backup when file doesn't exist", async () => {
            mockFileSystem.access.mockRejectedValueOnce(new Error("ENOENT"));

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

            await fileService.backup();

            expect(mockFileSystem.access).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith("📝 No save file to backup");

            consoleLogSpy.mockRestore();
        });

        it("Case 3: Handle backup errors", async () => {
            mockFileSystem.access.mockResolvedValueOnce(undefined);
            mockFileSystem.copyFile.mockRejectedValueOnce(new Error("Copy failed"));

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

            await expect(fileService.backup()).rejects.toThrow("Failed to create backup");

            consoleErrorSpy.mockRestore();
        });
    });
});