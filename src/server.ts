import cors from "cors";
import { errorMiddleware } from "./functions/erroHandler";
import express, { Request, Response } from "express";
import path from "path";
import bodyParser from 'body-parser';
import helmet from "helmet";
import compression from "compression";

// ROUTES
import musicRouters  from "./routes/musicRouters";
import userRouters from "./routes/userRouters";
import playlistRouters from "./routes/playlistRouters";
import tagsRouters from "./routes/tagsRouters";
import playbackRouters from "./routes/playbackRouters";
import albumRouters from "./routes/albumRouters";


const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "i.imgur.com"],
      'style-src': ["'self'", "cdn.jsdelivr.net", "cdn.tailwindcss.com", "'unsafe-inline'"],
      'img-src': ["'self'", "i.imgur.com", "data:"],
      'worker-src': ["'none'"],
      'font-src': ["'self'", "cdn.jsdelivr.net"],
    }
  }
}));




const corsOptions = {
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
  exposedHeaders: "Authorization",
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/playlist", playlistRouters);
app.use("/user", userRouters);
app.use("/tags", tagsRouters);
app.use("/music", musicRouters);
app.use("/playback", playbackRouters);
app.use("/album", albumRouters)

app.use((req, res, next) => {
  res.status(404).json("Não existe esta requisição na API!");
});
app.use(compression);

app.use(errorMiddleware);
app.listen(3333, () => console.log("Server running on port 3333"));
