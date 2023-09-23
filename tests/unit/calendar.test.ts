import {
    Calendar,
    CalendarEvent,
    DAY_TO_MS,
    EventNotFoundError,
    InvalidEventDurationError,
    MAX_EVENT_DURATION_MINUTES,
    MINUTE_TO_MS,
    OverlappingEventsError,
    WithId,
    getNextDay,
} from "../../src/lib";
import { CalendarEventStorage } from "../utils/CalendarEventStorage";
import { RecurringCalendarEventStorage } from "../utils/RecurringCalendarEventStorage";

describe("Calendar", () => {
    const getCalendar = (): Calendar =>
        new Calendar(
            new CalendarEventStorage(),
            new RecurringCalendarEventStorage()
        );

    const getAllEventsInCalendar = async (
        calendar: Calendar
    ): Promise<WithId<CalendarEvent>[]> => {
        const tenYearsInMs = 10 * 365 * 24 * 60 * 60 * 1000;
        return calendar.listEventsInRange(
            new Date(0),
            new Date(new Date().getTime() + tenYearsInMs)
        );
    };

    describe("createEvent", () => {
        test("simple", async () => {
            const calendar = getCalendar();

            const now = new Date();
            const title = `New event - ${now.getTime()}`;
            const result = await calendar.createEvent(now, 30, title);
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.startDate).toBe(now);
            expect(result.endDate.getTime() - result.startDate.getTime()).toBe(
                30 * MINUTE_TO_MS
            );
            expect(result.title).toBe(title);
        });

        test("event duration longer than maximum", async () => {
            const calendar = getCalendar();
            await expect(() =>
                calendar.createEvent(
                    new Date(),
                    MAX_EVENT_DURATION_MINUTES + 1,
                    "New event 1"
                )
            ).rejects.toThrow(InvalidEventDurationError);
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
                            new Date(now.getTime() + 15 * MINUTE_TO_MS),
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
                            new Date(now.getTime() + 30 * MINUTE_TO_MS),
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
                        new Date(now.getTime() + 60 * MINUTE_TO_MS),
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
                        new Date(now.getTime() + 15 * MINUTE_TO_MS),
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
                        new Date(now.getTime() + 60 * MINUTE_TO_MS),
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

    describe("createRecurringEvent", () => {
        test("event duration longer than maximum => throw error", async () => {
            const calendar = getCalendar();
            await expect(() =>
                calendar.createRecurringEvent(
                    new Date(),
                    MAX_EVENT_DURATION_MINUTES + 1,
                    "New event",
                    {
                        interval: "daily",
                        limit: {
                            type: "count",
                            count: 10,
                        },
                    }
                )
            ).rejects.toThrow(InvalidEventDurationError);
        });

        test("recurrence limit with count 10 => 10 events", async () => {
            const calendar = getCalendar();

            await calendar.createRecurringEvent(new Date(), 30, "New event", {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 10,
                },
            });
            const events = await calendar.listEventsInRange(
                new Date(0),
                new Date(new Date().getTime() + 100 * DAY_TO_MS)
            );
            expect(events.length).toBe(10);
        });

        test("overlapping with existing event => throw error", async () => {
            const calendar = getCalendar();

            await calendar.createEvent(new Date(), 30, "New event");
            await expect(() =>
                calendar.createRecurringEvent(new Date(), 30, "New event", {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                })
            ).rejects.toThrow(OverlappingEventsError);
        });

        test("overlapping with existing event while allowOverlapping => no error", async () => {
            const calendar = getCalendar();

            await calendar.createEvent(new Date(), 30, "New event");
            await calendar.createRecurringEvent(
                new Date(),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                },
                {
                    allowOverlapping: true,
                }
            );
            const events = await calendar.listEventsInRange(
                new Date(0),
                new Date(new Date().getTime() + 100 * DAY_TO_MS)
            );
            expect(events.length).toBe(11);
        });
    });

    describe("listEventsInRange", () => {
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

                const events = await getAllEventsInCalendar(calendar);
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

    describe("updateEvent", () => {
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
            ).rejects.toThrow(EventNotFoundError);
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

    describe("updateRecurringEvent", () => {
        test("update adds events", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                getNextDay(new Date()),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 0,
                    },
                }
            );
            const eventsBeforeUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeUpdate.length).toBe(0);
            await calendar.updateRecurringEvent(event.id, {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 10,
                },
            });
            const eventsAfterUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsAfterUpdate.length).toBe(10);
        });

        test("update remove old events", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                getNextDay(new Date()),
                30,
                "New event",
                {
                    interval: "weekly",
                    limit: {
                        type: "count",
                        count: 2,
                    },
                }
            );
            const eventsBeforeUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeUpdate.length).toBe(2);
            await calendar.updateRecurringEvent(event.id, {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 10,
                },
            });
            const eventsAfterUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsAfterUpdate.length).toBe(10);
        });

        test("update doesn't affect old events", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                new Date(
                    new Date().getTime() - 5 * DAY_TO_MS + 10 * MINUTE_TO_MS
                ),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeUpdate.length).toBe(10);
            await calendar.updateRecurringEvent(event.id, {
                interval: "daily",
                limit: {
                    type: "count",
                    count: 10,
                },
            });
            const eventsAfterUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsAfterUpdate.length).toBe(10);
            for (let i = 0; i < 5; i++) {
                expect(eventsAfterUpdate[i]).toEqual(eventsBeforeUpdate[i]);
            }
        });

        test("update overlapping => throw error and cancel update", async () => {
            const calendar = getCalendar();

            await calendar.createEvent(
                new Date(new Date().getTime() + 20 * DAY_TO_MS),
                30,
                "New event"
            );
            const event = await calendar.createRecurringEvent(
                new Date(),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeUpdate.length).toBe(11);
            await expect(() =>
                calendar.updateRecurringEvent(event.id, {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 30,
                    },
                })
            ).rejects.toThrow(OverlappingEventsError);
            const eventsAfterUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsAfterUpdate.length).toBe(11);
            for (let i = 0; i < eventsAfterUpdate.length; i++) {
                expect(eventsAfterUpdate[i]).toEqual(eventsBeforeUpdate[i]);
            }
        });

        test("update overlapping, but allowOverlapping => no error and update is applied", async () => {
            const calendar = getCalendar();

            await calendar.createEvent(
                new Date(new Date().getTime() + 20 * DAY_TO_MS),
                30,
                "New event"
            );
            const event = await calendar.createRecurringEvent(
                new Date(),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeUpdate.length).toBe(11);
            await calendar.updateRecurringEvent(
                event.id,
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 30,
                    },
                },
                {
                    allowOverlapping: true,
                }
            );
            const eventsAfterUpdate = await getAllEventsInCalendar(calendar);
            expect(eventsAfterUpdate.length).toBe(31);
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
            ).rejects.toThrow(EventNotFoundError);
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
                EventNotFoundError
            );
        });
    });

    describe("deleteRecurringEvent", () => {
        test("delete entire recurring event", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                new Date(),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeDelete = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeDelete.length).toBe(10);
            await calendar.deleteRecurringEvent(event.id);
            const eventsAfterDelete = await getAllEventsInCalendar(calendar);
            expect(eventsAfterDelete.length).toBe(0);
        });

        test("delete only future recurring event instances", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                new Date(
                    new Date().getTime() - 5 * DAY_TO_MS + 10 * MINUTE_TO_MS
                ),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeDelete = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeDelete.length).toBe(10);
            await calendar.deleteRecurringEvent(event.id, {
                deleteOnlyFutureInstances: true,
            });
            const eventsAfterDelete = await getAllEventsInCalendar(calendar);
            expect(eventsAfterDelete.length).toBe(5);
        });

        test("delete only specific recurring event instance", async () => {
            const calendar = getCalendar();

            const event = await calendar.createRecurringEvent(
                new Date(
                    new Date().getTime() - 5 * DAY_TO_MS + 10 * MINUTE_TO_MS
                ),
                30,
                "New event",
                {
                    interval: "daily",
                    limit: {
                        type: "count",
                        count: 10,
                    },
                }
            );
            const eventsBeforeDelete = await getAllEventsInCalendar(calendar);
            expect(eventsBeforeDelete.length).toBe(10);
            await calendar.deleteRecurringEvent(event.id, {
                deleteOnlyInstanceId: eventsBeforeDelete[0].id
            });
            const eventsAfterDelete = await getAllEventsInCalendar(calendar);
            expect(eventsAfterDelete.length).toBe(9);
        });
    });
});
