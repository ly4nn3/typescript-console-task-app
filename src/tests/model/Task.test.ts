import { Task } from "../../models/Task.js";

describe("Task Model", () => {
    beforeEach(() => {
        // Reset static nextId before each test
        (Task as any).nextId = 1;
    });

    describe("Constructor", () => {
        test("Case 1: Create a task with auto-generated ID and a user input title", () => {
            const task = new Task("Test Task 1");

            expect(task.id).toBe(1);
            expect(task.title).toBe("Test Task 1");
        });

        test("Case 2: Create a task with user input title and description", () => {
            const task = new Task("Test Task 2", "Test task 2 description");

            expect(task.title).toBe("Test Task 2");
            expect(task.description).toBe("Test task 2 description")
        });

        test("Case 3: Created task description can be undefined", () => {
            const task = new Task("Test Task 3")
            expect(task.description).toBe("");
        });

        test("Case 4: Newly created task completed status should be false", () => {
            const task = new Task("Test Task 4");

            expect(task.completed).toBe(false);
        });

        test("Case 5: Newly created task dates (createdAt, updatedAt) should be instance of Date", () => {
            const task = new Task("Test Task 5");

            expect(task.createdAt).toBeInstanceOf(Date);
            expect(task.updatedAt).toBeInstanceOf(Date);
        });

        test("Case 6: Newly created task completed date should be undefined", () => {
            const task = new Task("Test Task 6");
            expect(task.completedAt).toBeUndefined();
        });

        test("Case 7: Increment ID for each new task", () => {
            const tasks = ["Task 1", "Task 2", "Task 3"];

            for (let i = 0; i < tasks.length; i++) {
                const task = new Task(tasks[i]!);
                const expected = i + 1;
                expect(task.id).toBe(expected);
            }
        });
    });

    describe("markAsCompleted", () => {
        test("Case 1: Mark task as completed, set completedAt date", () => {
            const task = new Task("Test Task 1");

            task.markAsCompleted();

            expect(task.completed).toBe(true);
            expect(task.completedAt).toBeInstanceOf(Date);
        });

        test("Case 2: Task completedAt and updatedAt date should be >= to before incomplete date", () => {
            const task = new Task("Test Task 2")
            const beforeComplete = new Date();
            
            task.markAsCompleted();
            
            expect(task.completedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
        });
    });

    describe("markAsIncomplete", () => {
        test("Case 1: Mark completed task as incomplete, remove completedAt", () => {
            const task = new Task("Test Task 1");
            task.markAsCompleted();

            task.markAsIncomplete();

            expect(task.completed).toBe(false);
            expect(task.completedAt).toBeUndefined();
        });

        test("Case 2: Incomplete task updatedAt date should be >= to before completed date", () => {
            const task = new Task("Test Task 2")
            task.markAsCompleted();

            const beforeIncomplete = new Date();
            task.markAsIncomplete();
            
            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeIncomplete.getTime());
        });
    });

    describe("toString", () => {
        it("Case 1: Format incomplete task correctly", () => {
            const task = new Task("Test Task 1", "Test task 1 description");

            expect(task.toString()).toBe("[1] ❌ Test Task 1 - Test task 1 description");
        });

        it("Case 2: Format completed task correctly", () => {
            const task = new Task("Test Task 2", "Test task 2 description");
            task.markAsCompleted();

            expect(task.toString()).toBe("[1] ✅ Test Task 2 - Test task 2 description");
        });

        it("Case 3: Format/handle task without description correctly", () => {
            const task = new Task("Test Task 3");

            expect(task.toString()).toBe("[1] ❌ Test Task 3");
        });
    });

    describe("CSV Serialization", () => {
        
        describe("toCsvRow", () => {
            it("Case 1: Serialize a simple task to CSV correctly", () => {
                const task = new Task("Test Task 1", "Test task 1 description");
                const csv = task.toCsvRow();
                const parts = csv.split(";");
                
                expect(parts[0]).toBe("1");                         // id
                expect(parts[1]).toBe(`"Test Task 1"`);             // title
                expect(parts[2]).toBe(`"Test task 1 description"`); // description
                expect(parts[3]).toBe("false");                     // completed
                expect(parts[6]).toBe("");                          // completedAt
            });

            it("Case 2: Escape quotes in title and description", () => {
                const task = new Task(`Task with "quotes"`, `Description with "quotes"`);
                const csv = task.toCsvRow();

                expect(csv).toContain(`"Task with ""quotes"""`);
                expect(csv).toContain(`"Description with ""quotes"""`);
            });

            it("Case 3: Serialize completed task with completedAt", () => {
                const task = new Task("Test Task 2");
                task.markAsCompleted();

                const csv = task.toCsvRow();
                const parts = csv.split(";");

                expect(parts[3]).toBe("true");  // completed
                expect(parts[6]).not.toBe("");  // completedAt must have a value
            });
        });

        describe("fromCsvRow", () => {
            it("Case 1: Deserialize a simple CSV row successfully", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `1;"Test Task";"Test description";false;${createdAt};${updatedAt};`;

                const task = Task.fromCsvRow(csvRow);

                expect(task.id).toBe(1);
                expect(task.title).toBe("Test Task");
                expect(task.description).toBe("Test description");
                expect(task.completed).toBe(false);
                expect(task.completedAt).toBeUndefined;
            });
            
            it("Case 2: Handle escaped quotes", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `1;"Task with ""quotes""";"Test description with ""quotes""";false;${createdAt};${updatedAt};`;

                const task = Task.fromCsvRow(csvRow);

                expect(task.title).toBe(`Task with "quotes"`);
                expect(task.description).toBe(`Test description with "quotes"`);
            });

            it("Case 3: Handle completed task with completedAt", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const completedAt = new Date().toISOString();
                const csvRow = `1;"Test Task";"";true;${createdAt};${updatedAt};${completedAt}`;
                
                const task = Task.fromCsvRow(csvRow);

                expect(task.completed).toBe(true);
                expect(task.completedAt).toBeInstanceOf(Date);
            });

            it("Case 4: Update static nextId wen loading task with higher ID", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `9;"Test Task";"";false;${createdAt};${updatedAt};`;

                Task.fromCsvRow(csvRow);
                const newTask1 = new Task("New Task 1");
                const newTask2 = new Task("New Task 2");

                expect(newTask1.id).toBe(10);
                expect(newTask2.id).toBe(11);
            });

            it("Case 5: Throw error for invalid CSV formats", () => {
                const invalidCsv = `1;"Test Task"`; // Missing other fields

                expect(() => Task.fromCsvRow(invalidCsv)).toThrow("Invalid CSV format");
            });

            it("Case 6: Handle empty fields gracefully", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `1;"";"";false;${createdAt};${updatedAt};`;

                const task = Task.fromCsvRow(csvRow);

                expect(task.title).toBe("Untitled");
                expect(task.description).toBe("");
            });
        });

        describe("parseCsvRow edge cases", () => {
            it("Case 1: Handle malformed quotes", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `1;"Test "Task";"Description";false;${createdAt};${updatedAt};`;

                const task = Task.fromCsvRow(csvRow);

                expect(task.description).toBe("Description");
            });

            it("Case 2: Handle mixed quoted/unquoted fields", () => {
                const createdAt = new Date().toISOString();
                const updatedAt = new Date().toISOString();
                const csvRow = `1;Unquoted Title;"Quoted description";false;${createdAt};${updatedAt};`;

                const task = Task.fromCsvRow(csvRow);

                expect(task.title).toBe("Unquoted Title");
                expect(task.description).toBe("Quoted description");
            });
        });

        describe("getCsvHeaders", () => {
            it("Case 1: Return correct CSV headers", () => {
                expect(Task.getCsvHeaders()).toBe("id;title;description;completed;createdAt;updatedAt;completedAt");
            });
        });

        describe("CSV round-trip", () => {
            it("Case 1: Maintain data integrity through serialization/deserialization", () => {
                const originalTask = new Task("Round Trip Test", "Testing CSV round trip");
                originalTask.markAsCompleted();

                const csv = originalTask.toCsvRow();
                const deserializedTask = Task.fromCsvRow(csv);

                expect(deserializedTask.id).toBe(originalTask.id);
                expect(deserializedTask.title).toBe(originalTask.title);
                expect(deserializedTask.description).toBe(originalTask.description);
                expect(deserializedTask.completed).toBe(originalTask.completed);
                expect(deserializedTask.createdAt.toISOString()).toBe(originalTask.createdAt.toISOString());
                expect(deserializedTask.updatedAt.toISOString()).toBe(originalTask.updatedAt.toISOString());
                expect(deserializedTask.completedAt?.toISOString()).toBe(originalTask.completedAt?.toISOString());
            });
        });
    });
})