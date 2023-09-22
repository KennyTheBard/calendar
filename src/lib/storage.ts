import { CalendarEvent } from "./event"
import { Id, WithId } from "./id"


export interface StorageLayer {
    save: (event: CalendarEvent) => Promise<WithId<CalendarEvent>>;
    /**
     * @returns all events that overlap with the given interval
     */
    list: (startDate: Date, endDate: Date) => Promise<WithId<CalendarEvent>[]>;
    findById: (id: Id) => Promise<WithId<CalendarEvent>>;
    update: (id: Id, event: CalendarEvent) => Promise<WithId<CalendarEvent> | null>;
    delete: (id: Id) => Promise<boolean>;
}
