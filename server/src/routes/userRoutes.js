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

router.get('/', listUsers);
router.post('/', requireRole(Roles.Admin, Roles.ToolsStoreman), createUser);
router.patch('/:id', requireRole(Roles.Admin, Roles.ToolsStoreman), updateUser);
router.delete('/:id', requireRole(Roles.Admin, Roles.ToolsStoreman), deleteUser);

module.exports = { userRoutes: router };
