const { body, validationResult, param, query } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be 1-50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name must be 1-50 characters'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateGoogleAuth = [
  body('token')
    .notEmpty()
    .withMessage('Google token is required'),
  
  handleValidationErrors
];

// Team validation rules
const validateTeamCreation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Team name must be 1-100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be less than 500 characters'),
  
  body('slug')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be 3-50 characters and contain only lowercase letters, numbers, and hyphens'),
  
  handleValidationErrors
];

const validateTeamUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Team name must be 1-100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be less than 500 characters'),
  
  handleValidationErrors
];

const validateTeamInvitation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  
  handleValidationErrors
];

// Task validation rules
const validateTaskCreation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Task title must be 1-200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Description must be less than 2000 characters'),
  
  body('columnId')
    .isUUID()
    .withMessage('Valid column ID is required'),
  
  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('Assigned user must be a valid user ID'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date'),
  
  handleValidationErrors
];

const validateTaskUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Task title must be 1-200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Description must be less than 2000 characters'),
  
  body('assignedTo')
    .optional()
    .custom(value => {
      if (value === null || value === '') return true;
      if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) return true;
      throw new Error('Assigned user must be a valid user ID or null');
    }),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be todo, in_progress, or done'),
  
  body('dueDate')
    .optional()
    .custom(value => {
      if (value === null || value === '') return true;
      if (new Date(value).toString() !== 'Invalid Date') return true;
      throw new Error('Due date must be a valid date or null');
    }),
  
  handleValidationErrors
];

const validateTaskMove = [
  body('columnId')
    .isUUID()
    .withMessage('Valid column ID is required'),
  
  body('position')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  
  handleValidationErrors
];

const validateTaskComment = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Comment must be 1-1000 characters'),
  
  handleValidationErrors
];

// Column validation rules
const validateColumnCreation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Column name must be 1-100 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  
  handleValidationErrors
];

const validateColumnUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Column name must be 1-100 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  
  handleValidationErrors
];

// Parameter validation rules
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  
  handleValidationErrors
];

// Query validation rules
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Search query must be 1-100 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateGoogleAuth,
  validateTeamCreation,
  validateTeamUpdate,
  validateTeamInvitation,
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskMove,
  validateTaskComment,
  validateColumnCreation,
  validateColumnUpdate,
  validateUUID,
  validatePagination,
  validateSearch
};