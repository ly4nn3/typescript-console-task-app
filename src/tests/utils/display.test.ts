import { displayTask, displayStats } from "../../utils/display.js";
import { Task } from "../../models/Task.js";
import { jest } from "@jest/globals";

describe("display", () => {
    let consoleSpy: jest.Spied<typeof console.log>;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
        (Task as any).nextId = 1;
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe("displayTask", () => {
        it("Case 1: Display incomplete task successfully", () => {
            const task = new Task("Test Task 1", "Test description");

            displayTask(task);

            expect(consoleSpy).toHaveBeenCalledWith("⏳ [ID: 1] Test Task 1");
            expect(consoleSpy).toHaveBeenCalledWith("    ┖─ Description: Test description");
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("┖─ Created:"));
        });

        it("Case 2: Display completed task with completion date successfully", () => {
            const task = new Task("Test Task 2");
            task.markAsCompleted();
            const completedAt = task.completedAt?.toLocaleDateString();

            displayTask(task);

            expect(consoleSpy).toHaveBeenCalledWith(`✅ [ID: 1] Test Task 2 (completed: ${completedAt})`);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("┖─ Created:"));
        });

        it("Case 3: Display task without description successfully", () => {
            const task = new Task("Test Task 3");

            displayTask(task);

            expect(consoleSpy).toHaveBeenCalledWith("⏳ [ID: 1] Test Task 3");
            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Description:"));
        });

        it("Case 4: Display updated date when task is updated", () => {
            const task = new Task("Test Task 4");

            task.updatedAt = new Date(task.createdAt.getTime() + 1000);

            displayTask(task);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("┖─ Updated:"));
        });
    });

    describe("displayStats", () => {
        it("Case 1: Display statistics with progress bar successfully", () => {
            const stats = {
                total: 10,
                completed: 7,
                pending: 3
            };

            displayStats(stats);

            const firstCall = consoleSpy.mock.calls[0]?.[0] as string;
            expect(firstCall).toContain("📊 Total tasks: 10");
            expect(firstCall).toContain("📈 Completed: 7");
            expect(firstCall).toContain("📉 Pending: 3");
            
            expect(consoleSpy).toHaveBeenCalledWith('🏆 Completion Rate: 70.0%');
            expect(consoleSpy).toHaveBeenCalledWith('    ┖─ Progress: [██████████████░░░░░░]');
        });

        it("Case 2: Handle empty statistics", () => {
            const stats = {
                total: 0,
                completed: 0,
                pending: 0
            };

            displayStats(stats);

            const firstCall = consoleSpy.mock.calls[0]?.[0] as string;
            expect(firstCall).toContain("📊 Total tasks: 0");
            expect(firstCall).toContain("📈 Completed: 0");
            expect(firstCall).toContain("📉 Pending: 0");

            expect(consoleSpy).not.toHaveBeenCalledWith("🏆 Completion Rate:");
        });

        it("Case 3: Handle all completed tasks", () => {
            const stats = {
                total: 5,
                completed: 5,
                pending: 0
            };

            displayStats(stats);

            const firstCall = consoleSpy.mock.calls[0]?.[0] as string;
            expect(firstCall).toContain("📊 Total tasks: 5");
            expect(firstCall).toContain("📈 Completed: 5");
            expect(firstCall).toContain("📉 Pending: 0");

            expect(consoleSpy).toHaveBeenCalledWith("🏆 Completion Rate: 100.0%");
            expect(consoleSpy).toHaveBeenCalledWith("    ┖─ Progress: [████████████████████]");
        });
        
        it("Case 4: Handle no completed tasks", () => {
            const stats = {
                total: 5,
                completed: 0,
                pending: 5
            };

            displayStats(stats);

            const firstCall = consoleSpy.mock.calls[0]?.[0] as string;
            expect(firstCall).toContain("📊 Total tasks: 5");
            expect(firstCall).toContain("📈 Completed: 0");
            expect(firstCall).toContain("📉 Pending: 5");

            expect(consoleSpy).toHaveBeenCalledWith("🏆 Completion Rate: 0.0%");
            expect(consoleSpy).toHaveBeenCalledWith("    ┖─ Progress: [░░░░░░░░░░░░░░░░░░░░]");
        });
    });
});