const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    setTimeout(() => {
      // user joined
      connectToNewUser(userId, stream)
    }, 3000)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]){
    let tempVideo = document.getElementById(userId);
    peers[userId].close();
  } 
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  video.style.id=`${userId}`;
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  showToast();
  videoGrid.append(video)
}

let x;
const toast = document.getElementById('myToast');
function showToast(){
  clearTimeout(x);
  toast.style.display="block";
  x = setTimeout(() => {
    toast.style.display='none';
  }, 2000);
}

// client side logic of chat section

const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const name = prompt('What is your name?');
appendMessage('You joined',"right");
socket.emit('new-user', name);

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`,"left");
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`,"left");
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`,"left")
})

messageForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value
  appendMessage(`${message}`, "right")
  socket.emit('send-chat-message', message)
  messageInput.value = ''
})

function appendMessage(message,direction) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  if (direction=="left"){
    messageElement.style.textAlign="left";
  }
  else {
    messageElement.style.textAlign="right";
  }
  messageContainer.style.wordBreak="break-word";
  messageContainer.append(messageElement)
}