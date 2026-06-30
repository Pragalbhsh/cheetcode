"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = __importDefault(require("./prisma.js"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret';
// REGISTER
router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const existing = await prisma_js_1.default.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });
    if (existing) {
        return res.status(400).json({ error: 'Email or username already taken' });
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_js_1.default.user.create({
        data: { email, username, passwordHash }
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, userId: user.id, username: user.username });
});
// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_js_1.default.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, userId: user.id, username: user.username });
});
exports.default = router;
