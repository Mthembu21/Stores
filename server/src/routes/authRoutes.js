const express = require('express');
const { login, me, bootstrapAdmin } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/bootstrap-admin', bootstrapAdmin);

module.exports = { authRoutes: router };
