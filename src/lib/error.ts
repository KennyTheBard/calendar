

export class OverlappingEventsError extends Error {
    constructor() {
        super('Two or more events would be overlapping. Change interval or check `allowOverlapping` option');
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class EventNotFound extends Error {
    constructor(eventId: string) {
        super(`Event ${eventId} is not in calendar`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
