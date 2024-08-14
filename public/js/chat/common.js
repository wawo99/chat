function sleep(ms) {
  const wakeUpTime = Date.now() + ms
  while (Date.now() < wakeUpTime) {}
}

function appendChatData({ key, user, msg, imageData }) {
  const contents = document.createElement('pre')
  const codeDiv = document.createElement('code')
  const userDiv = document.createElement('div')
  const deleteBtnDiv = document.createElement('div')
  const layoutDiv = document.createElement('div')

  userDiv.className = 'user'
  userDiv.style.color = user === setId.value ? 'purple' : '#1d6c80'
  userDiv.textContent = `${user}:`

  deleteBtnDiv.className = 'delete'
  deleteBtnDiv.textContent = 'X'
  deleteBtnDiv.dataset.key = key
  isTyping.textContent = ''

  codeDiv.className = 'code'
  codeDiv.textContent = msg

  hljs.highlightElement(codeDiv)

  contents.appendChild(codeDiv)

  layoutDiv.className = 'layout'
  layoutDiv.appendChild(userDiv)

  key && layoutDiv.appendChild(deleteBtnDiv)

  layoutDiv.appendChild(contents)

  message.prepend(layoutDiv)

  const deleteElements = document.getElementsByClassName('delete')

  for (let i = 0; i < deleteElements.length; i++) {
    deleteElements[i].addEventListener(
      'click',
      (e) => {
        connectionDB('chat', 'delete', { key: e.srcElement.dataset.key })
      },
      false,
    )
  }
}

function setNotification(user) {
  new Notification('알림', {
    body: `${user} send message`,
    icon: 'images/icon.png',
    badge: 'image/icon.png',
  })
}

function typing() {
  isTyping.textContent = ''
  setUser = setId.value || 'guest'
  if (inputValue.value.length > 0)
    socket.emit('chat typing', `${setUser} typing...`)
}

function send() {
  if (!setId.value) {
    alert('inser name')
    setId.focus()
    return false
  }

  const locationHref = window.location.href
  const outputImageSrc = outputImage.src

  const m = {
    user: setUser,
    msg: inputValue.value,
    imageData:
      outputImageSrc.indexOf(locationHref) !== -1 ? '' : outputImage.src,
  }
  socket.emit('chat message', m)
  inputValue.value = ''
}

function copyInput() {
  const r = document.createRange()
  const preArray = document.getElementsByTagName('pre')
  const refNode = r.selectNode(preArray[0])
  window.getSelection().removeAllRanges()
  window.getSelection().addRange(r)
  document.execCommand('copy')
  window.getSelection().removeAllRanges()
  return false
}

function clearInput() {
  const html = document.getElementById('chat-msg')
  html.innerHTML = ''
  inputValue.value = ''
  isTyping.textContent = ''
  return false
}

function askNotificationPermission() {
  function handlePermission(permission) {
    if (!('permission' in Notification)) {
      console.log('hnde successs')
      Notification.permission = permission
    }
    if (checkNotificationPromise()) {
      Notification.requestPermission().then((permission) => {
        handlePermission(permission)
      })
    } else {
      Notification.requestPermission(function (permission) {
        handlePermission(permission)
      })
    }
    function checkNotificationPromise() {
      try {
        Notification.requestPermission().then()
      } catch (e) {
        return false
      }
    }
    return false
  }
}

function checkUserName() {
  const userElements = document.getElementsByClassName('user')
  for (let i = 0; i < userElements.length; i++) {
    if (userElements[i].textContent.replace(':', '') === setId.value)
      userElements[i].style.color = 'purple'
  }
}

function saveMyName(event) {
  connectionDB('myInfo', 'myInfoInsert', { user: event.target.value })
}

function loadChatID() {
  console.log('11')
  connectionDB('myInfo', 'myInfoSelect')
}

function loadChatData() {
  const html = document.getElementById('chat-msg')
  html.innerHTML = ''
  connectionDB('chat', 'select')
}

function creatRoom() {
  const roomName = prompt('방 이름')
  const currentRoom = roomTitle.textContent.replace(/[\[\]\s]/gi, '')
  roomTitle.textContent = `[ ${roomName} ]`
  socket.emit('leave room', currentRoom)
  socket.emit('join room', {
    preRoom: currentRoom,
    newRoom: roomName,
    name: setId.value,
  })
}

function deleteImage() {
  outputImage.src = ''
}

function copyImage() {
  const img = outputImage
  const imgSrc = img.src
  fetch(imgSrc)
    .then((res) => res.blob())
    .then((blobData) => {
      const clipboardItems = [
        new ClipboardItem({
          'image/png': blobData,
        }),
      ]

      navigator.clipboard.write(clipboardItems).then(() => {
        alert('complete')
      })
    })
  return false
}

function pasteData(e) {
  const items = e.clipboardData.items
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      const reader = new FileReader()
      reader.onload = function (event) {
        const base64Data = event.target.result
        outputImage.src = base64Data
      }
      reader.readAsDataURL(blob)
    }
  }
}
