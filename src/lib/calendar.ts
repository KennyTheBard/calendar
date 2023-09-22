import { MINUTE_TO_MS_FACTOR } from "./constants";
import { EventNotFound, OverlappingEventsError } from "./error";
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
                startDate.getTime() + durationMinutes * MINUTE_TO_MS_FACTOR
            ),
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents = await this.storage.list(
                event.startDate,
                event.endDate
            );
            if (overlappingEvents.length > 0) {
                throw new OverlappingEventsError();
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
        eventId: Id,
        startDate: Date,
        durationMinutes: number,
        title: string,
        opt?: CalendarEventOptions
    ): Promise<WithId<CalendarEvent>> => {
        const event: CalendarEvent = {
            title,
            startDate,
            endDate: new Date(
                startDate.getTime() + durationMinutes * MINUTE_TO_MS_FACTOR
            ),
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents = await this.storage.list(
                event.startDate,
                event.endDate
            );
            if (overlappingEvents.filter(event => event.id !== eventId).length > 0) {
                throw new OverlappingEventsError();
            }
        }
        const updatedEvent = await this.storage.update(eventId, event);
        if (updatedEvent === null) {
            throw new EventNotFound(eventId);
        }
        return updatedEvent;
    };

    public deleteEvent = async (
        eventId: Id
    ): Promise<void> => {
        const deleted = await this.storage.delete(eventId);
        if (!deleted) {
            throw new EventNotFound(eventId);
        }
    };
}
