import { DAY_TO_MS, MINUTE_TO_MS, WEEK_TO_MS } from "./constants";
import { CalendarEvent, RecurrenceInterval, RecurrenceRule } from "./event";

export const computeEndDate = (
    startDate: Date,
    durationMinutes: number
): Date => new Date(startDate.getTime() + durationMinutes * MINUTE_TO_MS);

export const computeNextRecurrence = (
    event: CalendarEvent,
    rule: RecurrenceRule
) => {
    return {
        title: event.title,
        startDate: computeNextDate(event.startDate, rule.interval),
        endDate: computeNextDate(event.endDate, rule.interval),
        recurringCalendarEventId: event.recurringCalendarEventId,
    };
};

export const computeNextDate = (date: Date, interval: RecurrenceInterval): Date => {
    switch (interval) {
        case "daily":
            return getNextDay(date);
        case "weekly":
            return getNextWeek(date);
        case "monthly":
            return getNextMonth(date);
    }
};

export const getNextDay = (date: Date): Date =>
    new Date(date.getTime() + DAY_TO_MS);

export const getNextWeek = (date: Date): Date =>
    new Date(date.getTime() + WEEK_TO_MS);

export const getNextMonth = (date: Date): Date => {
    if (date.getMonth() === 11) {
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(0);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    return date;
};

export const computeAllRecurrences = (
    event: CalendarEvent,
    rule: RecurrenceRule
): CalendarEvent[] => {
    const recurrences: CalendarEvent[] = [{ ...event }];
    if (rule.limit.type === "count") {
        // no recurrences
        if (rule.limit.count === 0) {
            return [];
        }
        for (let i = 1; i < rule.limit.count; i++) {
            recurrences.push(
                computeNextRecurrence(recurrences[recurrences.length - 1], rule)
            );
        }
    } else if (rule.limit.type === "date") {
        // all instances are too late
        if (isEventStartingAfterDate(event, rule.limit.endDate)) {
            return [];
        }
        let nextEvent = computeNextRecurrence(
            recurrences[recurrences.length - 1],
            rule
        );
        while (isEventEndingBeforeDate(nextEvent, rule.limit.endDate)) {
            recurrences.push(nextEvent);
            nextEvent = computeNextRecurrence(nextEvent, rule);
        }
    }
    return recurrences;
};

export const isEventStartingAfterDate = (event: CalendarEvent, date: Date): boolean => event.startDate.getTime() > date.getTime();
export const isEventEndingBeforeDate = (event: CalendarEvent, date: Date): boolean => event.endDate.getTime() < date.getTime();
