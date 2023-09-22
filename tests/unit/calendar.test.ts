import {
    Calendar,
    EventNotFound,
    MINUTE_TO_MS_FACTOR,
    OverlappingEventsError,
} from "../../src/lib";
import { InMemoryStorage } from "../utils/InMemoryStorage";

describe("Calendar", () => {
    const getCalendar = (): Calendar => new Calendar(new InMemoryStorage());

    describe("add new event", () => {
        test("simple", async () => {
            const calendar = getCalendar();

            const now = new Date();
            const title = `New event - ${now.getTime()}`;
            const result = await calendar.createEvent(now, 30, title);
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.startDate).toBe(now);
            expect(result.endDate.getTime() - result.startDate.getTime()).toBe(
                30 * MINUTE_TO_MS_FACTOR
            );
            expect(result.title).toBe(title);
        });

        describe("overlapping events", () => {
            describe("allowOverlapping = false", () => {
                test("same interval => throw error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await expect(() =>
                        calendar.createEvent(now, 30, "New event 2")
                    ).rejects.toThrow(OverlappingEventsError);
                });

                test("overlapping intervals => throw error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await expect(() =>
                        calendar.createEvent(
                            new Date(now.getTime() + 15 * MINUTE_TO_MS_FACTOR),
                            30,
                            "New event 2"
                        )
                    ).rejects.toThrow(OverlappingEventsError);
                });

                test("touching intervals => throw error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await expect(() =>
                        calendar.createEvent(
                            new Date(now.getTime() + 30 * MINUTE_TO_MS_FACTOR),
                            30,
                            "New event 2"
                        )
                    ).rejects.toThrow(OverlappingEventsError);
                });

                test("different intervals => no error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await calendar.createEvent(
                        new Date(now.getTime() + 60 * MINUTE_TO_MS_FACTOR),
                        30,
                        "New event 1"
                    );
                });
            });
            describe("allowOverlapping = true", () => {
                test("overlapping intervals => no error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await calendar.createEvent(
                        new Date(now.getTime() + 15 * MINUTE_TO_MS_FACTOR),
                        30,
                        "New event 2",
                        {
                            allowOverlapping: true,
                        }
                    );
                });

                test("different intervals => no error", async () => {
                    const calendar = getCalendar();

                    const now = new Date();
                    await calendar.createEvent(now, 30, "New event 1");
                    await calendar.createEvent(
                        new Date(now.getTime() + 60 * MINUTE_TO_MS_FACTOR),
                        30,
                        "New event 1",
                        {
                            allowOverlapping: true,
                        }
                    );
                });
            });
        });
    });

    describe("list events", () => {
        test("empty calendar => no events", async () => {
            const calendar = getCalendar();
            const events = await calendar.listEventsInRange(
                new Date(0),
                new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)
            );
            expect(events).toBeDefined();
            expect(Array.isArray(events)).toBe(true);
            expect(events.length).toBe(0);
        });

        describe("multiple events in calendar", () => {
            test("range contains all => return all events", async () => {
                const calendar = getCalendar();

                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });

                const events = await calendar.listEventsInRange(
                    new Date(0),
                    new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)
                );
                expect(events).toBeDefined();
                expect(Array.isArray(events)).toBe(true);
                expect(events.length).toBe(4);
            });

            test("range contains only part => return part of events", async () => {
                const calendar = getCalendar();

                await calendar.createEvent(
                    new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                    30,
                    "New event",
                    {
                        allowOverlapping: true,
                    }
                );
                await calendar.createEvent(
                    new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                    30,
                    "New event",
                    {
                        allowOverlapping: true,
                    }
                );
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });

                const events = await calendar.listEventsInRange(
                    new Date(),
                    new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)
                );
                expect(events).toBeDefined();
                expect(Array.isArray(events)).toBe(true);
                expect(events.length).toBe(2);
                events.forEach((event) =>
                    expect(event.startDate.getDate() === new Date().getDate())
                );
            });

            test("range contains none => return none", async () => {
                const calendar = getCalendar();

                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });
                await calendar.createEvent(new Date(), 30, "New event", {
                    allowOverlapping: true,
                });

                const events = await calendar.listEventsInRange(
                    new Date(0),
                    new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
                );
                expect(events).toBeDefined();
                expect(Array.isArray(events)).toBe(true);
                expect(events.length).toBe(0);
            });
        });
    });

    describe("update event", () => {
        test("that exists => no error", async () => {
            const calendar = getCalendar();

            const result = await calendar.createEvent(
                new Date(),
                30,
                "New event"
            );
            const updated = await calendar.updateEvent(
                result.id,
                new Date(0),
                120,
                "Updated event"
            );
            expect(updated).toBeDefined();
            expect(updated.title).toBe("Updated event");
        });

        test("that doesn't exist => throw error", async () => {
            const calendar = getCalendar();

            await expect(() =>
                calendar.updateEvent(
                    "not existent",
                    new Date(),
                    31,
                    "Updated event"
                )
            ).rejects.toThrow(EventNotFound);
        });

        describe("with overlapping", () => {
            test("overlapping with itself => no error", async () => {
                const calendar = getCalendar();

                const result = await calendar.createEvent(
                    new Date(),
                    30,
                    "New event"
                );
                await calendar.updateEvent(
                    result.id,
                    new Date(),
                    31,
                    "Updated event"
                );
            });

            test("overlapping with another => throw error", async () => {
                const calendar = getCalendar();

                await calendar.createEvent(new Date(), 30, "New event");
                const eventToUpdate = await calendar.createEvent(
                    new Date(0),
                    30,
                    "New event"
                );
                await expect(() =>
                    calendar.updateEvent(
                        eventToUpdate.id,
                        new Date(),
                        31,
                        "Updated event"
                    )
                ).rejects.toThrow(OverlappingEventsError);
            });

            test("overlapping with another, allowOverlapping = true => no error", async () => {
                const calendar = getCalendar();

                await calendar.createEvent(new Date(), 30, "New event");
                const eventToUpdate = await calendar.createEvent(
                    new Date(0),
                    30,
                    "New event"
                );
                const updated = await calendar.updateEvent(
                    eventToUpdate.id,
                    new Date(),
                    31,
                    "Updated event",
                    {
                        allowOverlapping: true,
                    }
                );
                expect(updated).toBeDefined();
                expect(updated.title).toBe("Updated event");
            });
        });
    });

    describe("delete event", () => {
        test("that exists => no error", async () => {
            const calendar = getCalendar();

            const result = await calendar.createEvent(
                new Date(),
                30,
                "New event"
            );
            await calendar.deleteEvent(result.id);
        });

        test("that doesn't exist => throw error", async () => {
            const calendar = getCalendar();

            await expect(() =>
                calendar.deleteEvent("not existent")
            ).rejects.toThrow(EventNotFound);
        });

        test("that's already deleted => throw error", async () => {
            const calendar = getCalendar();

            const result = await calendar.createEvent(
                new Date(),
                30,
                "New event"
            );
            await calendar.deleteEvent(result.id);
            await expect(() => calendar.deleteEvent(result.id)).rejects.toThrow(
                EventNotFound
            );
        });
    });
});
