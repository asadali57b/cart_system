
const Joi=require('joi');

const SignupSchema = Joi.object({
    userName: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
    mobile: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please type a valid phone number',
        }),
    dob: Joi.date().less('now').required().custom((value, helpers) => {
        if (new Date(value).getFullYear() > (new Date().getFullYear() - 18)) {
            return helpers.message('You must be at least 18 years old');
        }
        return value;
    }),
    gender: Joi.string().valid('male', 'female', 'other').required(),
});
const signinSchema=Joi.object({
    email:Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required()
})

module.exports=SignupSchema,signinSchema;
