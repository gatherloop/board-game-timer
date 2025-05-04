const socket = io();

function start(indexString) {
  const index = parseInt(indexString);
  socket.emit("start", index);
}

function pause(indexString) {
  const index = parseInt(indexString);
  socket.emit("pause", index);
}

function stop(indexString) {
  const index = parseInt(indexString);
  socket.emit("stop", index);
}

function increase(indexString) {
  const index = parseInt(indexString);
  socket.emit("increase", index);
}

function decrease(indexString) {
  const index = parseInt(indexString);
  socket.emit("decrease", index);
}

socket.on("tick", function (tables) {
  tables.forEach(function (table, index) {
    const btnStart = document.getElementById(`btnStart-${index}`);
    const btnPause = document.getElementById(`btnPause-${index}`);
    const btnStop = document.getElementById(`btnStop-${index}`);
    const status = table.status;

    if (btnStart && btnPause && btnStop) {
      if (status === "stopped") {
        btnStart.style.display = "block";
        btnPause.style.display = "none";
        btnStop.style.display = "none";
      } else if (status === "started") {
        btnStart.style.display = "none";
        btnPause.style.display = "block";
        btnStop.style.display = "block";
      } else if (status === "paused") {
        btnStart.style.display = "block";
        btnPause.style.display = "none";
        btnStop.style.display = "block";
      }
    }

    const timer = document.getElementById(`timer-${index}`);
    timer.textContent = getTimerText(table.duration);
  });
});

function getTimerText(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const padded = (num) => String(num).padStart(2, "0");
  return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
}
