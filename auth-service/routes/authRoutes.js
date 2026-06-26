const express = require('express');
const { body } = require('express-validator');
const { register, login, verify, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const registerValidation = [
  body('username').notEmpty().withMessage('Username es requerido').isLength({ min: 3, max: 50 }),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

// Rutas públicas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify', verify);

// Rutas protegidas
router.get('/profile', authMiddleware, getProfile);

module.exports = router;