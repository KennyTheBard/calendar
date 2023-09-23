# Calendar

A simple and lightweight JavaScript library for working with calendars.

## Installation

You can install the "calendar" package using npm:

```bash
npm install calendar
```

Note that the package is not yet published on NPM.

## Usage

First, you will have to implement 2 storage layers, one that implements `EventStorageLayer<CalendarEvent>` and one that implements `StorageLayer<RecurringCalendarEvent>`. Then you can create an instance of calendar and use it to add and manage events.

```typescript
const calendar = new Calendar(new YourCalendarEventStorage(), new YourRecurringCalendarEventStorage());

const event = await calendar.createEvent(
    new Date(),
    30,
    "New event"
);
```


## Warning

The library doesn't provide locking or any other mechanism to ensure that concurrent calls won't break each other, so if this could be the case in your particular situation, consider using a lock for access to the calendar instance.
