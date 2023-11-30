import express from "express";
import cors from "cors";
import { errorMiddleware } from "./functions/erroHandler";
import { Request, Response } from "express";
import path from "path";
import bodyParser from 'body-parser';

// ROUTES
import musicRouters  from "./routes/musicRouters";
import userRouters from "./routes/userRouters";
import playlistRouters from "./routes/playlistRouters";

const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: ["http://127.0.0.1:5501", "http://localhost:5500", "http://192.168.0.100/", "https://192.168.0.100/", "https://localhost/", "https://127.0.0.1/"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
  exposedHeaders: "Authorization",
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
  // Use res.sendFile() para enviar um arquivo estático
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/playlist", playlistRouters);
app.use("/user", userRouters);
app.use("/music", musicRouters);


app.use(errorMiddleware);
app.listen(3333, () => console.log("Server running on port 3333"));
