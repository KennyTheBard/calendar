import { CalendarEvent } from "./event";
import { Id, WithId } from "./id";
import { CalendarEventOptions } from "./options";
import { StorageLayer } from "./storage";

export class Calendar {
    constructor(private readonly storage: StorageLayer) {}

    public createEvent = async (
        startDate: Date,
        durationMinutes: number,
        title: string,
        opt?: CalendarEventOptions
    ): Promise<WithId<CalendarEvent>> => {
        const event: CalendarEvent = {
            title,
            startDate,
            endDate: new Date(
                startDate.getTime() + durationMinutes * 60 * 1000
            ), // TODO
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents = await this.storage.list(
                event.startDate,
                event.endDate
            );
            if (overlappingEvents.length > 0) {
                throw new Error(""); // TODO
            }
        }
        return this.storage.save(event);
    };

    public listEventsInRange = async (
        startDate: Date,
        endDate: Date
    ): Promise<WithId<CalendarEvent>[]> => {
        return this.storage.list(startDate, endDate);
    };

    public updateEvent = async (
        id: Id,
        startDate: Date,
        durationMinutes: number,
        title: string,
        opt?: CalendarEventOptions
    ): Promise<WithId<CalendarEvent>> => {
        const event: CalendarEvent = {
            title,
            startDate,
            endDate: new Date(
                startDate.getTime() + durationMinutes * 60 * 1000
            ), // TODO
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents = await this.storage.list(
                event.startDate,
                event.endDate
            );
            if (overlappingEvents.length > 0) {
                throw new Error(""); // TODO
            }
        }
        return this.storage.update(id, event);
    };

    public deleteEvent = async (
        eventId: Id
    ): Promise<boolean> => {
        return this.storage.delete(eventId);
    };
}
