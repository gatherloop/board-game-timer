import express from "express";
import path from "path";
import { Server } from "socket.io";
import { createServer } from "http";
import Handlebars from "handlebars";
import fs from "fs";
import "dotenv/config";

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT;
const adminPath = process.env.ADMIN_PATH;

Handlebars.registerHelper("getTimerText", function (duration: number) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const padded = (num: number) => String(num).padStart(2, "0");
  return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
});

type Transaction = {
  name: string;
  duration: number;
  status: "stopped" | "started" | "paused";
};

const transactions: Transaction[] = [];

const interval = setInterval(function () {
  transactions.forEach(function (transaction, index) {
    if (transaction.status === "started" && transaction.duration > 0) {
      transactions[index].duration = transaction.duration - 1;
    }
  });

  io.emit("tick", transactions);
}, 1000);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  fs.readFile(path.join("views", "index.html"), function (err, data) {
    const template = Handlebars.compile(data.toString());
    res.send(template({ transactions }));
  });
});

app.post<any, any, any, { name: string; duration: string }>(
  "/",
  function (req, res) {
    const { name, duration } = req.body;
    const durationNumber = parseInt(duration);
    transactions.push({ name, duration: durationNumber, status: "stopped" });
    res.redirect(adminPath ?? "/");
  }
);

app.get<any, any, any, any, { index: string }>("/delete", function (req, res) {
  const { index } = req.query;
  const indexNumber = parseInt(index);
  console.log("indexNumber", indexNumber);
  transactions.splice(indexNumber, 1);
  res.redirect(adminPath ?? "/");
});

app.get(adminPath ?? "", function (req, res) {
  fs.readFile(path.join("views", "admin.html"), function (err, data) {
    const template = Handlebars.compile(data.toString());
    res.send(template({ transactions }));
  });
});

io.on("connection", function (socket) {
  socket.on("start", function (index) {
    transactions[index].status = "started";
  });

  socket.on("pause", function (index) {
    transactions[index].status = "paused";
  });

  socket.on("increase", function (index) {
    transactions[index].duration += 600;
  });

  socket.on("decrease", function (index) {
    transactions[index].duration -= 600;
  });

  socket.on("pause", function (index) {
    transactions[index].status = "paused";
  });

  socket.on("stop", function (index) {
    transactions[index].status = "stopped";
    transactions[index].duration = 7200;
  });
});

server.listen(port, function () {
  console.log(`Server running on port ${port}`);
});
