import { calculateNextReview } from './sm2';
// simulate a user forgetting a problem
const result1 = calculateNextReview({
    rating: 'FORGOT',
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 1,
});
console.log('FORGOT:', result1);
// simulate a user finding it easy
const result2 = calculateNextReview({
    rating: 'EASY',
    repetitions: 3,
    easeFactor: 2.5,
    intervalDays: 6,
});
console.log('EASY:', result2);
// simulate a user finding it hard
const result3 = calculateNextReview({
    rating: 'HARD',
    repetitions: 2,
    easeFactor: 2.5,
    intervalDays: 3,
});
console.log('HARD:', result3);
