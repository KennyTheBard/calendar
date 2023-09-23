import { Id } from "./id";

export type BaseCalendarEvent = {
    title: string;
    startDate: Date;
    endDate: Date;
};

export type CalendarEvent = BaseCalendarEvent & {
    recurringCalendarEventId?: Id;
};

export type RecurringCalendarEvent = BaseCalendarEvent & {
    rule: RecurrenceRule;
};

export type RecurrenceRule = {
    interval: RecurrenceInterval;
    limit: LimitByCountRecurrence | LimitByDateRecurrence;
};

export type RecurrenceInterval = "daily" | "weekly" | "monthly";

export type LimitByCountRecurrence = {
    type: "count";
    count: number;
};

export type LimitByDateRecurrence = {
    type: "date";
    endDate: Date;
};
