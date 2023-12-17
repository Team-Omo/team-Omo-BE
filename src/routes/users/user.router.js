import express from "express";
import { prisma } from "../../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
} from "../../validations/auth.validation.js";

dotenv.config();
const router = express.Router();

/**
 * @swagger
 * paths:
 *  /auth/register:
 *    post:
 *      summary: "Register"
 *      description: "Endpoint for user registration"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 회원 가입 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    users:
 *                      type: object
 *                      example:
 *                          message: "회원가입이 완료되었습니다."
 */

/** Register API */
router.post("/register", async (req, res, next) => {
  try {
    const validation = await registerSchema.validateAsync(req.body);
    const { nickname, email, password, confirmedPassword } = validation;

    const existNickname = await prisma.users.findFirst({
      where: {
        nickname: nickname,
      },
    });

    if (existNickname) {
      return res.status(409).json({ errorMessage: "중복된 닉네임입니다." });
    }

    const existEmail = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (existEmail) {
      return res.status(409).json({ errorMessage: "중복된 이메일입니다." });
    }

    if (password !== confirmedPassword) {
      return res.status(400).json({
        errorMessage: "비밀번호가 일치하지 않습니다. 다시 확인해주세요.",
      });
    }

    const encryptPassword = await bcrypt.hash(password, 10);

    const defaultImageUrl =
      "https://play-lh.googleusercontent.com/38AGKCqmbjZ9OuWx4YjssAz3Y0DTWbiM5HB0ove1pNBq_o9mtWfGszjZNxZdwt_vgHo=w240-h480-rw";

    await prisma.users.create({
      data: {
        email: email,
        password: encryptPassword,
        nickname: nickname,
        imgUrl: defaultImageUrl,
      },
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message });
    }

    return res
      .status(500)
      .json({ errorMessage: "서버에서 오류가 발생하였습니다." });
  }
});

/**
 * @swagger
 * paths:
 *  /auth/login:
 *    post:
 *      summary: "Login"
 *      description: "Endpoint for user login"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 회원 가입 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    users:
 *                      type: object
 *                      example:
 *                          message: "회원가입이 완료되었습니다."
 */

/** Login API */
router.post("/login", async (req, res, next) => {
  try {
    const validation = await loginSchema.validateAsync(req.body);
    const { email, password } = validation;
    const secretKey = process.env.SECRET_TOKEN_KEY;

    // const accessKey = process.env.ACCESS_TOKEN_SECRET_KEY;
    // const refreshKey = process.env.REFRESH_TOKEN_SECRET_KEY;

    const findUser = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!findUser) {
      return res
        .status(404)
        .json({ errorMessage: "해당 이메일로 가입된 계정이 없습니다." });
    }

    const isMatch = await bcrypt.compare(password, findUser.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ errorMessage: "비밀번호가 일치하지 않습니다." });
    }

    // Issue access token
    const accessToken = jwt.sign(
      {
        purpose: "access",
        userId: findUser.userId,
      },
      secretKey,
      { expiresIn: "1h" },
    );

    // Issue refresh token
    const refreshToken = jwt.sign(
      {
        purpose: "refresh",
        userId: findUser.userId,
      },
      secretKey,
      { expiresIn: "7d" },
    );

    const sevenDaysLater = new Date(); // 현재 시간
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Refresh Token을 가지고 해당 유저의 정보를 서버에 저장
    await prisma.refreshTokens.create({
      data: {
        refreshToken: refreshToken,
        UserId: findUser.userId,
        expiresAt: sevenDaysLater,
      },
    });

    // 응답 헤더로 전달
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Authorization, RefreshToken",
    );
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("RefreshToken", `Bearer ${refreshToken}`);

    //
    res.status(200).json({ message: "로그인에 성공하였습니다." });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message });
    }

    return res
      .status(500)
      .json({ errorMessage: "서버에서 오류가 발생하였습니다." });
  }
});

/**
 * @swagger
 * paths:
 *  /auth/tokens/refresh:
 *    post:
 *      summary: "Refresh Token"
 *      description: "Endpoint for refreshing access tokens"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 회원 가입 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    users:
 *                      type: object
 *                      example:
 *                          message: "회원가입이 완료되었습니다."
 */

/** 리프레시 토큰을 이용해서 엑세스 토큰을 재발급하는 API */
router.post("/tokens/refresh", authMiddleware, async (req, res, next) => {
  try {
    const secretKey = process.env.SECRET_TOKEN_KEY;
    const { userId } = req.user;
    const { refreshToken } = req.headers;

    // 서버에서도 실제 정보를 가지고 있는지 확인
    const isRefreshTokenExist = await prisma.refreshTokens.findFirst({
      where: {
        refreshToken: refreshToken, // 전달받은 토큰
      },
    });

    if (!isRefreshTokenExist) {
      return res.status(419).json({
        errorMessage: "Refresh token의 정보가 서버에 존재하지 않습니다.",
      });
    }

    const newAccessToken = jwt.sign(
      {
        purpose: "newaccess",
        userId: +userId,
      },
      secretKey,
      { expiresIn: "1h" },
    );

    console.log("새로 발급된 AccessToken: ", newAccessToken);

    res.setHeader("Authorization", `Bearer ${newAccessToken}`);

    return res
      .status(200)
      .json({ message: "엑세스 토큰이 정상적으로 재발급되었습니다." });
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({ errorMessage: "서버에서 문제가 발생하였습니다." });
  }
});

// 제공된 토큰이 유효한지 여부를 검증하는 함수
function validateToken(token, secretKey) {
  try {
    const accessToken = token.split(" ")[1]; // Bearer 제거 후 토큰 추출
    return jwt.verify(accessToken, secretKey);
  } catch (error) {
    return null;
  }
}

/**
 * @swagger
 * paths:
 *  /auth/logout:
 *    post:
 *      summary: "Logout"
 *      description: "Endpoint for user logout"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 회원 가입 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    users:
 *                      type: object
 *                      example:
 *                          message: "회원가입이 완료되었습니다."
 */

/** Logout API */
router.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    await prisma.tokenBlacklist.create({
      data: {
        token: req.headers.authorization,
      },
    });

    return res.status(200).json({
      message: "로그아웃 되었습니다.",
    });
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({ errorMessage: "서버에서 오류가 발생하였습니다." });
  }
});

/**
 * @swagger
 * paths:
 *  /auth/withdraw:
 *    post:
 *      summary: "User account deletion"
 *      description: "Endpoint for user account deletion"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 회원 가입 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    users:
 *                      type: object
 *                      example:
 *                          message: "회원가입이 완료되었습니다."
 */

/** Account Deletion API */
router.delete("/withdraw", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const findRefreshToken = await prisma.refreshTokens.findFirst({
      where: {
        UserId: +userId,
      },
      select: {
        refreshToken: true,
      },
    });

    if (findRefreshToken) {
      const refreshToken = findRefreshToken.refreshToken;

      // 리프레시 토큰을 블랙리스트에 추가
      await prisma.tokenBlacklist.create({
        data: {
          token: refreshToken,
        },
      });
    }

    await prisma.users.delete({
      where: {
        userId: +userId,
      },
    });

    return res.status(200).json({
      message:
        "회원탈퇴가 성공적으로 처리되었습니다. 이용해 주셔서 감사합니다.",
    });
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({ errorMessage: "서버에서 오류가 발생하였습니다." });
  }
});

export default router;
