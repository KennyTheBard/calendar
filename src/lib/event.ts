
export type CalendarEvent = {
    title: string;
    startDate: Date;
    endDate: Date;
    // recurrence?: CalendarEventRecurrence;
}

// export type CalendarEventRecurrence = {
//     interval: "daily" | "weekly" | "monthly";
//     limit: LimitByCountRecurrence | LimitByDateRecurrence;
// };

// export type LimitByCountRecurrence = {
//     type: "count";
//     count: number;
// };

// export type LimitByDateRecurrence = {
//     type: "date";
//     endDate: Date;
// };
