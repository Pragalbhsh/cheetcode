"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = __importDefault(require("./prisma.js"));
const NEETCODE_DATA_URL = 'https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json';
async function seed() {
    console.log('Fetching Neetcode 150 problems...');
    const res = await fetch(NEETCODE_DATA_URL);
    const data = await res.json();
    // filter only neetcode150 problems
    const neetcode150 = data.filter((p) => p.neetcode150 === true);
    console.log(`Found ${neetcode150.length} Neetcode 150 problems`);
    // get all unique topics/patterns
    const uniqueTopics = [...new Set(neetcode150.map((p) => p.pattern))];
    console.log('Seeding topics...');
    // create topics first
    for (let i = 0; i < uniqueTopics.length; i++) {
        await prisma_js_1.default.topic.upsert({
            where: { name: uniqueTopics[i] },
            update: {},
            create: {
                name: uniqueTopics[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`Created ${uniqueTopics.length} topics`);
    console.log('Seeding problems...');
    // create problems
    let orderCounters = {};
    for (const problem of neetcode150) {
        const topic = await prisma_js_1.default.topic.findUnique({
            where: { name: problem.pattern }
        });
        if (!topic)
            continue;
        if (!orderCounters[topic.id])
            orderCounters[topic.id] = 1;
        const difficulty = problem.difficulty.toUpperCase();
        const slug = problem.link?.replace('/', '') ?? '';
        await prisma_js_1.default.problem.upsert({
            where: {
                title_topicId: {
                    title: problem.problem,
                    topicId: topic.id
                }
            },
            update: {},
            create: {
                title: problem.problem,
                topicId: topic.id,
                difficulty,
                platform: 'LEETCODE',
                leetcodeSlug: slug,
                sheet: 'NEETCODE_150',
                orderIndex: orderCounters[topic.id]++
            }
        });
    }
    console.log('Done seeding!');
    await prisma_js_1.default.$disconnect();
}
seed().catch(console.error);
