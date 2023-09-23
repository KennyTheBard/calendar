import {
    CalendarEvent,
    EventStorageLayer,
    Id,
    StorageLayer,
    WithId,
} from "../../src/lib";
import { v4 as uuid } from "uuid";

export class CalendarEventStorage implements EventStorageLayer<CalendarEvent> {
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

    findOverlappingWithInterval = async (
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

    findByCondition = async (
        condition: Partial<CalendarEvent>
    ): Promise<WithId<CalendarEvent>[]> => {
        const filterFn = this.conditionToFilterFn(condition);
        return Object.values(this.events).filter(filterFn);
    };

    findById = async (id: string): Promise<WithId<CalendarEvent> | null> =>
        this.events[id] ?? null;

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

    private conditionToFilterFn =
        (condition: Partial<CalendarEvent>) =>
        (event: WithId<CalendarEvent>): boolean => {
            for (const key in condition) {
                if (event[key] !== condition[key]) {
                    return false;
                }
            }
            return true;
        };
}
