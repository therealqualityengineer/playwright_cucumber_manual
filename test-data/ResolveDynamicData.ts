const LENGTH = 10;

const chars = {
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
};

function randomFrom(pool: string, length: number): string {
    return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join('');
}

export function RandomString(): string {
    const pool = chars.alpha + chars.upper + chars.numbers;
    return randomFrom(pool, LENGTH);
}

export function RandomNumbers(): string {
    return randomFrom(chars.numbers, LENGTH);
}

export function RandomEmail(): string {
    const local = randomFrom(chars.alpha, LENGTH);
    return `${local}@gmail.com`;
}

export function RandomAlphabets(): string {
    return randomFrom(chars.alpha + chars.upper, LENGTH);
}
