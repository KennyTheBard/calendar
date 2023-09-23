import {
    RecurringCalendarEvent,
    Id,
    StorageLayer,
    WithId,
} from "../../src/lib";
import { v4 as uuid } from "uuid";

export class RecurringCalendarEventStorage
    implements StorageLayer<RecurringCalendarEvent>
{
    private readonly events: Record<Id, WithId<RecurringCalendarEvent>> = {};

    save = async (
        event: RecurringCalendarEvent
    ): Promise<WithId<RecurringCalendarEvent>> => {
        const id = uuid();
        const eventWithId: WithId<RecurringCalendarEvent> = {
            ...event,
            id,
        };
        this.events[id] = eventWithId;
        return eventWithId;
    };

    findById = async (id: string): Promise<WithId<RecurringCalendarEvent>> =>
        this.events[id];

    update = async (
        id: string,
        event: RecurringCalendarEvent
    ): Promise<WithId<RecurringCalendarEvent> | null> => {
        if (!this.events[id]) {
            return null;
        }
        const updatedEvent = {
            ...event,
            id,
        };
        this.events[id] = updatedEvent;
        return updatedEvent;
    };

    delete = async (id: string): Promise<boolean> => {
        const exists = !!this.events[id];
        delete this.events[id];
        return exists;
    };
}
