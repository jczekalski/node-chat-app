const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');
});

socket.on('disconnect', function () {
  console.log('Disconnected from server')
});

const messagesList = document.getElementById('messages');

socket.on('newMessage', function(message) {
  const formattedTime = moment(message.createdAt).format('h:mm a');
  const template = document.getElementById('message-template').innerHTML;
  const html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });

  messagesList.innerHTML += html;
});

socket.on('newLocationMessage', function(message) {
  const formattedTime = moment(message.createdAt).format('h:mm a');
  const template = document.getElementById('location-message-template').innerHTML;
  const html = Mustache.render(template, {
    from: message.from,
    createdAt: formattedTime,
    url: message.url
  });

  messagesList.innerHTML += html;
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
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
  });
});