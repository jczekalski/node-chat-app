const socket = io();

function scrollToBottom() {
  // Selectors
  const messages = document.getElementById('messages');
  const newMessage = messages.lastElementChild;
  const previousMessage = newMessage.previousElementSibling;
  // Heights
  const clientHeight = messages.clientHeight;
  const scrollTop = messages.scrollTop;
  const scrollHeight = messages.scrollHeight;

  const newMessageStyle = window.getComputedStyle(newMessage, null);
  const newMessageHeight = parseInt(newMessageStyle.getPropertyValue('height'));

  let previousMessageHeight = 0;

  if (previousMessage) {
    const previousMessageStyle = window.getComputedStyle(previousMessage, null);
    previousMessageHeight = parseInt(previousMessageStyle.getPropertyValue('height'));
  }

  if (clientHeight + scrollTop + newMessageHeight + previousMessageHeight >= scrollHeight) {
    messages.scrollTop = scrollHeight;
  }
};

socket.on('connect', function () {
  const params = QueryString(window.location.search).dict;

  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('no error');
    }
  });
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
  scrollToBottom();
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
  scrollToBottom();
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