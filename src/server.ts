import express, { Router, Request, Response } from "express";
import cors from "cors";

// ROUTES
import musicRouters  from "./routes/musicRouters";
import userRouters from "./routes/userRouters";

const app = express();
const route = Router();
app.use(express.json());

const corsOptions = {
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://192.168.0.100/", "https://192.168.0.100/", "https://localhost/", "https://127.0.0.1/"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
  exposedHeaders: "Authorization",
};

app.use(cors(corsOptions));

route.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Servidor Ativo" });
});

app.use("/user", userRouters);
app.use("/music", musicRouters);

app.use(route);
app.listen(3333, () => console.log("Server running on port 3333"));
