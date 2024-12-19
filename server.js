const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const { Hash } = require('crypto');
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const Users = new Map();

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function findMessageRecievers(data) {
  let usersAvalible = Array.from(Users.values())
  let recievers = []
  let reciever = ''
  let index = 0;
  for(let i = 0; i < data.length; i++) {
    if(data[i] !== ',' && data[i] !== ":") {
      reciever += data[i]
    } else {
      if(usersAvalible.includes(reciever.replace(" ", ""))) {
        recievers[index++] = reciever.replace(" ", "");
        reciever = ''
      } else {
        reciever = ''
      }
    }
  }

  return recievers
}

function personalizeMessage(data) {
  let Message = ''
  let indexstart = 0

  for(let i = 0; i < data.length; i++) {
    if(data[i] == ':') {
      indexstart = i + 1
      break
    }
  }

  for(let i = indexstart; i < data.length; i++) {
    Message += data[i]
  }
  return Message
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

const authenticatedRoom = 'authenticated';
const unauthenticatedRoom = 'unauthenticated';

//Socket Server
io.on('connection', function(socket) {
  console.log('client connected')
  socket.join(unauthenticatedRoom);

  socket.on('connectUser', function(username) {
    if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(username) && !Array.from(Users.values()).includes(username)) {
      socket.emit('acknowledgement', 'Successfully connected as ' + username);

      socket.username = username;
      socket.leave(unauthenticatedRoom);
      socket.join(authenticatedRoom);
      socket.emit("isConnected")
      Users.set(socket.id, username)
    } else {
      socket.emit('acknowledgement', 'Invalid username. Usernames must start with a letter and contain only letters and numbers and must be unique.');
    }

  });

  socket.on('clientSays', function(data) {
    console.log('RECEIVED: ' + data)

    let msg = JSON.parse(data)

    let recievers = findMessageRecievers(msg.message)

    if(recievers.length === 0) {
      let message = msg.username + ": " + msg.message
      io.to(authenticatedRoom).emit('serverSays', message);
    } else {
      let msag = personalizeMessage(msg.message)
      let message = msg.username + ": " + msag
      io.to(socket.id).emit('privateMessage-sender', message)
      for(let i = 0; i < recievers.length; i++) {
        for (let [socketId, username] of Users.entries()) {
          if (username === recievers[i] && socketId !== socket.id) {
            io.to(socketId).emit('privateMessage', message)
            break;
          }
        }
      }
    }
  })

  socket.on('disconnect', function(data) {
    //event emitted when a client disconnects
    Users.delete(socket.id)
    console.log('client disconnected')
  })
})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)
