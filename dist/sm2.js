"use strict";
// SM-2 Spaced Repetition Algorithm
// Rating: 0=FORGOT, 1=HARD, 2=OKAY, 3=EASY
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNextReview = calculateNextReview;
function calculateNextReview(input) {
    const { rating, repetitions, easeFactor, intervalDays } = input;
    // convert rating to a number 0-3
    const score = { FORGOT: 0, HARD: 1, OKAY: 2, EASY: 3 }[rating];
    let newInterval;
    let newRepetitions;
    let newEaseFactor;
    if (score === 0) {
        // forgot completely — reset back to day 1
        newInterval = 1;
        newRepetitions = 0;
        newEaseFactor = Math.max(1.3, easeFactor - 0.2); // ease drops, min 1.3
    }
    else {
        // remembered — grow the interval
        if (repetitions === 0) {
            newInterval = 1;
        }
        else if (repetitions === 1) {
            newInterval = 3;
        }
        else {
            newInterval = Math.round(intervalDays * easeFactor);
        }
        newRepetitions = repetitions + 1;
        // adjust ease factor based on how hard it was
        // HARD = ease drops, OKAY = stays same, EASY = ease grows
        const easeDelta = 0.1 - (3 - score) * (0.08 + (3 - score) * 0.02);
        newEaseFactor = Math.max(1.3, easeFactor + easeDelta);
    }
    // calculate the actual date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    return {
        nextReviewDate: nextDate,
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
    };
}
