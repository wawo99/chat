window.onload = () => {
  loadChatID()
  loadChatData()
  askNotificationPermission()
  hljs.highlightAll()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  send()
})

socket.on('chatRoomList', (chatRoomList) => {
  console.log('chat room list')
  chatRoom.innerHTML = ''
  chatRoomList.forEach((v) => {
    const div = document.createElement('div')
    const currentRoom = roomTitle.textContent.replace(/[\[\]\s]/gi, '')
    const selectRoom = v
    div.textContent = selectRoom
    div.className = currentRoom === selectRoom ? 'current' : ''
    chatRoom.appendChild(div)
    div.addEventListener('click', function () {
      socket.emit('leave room', currentRoom)
      socket.emit('join room', {
        preRoom: currentRoom,
        newRoom: selectRoom,
        name: setId.value,
      })
      roomTitle.textContent = `[ ${selectRoom} ]`
    })
  })
})

socket.on('notice', ({ currentChatRoomUserList, roomClientsNum, name }) => {
  console.log('notice')
  roomTitleCount.textContent = `${roomClientsNum} join`
})

socket.on('chat message', ({ user, msg, imageData }) => {
  appendChatData({ user, msg, imageData })
  if (imageData) outputImage.src = imageData
  connectionDB('chat', 'insert', { user, msg, imageData })
  if (user === setUser) return false
  if (Notification.permission === 'granted') {
    setNotification(user)
  } else if (
    Notification.permission === 'denied' ||
    Notification.permission === 'default'
  ) {
    console.log('accept permission')
    Notification.requestPermission()
      .then((permission) => {
        serNotification(user)
      })
      .catch((e) => {})
  }
})

socket.on('chat typing', (m) => {
  isTyping.textContent = m
})

inputValue.addEventListener('paste', pasteData)
document.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    window.focus()
    inputValue.focus()
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    send()
    return false
  }
  if (e.key === 'c' && e.ctrlKey) {
    copyInput()
    return false
  }
  if (e.key === 'x' && e.ctrlKey) {
    clearInput()
    return false
  }
  typing()
})

chatToggleBtn.addEventListener('click', function () {
  const display = chatRoom.style.display === 'none'
  chatRoom.style.display = display ? 'block' : 'none'
})

window.addEventListener('beforeunload', (e) => {
  e.preventDefault()
  e.returnValue = ''
  const currentRoom = roomTitle.textContent.replace(/[\[\]\s]/gi, '')
  socket.emit('leave room', currentRoom)
})
