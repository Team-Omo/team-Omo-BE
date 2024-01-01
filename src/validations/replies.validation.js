import joi from "joi"

const createReplies = joi.object({
    content: joi.string().min(2).max(1000).messages({
        "string.min": "댓글작성은 2자 이상 작성해주세요.",
        "string.max": "댓글작성은 1000자 이하로 작성해주세요.",
        "string.empty": "댓글을 작성해주세요."
    }),
})


export { createReplies }