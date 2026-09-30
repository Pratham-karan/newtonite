"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const errors_1 = require("../common/errors");
/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema.
 * Returns structured 422 errors with field-level details.
 */
function validate(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const fieldErrors = {};
                for (const issue of err.issues) {
                    const path = issue.path.join('.');
                    fieldErrors[path] = issue.message;
                }
                next(new errors_1.ValidationError('Validation failed', { fields: fieldErrors }));
            }
            else {
                next(err);
            }
        }
    };
}
/**
 * Validates req.query against a Zod schema (for GET endpoints with filters).
 */
function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const fieldErrors = {};
                for (const issue of err.issues) {
                    const path = issue.path.join('.');
                    fieldErrors[path] = issue.message;
                }
                next(new errors_1.ValidationError('Invalid query parameters', { fields: fieldErrors }));
            }
            else {
                next(err);
            }
        }
    };
}
//# sourceMappingURL=validate.js.map