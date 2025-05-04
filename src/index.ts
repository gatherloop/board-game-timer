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

Handlebars.registerHelper("inc", function (value) {
  return parseInt(value) + 1;
});

type Table = {
  duration: number;
  status: "stopped" | "started" | "paused";
};

const tables: Table[] = [
  { duration: 7200, status: "stopped" },
  { duration: 7200, status: "stopped" },
  { duration: 7200, status: "stopped" },
];

const interval = setInterval(function () {
  tables.forEach(function (table, index) {
    if (table.status === "started" && table.duration > 0) {
      tables[index].duration = table.duration - 1;
    }
  });

  io.emit("tick", tables);
}, 1000);

app.use(express.static("public"));

app.get("/", function (req, res) {
  fs.readFile(path.join("views", "index.html"), function (err, data) {
    const template = Handlebars.compile(data.toString());
    res.send(template({ tables }));
  });
});

app.get(adminPath ?? "", function (req, res) {
  fs.readFile(path.join("views", "admin.html"), function (err, data) {
    const template = Handlebars.compile(data.toString());
    res.send(template({ tables }));
  });
});

io.on("connection", function (socket) {
  console.log("client connected");

  socket.on("start", function (index) {
    tables[index].status = "started";
  });

  socket.on("pause", function (index) {
    tables[index].status = "paused";
  });

  socket.on("increase", function (index) {
    tables[index].duration += 3600;
  });

  socket.on("decrease", function (index) {
    tables[index].duration -= 3600;
  });

  socket.on("pause", function (index) {
    tables[index].status = "paused";
  });

  socket.on("stop", function (index) {
    tables[index].status = "stopped";
    tables[index].duration = 7200;
  });
});

server.listen(port, function () {
  console.log(`Server running on port ${port}`);
});
