const express = require('express');
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);

const MANAGE_USERS_ROLES = [Roles.Admin, Roles.ToolsStoreman, Roles.PartsStoreman, Roles.Supervisor];

router.get('/', listUsers);
router.post('/', requireRole(...MANAGE_USERS_ROLES), createUser);
router.patch('/:id', requireRole(...MANAGE_USERS_ROLES), updateUser);
router.delete('/:id', requireRole(...MANAGE_USERS_ROLES), deleteUser);

module.exports = { userRoutes: router };
