
export type Id = string;

export type WithId<T> = {
    [P in keyof T]: T[P];
} & {
    id: Id;
};
