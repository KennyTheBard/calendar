import { MAX_EVENT_DURATION_MINUTES } from "./constants";
import {
    EventNotFoundError,
    InvalidEventDurationError,
    OverlappingEventsError,
} from "./error";
import { CalendarEvent, RecurrenceRule, RecurringCalendarEvent } from "./event";
import {
    computeAllRecurrences,
    computeEndDate,
    isEventStartingAfterDate,
} from "./helpers";
import { Id, WithId } from "./id";
import { EventStorageLayer, StorageLayer } from "./storage";

/**
 * Warning: Locking mechanisms are not covered by this class and the responsibility
 * to make sure that method calls are sequential falls to the developer
 */
export class Calendar {
    constructor(
        private readonly eventStorage: EventStorageLayer<CalendarEvent>,
        private readonly recurringEventStorage: StorageLayer<RecurringCalendarEvent>
    ) {}

    public createEvent = async (
        startDate: Date,
        durationMinutes: number,
        title: string,
        opt?: {
            allowOverlapping?: boolean;
        }
    ): Promise<WithId<CalendarEvent>> => {
        if (durationMinutes > MAX_EVENT_DURATION_MINUTES) {
            throw new InvalidEventDurationError();
        }
        const event: CalendarEvent = {
            title,
            startDate,
            endDate: computeEndDate(startDate, durationMinutes),
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents =
                await this.eventStorage.findOverlappingWithInterval(
                    event.startDate,
                    event.endDate
                );
            if (overlappingEvents.length > 0) {
                throw new OverlappingEventsError();
            }
        }
        return this.eventStorage.save(event);
    };

    public createRecurringEvent = async (
        startDate: Date,
        durationMinutes: number,
        title: string,
        recurrenceRule: RecurrenceRule,
        opt?: {
            allowOverlapping?: boolean;
        }
    ): Promise<WithId<RecurringCalendarEvent>> => {
        // this will make overlapping easier to check
        if (durationMinutes > MAX_EVENT_DURATION_MINUTES) {
            throw new InvalidEventDurationError();
        }

        // create recurring event
        const endDate = computeEndDate(startDate, durationMinutes);
        const event: RecurringCalendarEvent = {
            title,
            startDate,
            endDate: endDate,
            rule: recurrenceRule,
        };
        const recurringEvent = await this.recurringEventStorage.save(event);

        // generate all recurrentEvent instances
        const eventInstances = computeAllRecurrences(
            {
                title: recurringEvent.title,
                startDate: recurringEvent.startDate,
                endDate: recurringEvent.endDate,
                recurringCalendarEventId: recurringEvent.id,
            },
            recurringEvent.rule
        );

        // check overlapping
        if (!opt?.allowOverlapping) {
            for (const instance of eventInstances) {
                const overlappingEvents =
                    await this.eventStorage.findOverlappingWithInterval(
                        instance.startDate,
                        instance.endDate
                    );
                if (overlappingEvents.length > 0) {
                    throw new OverlappingEventsError();
                }
            }
        }

        // save instances
        for (const instance of eventInstances) {
            await this.eventStorage.save(instance);
        }
        return recurringEvent;
    };

    public listEventsInRange = async (
        startDate: Date,
        endDate: Date
    ): Promise<WithId<CalendarEvent>[]> => {
        const events = await this.eventStorage.findOverlappingWithInterval(
            startDate,
            endDate
        );

        return events;
    };

    public updateEvent = async (
        eventId: Id,
        startDate: Date,
        durationMinutes: number,
        title: string,
        opt?: {
            allowOverlapping?: boolean;
        }
    ): Promise<WithId<CalendarEvent>> => {
        if (durationMinutes > MAX_EVENT_DURATION_MINUTES) {
            throw new InvalidEventDurationError();
        }
        const event: CalendarEvent = {
            title,
            startDate,
            endDate: computeEndDate(startDate, durationMinutes),
        };
        if (!opt?.allowOverlapping) {
            const overlappingEvents =
                await this.eventStorage.findOverlappingWithInterval(
                    event.startDate,
                    event.endDate
                );
            if (
                overlappingEvents.filter((event) => event.id !== eventId)
                    .length > 0
            ) {
                throw new OverlappingEventsError();
            }
        }
        const updatedEvent = await this.eventStorage.update(eventId, event);
        if (updatedEvent === null) {
            throw new EventNotFoundError(eventId);
        }
        return updatedEvent;
    };

    public updateRecurringEvent = async (
        eventId: Id,
        recurrenceRule: RecurrenceRule,
        opt?: {
            allowOverlapping?: boolean;
        }
    ): Promise<WithId<RecurringCalendarEvent>> => {
        const now = new Date();
        const eventToUpdate = await this.recurringEventStorage.findById(
            eventId
        );
        if (eventToUpdate === null) {
            throw new EventNotFoundError(eventId);
        }
        eventToUpdate.rule = recurrenceRule;

        // remove recurrent instances that have not happened yet
        const instances = await this.eventStorage.findByCondition({
            recurringCalendarEventId: eventId,
        });
        const instancesToDelete = instances.filter(
            (instance) => instance.startDate.getTime() > now.getTime()
        );

        // create new future instances based on the new rule
        const newInstances = computeAllRecurrences(
            {
                title: eventToUpdate.title,
                startDate: eventToUpdate.startDate,
                endDate: eventToUpdate.endDate,
                recurringCalendarEventId: eventToUpdate.id,
            },
            recurrenceRule
        );
        const instancesToAdd = newInstances.filter(
            (instance) => instance.startDate.getTime() > now.getTime()
        );

        // check overlapping
        if (!opt?.allowOverlapping) {
            for (const instance of instancesToAdd) {
                const overlappingEvents =
                    await this.eventStorage.findOverlappingWithInterval(
                        instance.startDate,
                        instance.endDate
                    );
                // overlapping events that are instance of the same recurrent event will be removed,
                // so it is safe to ignore them
                const overlappingEventsFromOtherSources =
                    overlappingEvents.filter(
                        (event) => event.recurringCalendarEventId !== eventId
                    );
                if (overlappingEventsFromOtherSources.length > 0) {
                    throw new OverlappingEventsError();
                }
            }
        }

        // update future events after making sure that no overlapping will happen
        for (const instance of instancesToDelete) {
            await this.eventStorage.delete(instance.id);
        }
        for (const instance of instancesToAdd) {
            await this.eventStorage.save(instance);
        }
        const updatedEvent = await this.recurringEventStorage.update(
            eventId,
            eventToUpdate
        );
        if (updatedEvent === null) {
            // should never happen
            throw new EventNotFoundError(eventId);
        }

        return updatedEvent;
    };

    public deleteEvent = async (eventId: Id): Promise<void> => {
        const deleted = await this.eventStorage.delete(eventId);
        if (!deleted) {
            throw new EventNotFoundError(eventId);
        }
    };

    public deleteRecurringEvent = async (
        eventId: Id,
        opt?: {
            deleteOnlyInstanceId?: Id;
            deleteOnlyFutureInstances?: boolean;
        }
    ): Promise<void> => {
        // delete single event
        if (opt?.deleteOnlyInstanceId) {
            // check if event is instance of the recurring event
            const instances = await this.eventStorage.findByCondition({
                recurringCalendarEventId: eventId,
            });
            const instanceToDelete = instances.find(
                (instance) => instance.id === opt?.deleteOnlyInstanceId
            );
            if (!instanceToDelete) {
                throw new EventNotFoundError(eventId);
            }

            // delete instance
            const deleted = await this.eventStorage.delete(instanceToDelete.id);
            if (!deleted) {
                // should not happen
                throw new EventNotFoundError(eventId);
            }
            return;
        }

        // delete recurring event and its instances
        const now = new Date();
        const deleted = await this.recurringEventStorage.delete(eventId);
        if (!deleted) {
            throw new EventNotFoundError(eventId);
        }
        const instances = await this.eventStorage.findByCondition({
            recurringCalendarEventId: eventId,
        });
        for (const instance of instances) {
            if (
                opt?.deleteOnlyFutureInstances &&
                !isEventStartingAfterDate(instance, now)
            ) {
                continue;
            }
            const deletedInstance = await this.eventStorage.delete(instance.id);
            if (!deletedInstance) {
                throw new EventNotFoundError(eventId);
            }
        }
    };
}
