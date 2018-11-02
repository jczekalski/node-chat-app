const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');
});

socket.on('disconnect', function () {
  console.log('Disconnected from server')
});

const messagesList = document.getElementById('messages');

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

// messageForm on submit handler
const messageForm = document.getElementById('message-form');
const messageTextbox = document.getElementById('message-textbox');

messageForm.addEventListener('submit', function(e) {
  e.preventDefault();
  socket.emit('createMessage', {
    from: 'User',
    text: messageTextbox.value
  }, function () {
    messageTextbox.value = '';
  });
});

// locationButton on click handler
const locationButton = document.getElementById('send-location');

locationButton.addEventListener('click', function() {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.')
  }

  locationButton.setAttribute('disabled', 'disabled');
  locationButton.innerText = 'Sending location...';

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttribute('disabled');
    locationButton.innerText= 'Send location';
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  }, function () {
    locationButton.removeAttribute('disabled');
    locationButton.innerText = 'Send location';
    alert('Unable to fetch location.')
  }, {
      enableHighAccuracy: true
  });
});