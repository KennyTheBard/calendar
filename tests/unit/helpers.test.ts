import {
    CalendarEvent,
    DAY_TO_MS,
    MINUTE_TO_MS,
    RecurrenceRule,
    WEEK_TO_MS,
    computeAllRecurrences,
    computeEndDate,
    computeNextDate,
    computeNextRecurrence,
} from "../../src/lib";

describe("helpers", () => {
    describe("computeEndDate", () => {
        test.each([0, 1, 30, 100, 10000])("%d minutes", (minutes) => {
            const now = new Date();
            const later = computeEndDate(now, minutes);

            expect(later.getTime() - now.getTime()).toBe(
                minutes * MINUTE_TO_MS
            );
        });
    });

    describe("computeNextDate", () => {
        test("daily", () => {
            const now = new Date();
            const later = computeNextDate(now, "daily");

            expect(later.getTime() - now.getTime()).toBe(DAY_TO_MS);
        });

        test("weekly", () => {
            const now = new Date();
            const later = computeNextDate(now, "weekly");

            expect(later.getTime() - now.getTime()).toBe(WEEK_TO_MS);
        });

        describe("monthly", () => {
            it("should return the next month within the same year", () => {
                const inputDate = new Date(2023, 0, 15); // January 15, 2023
                const result = computeNextDate(inputDate, "monthly");
                expect(result.getFullYear()).toBe(2023);
                expect(result.getMonth()).toBe(1); // February (0-based index)
            });

            it("should handle December correctly and move to the next year", () => {
                const inputDate = new Date(2023, 11, 20); // December 20, 2023
                const result = computeNextDate(inputDate, "monthly");
                expect(result.getFullYear()).toBe(2024);
                expect(result.getMonth()).toBe(0); // January (0-based index)
            });
        });
    });

    describe('computeNextRecurrence', () => {
        const event: CalendarEvent = {
            title: "New event",
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 30 * MINUTE_TO_MS),
        };

        it('should compute the next recurrence correctly', () => {          
          const rule: RecurrenceRule = {
            interval: 'daily',
            limit: {
                type: 'count',
                count: 10
            }
          };
          
          const nextRecurrence = computeNextRecurrence(event, rule);
          expect(nextRecurrence.title).toBe(event.title);
          expect(nextRecurrence.startDate).toEqual(computeNextDate(event.startDate, rule.interval))
          expect(nextRecurrence.endDate).toEqual(computeNextDate(event.endDate, rule.interval))
          expect(nextRecurrence.recurringCalendarEventId).toBe(event.recurringCalendarEventId);
        });      
      });

    describe("computeAllRecurrences", () => {
        const event: CalendarEvent = {
            title: "New event",
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 30 * MINUTE_TO_MS),
        };

        it("should return an empty array when count is 0", () => {
            const rule: RecurrenceRule = {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 0,
                },
            };

            const result = computeAllRecurrences(event, rule);
            expect(result).toEqual([]);
        });

        it("should return an empty array when all instances are too late", () => {
            const rule: RecurrenceRule = {
                interval: "daily",
                limit: {
                    type: "date",
                    endDate: new Date(0), // Set an end date in the past
                },
            };

            const result = computeAllRecurrences(event, rule);

            expect(result).toEqual([]);
        });

        it("should return an array of recurrences when count is greater than 0", () => {
            const rule: RecurrenceRule = {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 5, // Set a positive count
                },
            };

            const result = computeAllRecurrences(event, rule);

            expect(result.length).toBe(5); // Check if the result contains 5 recurrences
        });

        it("should return an array of recurrences when instances exist within the date limit", () => {
            const rule: RecurrenceRule = {
                interval: "daily",
                limit: {
                    type: "date",
                    endDate: new Date(new Date().getTime() + 10 * DAY_TO_MS - 10 * MINUTE_TO_MS), // Set an end date in the future
                },
            };

            const result = computeAllRecurrences(event, rule);

            expect(result.length).toEqual(10);
        });
    });
});
