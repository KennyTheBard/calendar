import { CalendarEvent } from "./event";
import { Id, WithId } from "./id";

export interface StorageLayer<EventType> {
    save: (event: EventType) => Promise<WithId<EventType>>;
    findById: (id: Id) => Promise<WithId<EventType> | null>;
    update: (id: Id, event: EventType) => Promise<WithId<EventType> | null>;
    delete: (id: Id) => Promise<boolean>;
}

export interface EventStorageLayer<EventType> extends StorageLayer<EventType> {
    /**
     * @returns all events that overlap with the given interval
     */
    findOverlappingWithInterval: (
        startDate: Date,
        endDate: Date
    ) => Promise<WithId<EventType>[]>;
    findByCondition: (
        condition: Partial<EventType>
    ) => Promise<WithId<EventType>[]>;
}
