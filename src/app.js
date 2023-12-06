import express from "express";
import cookieParser from "cookie-parser";
import PostRouter from "./routes/posts/posts.router.js";
import ErrorMiddleware from './middlewares/error.middleware.js'

const app = express();
const PORT = 5000;

app.use(express.json());
app.use("/api", [PostRouter]);
app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
