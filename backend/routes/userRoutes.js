const express = require('express');
const { signUp, login, updateProfile, getMe, logout, allUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.put('/update', protect, updateProfile);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.get('/', protect, allUsers);

module.exports = router;
