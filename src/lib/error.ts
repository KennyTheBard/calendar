import { MAX_EVENT_DURATION_MINUTES } from "./constants";

export class OverlappingEventsError extends Error {
    constructor() {
        super(
            "Two or more events would be overlapping. Change interval or check `allowOverlapping` option"
        );
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class EventNotFoundError extends Error {
    constructor(eventId: string) {
        super(`Event ${eventId} is not in calendar`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidEventDurationError extends Error {
    constructor() {
        super(`Event cannot have a duration greater than ${MAX_EVENT_DURATION_MINUTES} minutes`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
