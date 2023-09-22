import { CalendarEvent } from "./event"
import { Id, WithId } from "./id"


export type StorageLayer = {
    save: (event: CalendarEvent) => Promise<WithId<CalendarEvent>>; 
    list: (startDate: Date, endDate: Date) => Promise<WithId<CalendarEvent>[]>;
    findById: (id: Id) => Promise<WithId<CalendarEvent>>;
    update: (id: Id, event: CalendarEvent) => Promise<WithId<CalendarEvent>>;
    delete: (id: Id) => Promise<boolean>;
}
