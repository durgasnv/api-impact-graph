const { param, query, validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

const validateIdParam = [
  param("id")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid ID parameter"),
  handleValidation,
];

const validateTargetIdParam = [
  param("id")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid ID parameter"),
  param("targetId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid target ID parameter"),
  handleValidation,
];

const validateVersionIdQuery = [
  query("versionId")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid versionId query parameter"),
  handleValidation,
];

module.exports = { validateIdParam, validateTargetIdParam, validateVersionIdQuery, handleValidation };
