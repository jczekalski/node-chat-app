// Assign HTML elements to variables
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesList = document.getElementById('messages');
const locationButton = document.getElementById('send-location');

// Socket.io
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
  li.innerText = `${message.from}: ${message.text}`;

  // Append message to messages list
  messagesList.appendChild(li);
});

socket.on('newLocationMessage', function(message) {

  // Create new 'li' element
  const li = document.createElement('li');
  li.innerText = `${message.from}: `;

  // Create new 'a' element to store the google maps url
  const a = document.createElement('a');
  a.innerText = "My current location";
  a.setAttribute('target', '_blank');
  a.setAttribute('href', message.url);

  // Append the url to the 'li' element
  li.appendChild(a);

  // Append message to messages list
  messagesList.appendChild(li);
});

// On form submit
messageForm.addEventListener('submit', function(e) {
  e.preventDefault();
  socket.emit('createMessage', {
    from: 'User',
    text: messageInput.value
  }, function () {

  });
  messageForm.reset();
});

// On location button click
locationButton.addEventListener('click', function() {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.')
  }

  const options = {
    enableHighAccuracy: true
  }

  navigator.geolocation.getCurrentPosition(function (position) {
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  }, function () {
    alert('Unable to fetch location.')
  }, options);
});