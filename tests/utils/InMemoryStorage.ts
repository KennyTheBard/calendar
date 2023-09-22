import { CalendarEvent, Id, StorageLayer, WithId } from "../../src/lib";
import { v4 as uuid } from "uuid";

export class InMemoryStorage implements StorageLayer {
    private readonly events: Record<Id, WithId<CalendarEvent>> = {};

    save = async (event: CalendarEvent): Promise<WithId<CalendarEvent>> => {
        const id = uuid();
        const eventWithId: WithId<CalendarEvent> = {
            ...event,
            id,
        };
        this.events[id] = eventWithId;
        return eventWithId;
    };

    list = async (
        startDate: Date,
        endDate: Date
    ): Promise<WithId<CalendarEvent>[]> => {
        return Object.values(this.events).filter(
            (event) =>
                !(
                    event.endDate.getTime() < startDate.getTime() ||
                    event.startDate.getTime() > endDate.getTime()
                )
        );
    };

    findById = async (id: string): Promise<WithId<CalendarEvent>> =>
        this.events[id];

    update = async (
        id: string,
        event: CalendarEvent
    ): Promise<WithId<CalendarEvent> | null> => {
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
