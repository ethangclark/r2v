import path from "path";
import express from "express";

const app = express();
const port = 3000;

app.use("/", express.static(path.resolve(__dirname, "../dist")));

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
