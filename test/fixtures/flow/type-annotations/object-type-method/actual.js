type T = { a: () => void };
type T = { a: <T>() => void };
type T = { a(): void };
type T = { a<T>(): void };
