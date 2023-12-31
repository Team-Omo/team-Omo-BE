import Joi from "joi";

const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "유효한 이메일 주소를 입력해주세요.",
    "any.required": "이메일을 입력해주세요.",
  }),
});

const nicknameSchema = Joi.object({
  nickname: Joi.string().trim().min(2).max(15).required().messages({
    "string.min": "닉네임은 최소 2자리 이상이어야 합니다.",
    "string.max": "닉네임은 최대 15자리 이하이어야 합니다.",
    "any.required": "닉네임을 입력해주세요.",
  }),
});

const registerSchema = Joi.object({
  nickname: Joi.string().trim().min(2).max(15).required().messages({
    "string.min": "닉네임은 최소 2자리 이상이어야 합니다.",
    "string.max": "닉네임은 최대 15자리 이하이어야 합니다.",
    "any.required": "닉네임을 입력해주세요.",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "유효한 이메일 주소를 입력해주세요.",
    "any.required": "이메일을 입력해주세요.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "비밀번호는 최소 6자 이상이어야 합니다.",
    "any.required": "비밀번호를 입력해주세요.",
  }),
  confirmedPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "비밀번호가 일치하지 않습니다.",
      "any.required": "비밀번호 확인을 입력해주세요.",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "유효한 이메일 주소를 입력해주세요.",
    "any.required": "이메일을 입력해주세요.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "비밀번호는 최소 6자 이상이어야 합니다.",
    "any.required": "비밀번호를 입력해주세요.",
  }),
});

const profileEditSchema = Joi.object({
  nickname: Joi.string().trim().min(2).max(15).messages({
    "string.min": "닉네임은 최소 2자리 이상이어야 합니다.",
    "string.max": "닉네임은 최대 15자리 이하이어야 합니다.",
  }),
  newPassword: Joi.string().min(6).messages({
    "string.min": "비밀번호는 최소 6자 이상이어야 합니다.",
  }),
  confirmedPassword: Joi.string().valid(Joi.ref("newPassword")).messages({
    "any.only": "비밀번호가 일치하지 않습니다.",
  }),
});

export {
  registerSchema,
  loginSchema,
  profileEditSchema,
  emailSchema,
  nicknameSchema,
};
