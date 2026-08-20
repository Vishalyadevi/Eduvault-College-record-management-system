import Joi from 'joi';

/**
 * Generic validation middleware using Joi
 * @param {Joi.Schema} schema - The Joi validation schema
 * @param {string} property - The request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ success: false, message: errorMessage });
    }
    
    next();
  };
};

export default validate;
