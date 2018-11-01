// HTML element variables
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesList = document.getElementById('messages');

const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');
});

socket.on('disconnect', function () {
  console.log('Disconnected from server')
});

socket.on('newMessage', function(message) {
  console.log('New message', message);

  // Create new 'li' element
  const li = document.createElement('li');
  // Set message content
  li.innerText = `${message.from}: ${message.text}`;
  // Add message to list
  messagesList.appendChild(li);
});

socket.emit('createMessage', {
  from: 'Frank',
  text: 'Hi'
}, function(data) {
  console.log('Got it', data);
});

// On form submit
messageForm.addEventListener('submit', function(e) {
  e.preventDefault();
  socket.emit('createMessage', {
    from: 'User',
    text: messageInput.value
  }, function () {

  });
});