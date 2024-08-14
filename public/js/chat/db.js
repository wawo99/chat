function connectionDB(storeName, type, chatData = {}) {
  const indexdDB = window.indexedDB

  if (!indexdDB) {
    alert('지원안해... ')
    return false
  } else {
    const request = indexdDB.open('chatDB', 3)
    request.onerror = (e) => {
      console.log({ e })
    }
    request.onsuccess = (e) => {
      db = request.result
      console.log('success')
      crudData(storeName, type, chatData)
    }
    request.onupgradeneeded = (e) => {
      db = e.target.result
      console.log('on upgrade')
      const objectStore = db.createObjectStore('chat', {
        autoIncrement: true,
      })
      const myInfoStore = db.createObjectStore('myInfo', {
        autoIncrement: true,
      })
      objectStore.createIndex('user', 'user', { unique: false })
      objectStore.createIndex('msg', 'msg', { unique: false })
      objectStore.createIndex('imageData', 'imageData', { unique: false })
      myInfoStore.createIndex('user', 'user', { unique: false })
      db.onerror = (e) => {
        console.log({ e })
      }
    }
  }
}

function crudData(storeName, type, chatData) {
  const chatTransaction = db.transaction(storeName, 'readwrite')
  const chatStore = chatTransaction.objectStore(storeName)

  const crud = {
    insert: function () {
      console.log('insert')
      chatStore.add({ pk: Date.now(), ...chatData })
    },
    select: function () {
      chatStore.openCursor().onsuccess = (res) => {
        const cursor = res.target.result
        console.log(cursor)
        if (!cursor) {
          console.log('end')
          return
        }
        const cursorData = { ...cursor.value, key: cursor.key }
        appendChatData(cursorData)
        cursor.continue()
      }
      chatTransaction.oncomplete = () => {
        checkUserName()
      }
    },
    update: function () {
      chatStore.openCursor().onsuccess = (res) => {
        const cursor = res.target.result
        if (cursor && cursor.key === chatData.key) {
          const data = cursor.value
          cursor.update({ ...data, ...chatData })
          return
        }
        cursor?.continue()
      }
    },
    delete: function () {
      chatStore.openCursor().onsuccess = (res) => {
        const cursor = res.target.result
        if (cursor && cursor.key === Number(chatData.key)) {
          cursor.delete()
          loadChatData()
          return
        }
        cursor?.continue()
      }
    },
    myInfoInsert: function () {
      console.log('insert')
      chatStore.add({ ...chatData })
    },
    myInfoSelect: function () {
      console.log('myInfoSelect')
      chatStore.openCursor().onsuccess = (res) => {
        const cursor = res.target.result
        if (!cursor) {
          console.log('stop')
          return
        }
        const cursorData = cursor.value
        // myInfo.user = cursorData.user
        setId.value = cursorData.user || ''
        cursor.continue()
      }

      chatTransaction.oncomplete = () => {
        const roomName = prompt('room name')
        if (!roomName) {
          socket.emit('get room list')
        } else {
          roomTitle.textContent = `[ ${roomName} ]`
          socket.emit('join room', {
            preRoom: 'room1',
            newRoom: roomName,
            name: setId.value,
          })
        }
      }
    },
  }

  crud[type]()
}
