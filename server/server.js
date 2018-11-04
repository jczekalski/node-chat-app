const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const { Users } = require('./utils/users');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { isRealString } = require('./utils/validation');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const users = new Users;

app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', (params, callback) => {
    if (!isRealString(params.name[0]) || !isRealString(params.room[0])) {
      return callback('Name and room name are required.');
    }

    socket.join(params.room[0]);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name[0], params.room[0]);

    io.to(params.room[0]).emit('updateUserList', users.getUserList(params.room[0]));
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
    socket.broadcast.to(params.room[0]).emit('newMessage', generateMessage('Admin', `${params.name[0]} has joined`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    console.log('createMessage', message);
    io.emit('newMessage', generateMessage(message.from, message.text));
    callback();
  });

  socket.on('createLocationMessage', (coords) => {
    io.emit('newLocationMessage', generateLocationMessage('Admin', coords.latitude, coords.longitude));
  });

  socket.on('disconnect', () => {
    const user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} left the room.`));
    }

  });

});

server.listen(port, () => {
  console.log(`Started on port ${port}`);
});

