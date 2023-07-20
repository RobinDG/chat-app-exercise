const e = require('express');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(e.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const usersTyping = [];
const history = [];

// function to store events in history with timestamp
function storeEvent(event, data) {
  const date = new Date();
  const timestamp = date.getTime();
  const eventWithTimestamp = {
    event: event,
    data: data,
    timestamp: timestamp
  }
  history.push(eventWithTimestamp);
} 

io.on('connection', (socket) => {


  socket.on('user connected', (user) => {
    if (history.length > 0) {
      io.to(user).emit('history', history);
    }
    io.emit('user connected', user);
    storeEvent('user connected', user);
  });

  socket.on('join', function (user) {
    socket.join(user);
  });

  
  socket.on("typing", (user) => {
    if (!(usersTyping.includes(user)) && user != "") {
      usersTyping.push(user);
    }
    io.emit("typing", usersTyping);
  });

  socket.on("stopped typing", (user) => {
    if (usersTyping.includes(user)) {
      usersTyping.splice(usersTyping.indexOf(user), 1);
    }

    io.emit("typing", usersTyping);
  })

  socket.on('chat message', msg => {
    io.emit('chat message', msg);
    storeEvent('chat message', msg);
  });

  socket.on('user disconnected', (user) => {
    // remove user from usersTyping
    if (usersTyping.includes(user)) {
      usersTyping.splice(usersTyping.indexOf(user), 1);
      io.emit("typing", usersTyping)
    }
    io.emit('user disconnected', user);
    storeEvent('user disconnected', user);
  });

});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
