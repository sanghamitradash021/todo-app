"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
// target defaults to 'body'; pass 'query' to validate req.query instead (e.g. GET filter params)
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        try {
            schema.parse(target === 'query' ? req.query : req.body);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map