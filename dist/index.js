"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_js_1 = __importDefault(require("./auth.js"));
const daily_js_1 = require("./daily.js");
const prisma_js_1 = __importDefault(require("./prisma.js"));
const sm2_js_1 = require("./sm2.js");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/auth', auth_js_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Cheatcode API is live' });
});
app.get('/daily/:userId', async (req, res) => {
    const { userId } = req.params;
    const session = await (0, daily_js_1.getDailySession)(userId);
    res.json(session);
});
app.post('/user/topic', async (req, res) => {
    const { userId, topicId } = req.body;
    const user = await prisma_js_1.default.user.update({
        where: { id: userId },
        data: { currentTopicId: topicId }
    });
    res.json({ message: 'Topic updated', currentTopicId: user.currentTopicId });
});
app.get('/topics', async (req, res) => {
    const topics = await prisma_js_1.default.topic.findMany({
        orderBy: { orderIndex: 'asc' }
    });
    res.json(topics);
});
app.post('/revision/rate', async (req, res) => {
    const { userId, problemId, rating } = req.body;
    // get current schedule for this problem
    const schedule = await prisma_js_1.default.revisionSchedule.findUnique({
        where: { userId_problemId: { userId, problemId } }
    });
    if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
    }
    // run SM-2
    const result = (0, sm2_js_1.calculateNextReview)({
        rating,
        repetitions: schedule.repetitions,
        easeFactor: schedule.easeFactor,
        intervalDays: schedule.intervalDays
    });
    // update schedule in database
    const updated = await prisma_js_1.default.revisionSchedule.update({
        where: { userId_problemId: { userId, problemId } },
        data: {
            nextReviewDate: result.nextReviewDate,
            intervalDays: result.intervalDays,
            easeFactor: result.easeFactor,
            repetitions: result.repetitions,
            lastRating: rating
        }
    });
    res.json({ message: 'Schedule updated', nextReviewDate: updated.nextReviewDate });
});
app.post('/problem/solve', async (req, res) => {
    const { userId, problemId } = req.body;
    // mark problem as solved in user_progress
    await prisma_js_1.default.userProgress.upsert({
        where: { userId_problemId: { userId, problemId } },
        update: { status: 'SOLVED', solvedAt: new Date() },
        create: { userId, problemId, status: 'SOLVED', solvedAt: new Date() }
    });
    // create revision schedule entry for SM-2
    await prisma_js_1.default.revisionSchedule.upsert({
        where: { userId_problemId: { userId, problemId } },
        update: {},
        create: { userId, problemId }
    });
    res.json({ message: 'Problem marked as solved, revision scheduled' });
});
app.get('/problems/:topicId', async (req, res) => {
    const { topicId } = req.params;
    const problems = await prisma_js_1.default.problem.findMany({
        where: { topicId },
        orderBy: { orderIndex: 'asc' }
    });
    res.json(problems);
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
