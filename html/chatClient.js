
const socket = io() //by default connects to same server that served the page

let username = '';
let connected = false;

function findMessageSender(data) {
  let sender = ''
  for(let i = 0; i < data.length; i++) {
    if(data[i] != ':') {
      sender += data[i]
    } else {
      return sender;
    }
  }
}

document.getElementById('send_button').disabled = true;

function sendMessage() {
  if (!connected) return; // Don't send message if user is not connected
  let message = document.getElementById('msgBox').value.trim()
  if(message === '') return //do nothing
  let msg = JSON.stringify({username: username, message: message})
  socket.emit('clientSays', msg)
  document.getElementById('msgBox').value = ''
}

function clearMessages() {
  document.getElementById('messages').innerHTML = ""
}

socket.on('acknowledgement', function(message) {
  alert(message); // Show acknowledgment message
});

socket.on('isConnected', function() {
  document.getElementById('send_button').disabled = false;
  document.getElementById('connectButton').disabled = true;
  document.getElementById('username').disabled = true;
  connected = true
});

socket.on('serverSays', function(message) {
  let senderInfo = findMessageSender(message)
  if(senderInfo !== username) {
    let msgDiv = document.createElement('div')
    msgDiv.setAttribute('id', 'reciever');
    msgDiv.textContent = message
    document.getElementById('messages').appendChild(msgDiv)
  } else {
    let msgDiv = document.createElement('div')
    msgDiv.setAttribute('id', 'sender');
    msgDiv.textContent = message
    document.getElementById('messages').appendChild(msgDiv)
  }
})

socket.on('privateMessage-sender', function(message){
  let msgDiv = document.createElement('div')
  msgDiv.setAttribute('id', 'private-sender');
  msgDiv.textContent = message
  document.getElementById('messages').appendChild(msgDiv)
})

socket.on('privateMessage', function(message){
  let msgDiv = document.createElement('div')
  msgDiv.setAttribute('id', 'private-reciever');
  msgDiv.textContent = message
  document.getElementById('messages').appendChild(msgDiv)
})

function handleKeyDown(event) {
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}

//Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  //This function is called after the browser has loaded the web page

  document.getElementById('connectButton').addEventListener('click', function() {
    username = document.getElementById('username').value.trim();
    if (username !== '') {
      socket.emit('connectUser', username); // Send username to the server
    }
  });

  //add listener to buttons
  document.getElementById('send_button').addEventListener('click', sendMessage)
  document.getElementById('clear_button').addEventListener('click', clearMessages)

  //add keyboard handler for the document as a whole, not separate elements.
  document.addEventListener('keydown', handleKeyDown)
  //document.addEventListener('keyup', handleKeyUp)
})
