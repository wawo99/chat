const Datastore = require('nedb')
let io, db, dirname
module.exports = {
  init: function (_dirname, getIo, getDb) {
    dirname = _dirname
    io = getIo
    db = getDb
  },
  getToday: function () {
    const ts = Date.now()
    const dateTime = new Date(ts)
    const date = dateTime.getDate()
    const month = dateTime.getMonth() + 1
    const year = dateTime.getFullYear()
    return `${year}${month}${date}`
  },
  getTodayChatFile: function (type) {
    const fileName = `${type}${this.getToday()}.db`
    const filePath = `${dirname}/data/${fileName}`
    return filePath
  },
  getRoomInfo: function (clients) {
    const roomClientsNum = clients ? clients.size : 0
    const currentChatRoomUserList = []
    if (clients) {
      clients.forEach((element) => {
        currentChatRoomUserList.push(io.sockets.sockets.get(element).name)
      })
    }

    return { roomClientsNum, currentChatRoomUserList }
  },
  getUserRooms: function () {
    const userRooms = []
    const { sids, rooms } = io.of('/').adapter
    rooms.forEach((_, key) => {
      if (sids.get(key) === undefined) {
        userRooms.push(key)
      }
    })
    return userRooms
  },
  selectList: function () {
    db.checkdate.find({}, (e, v) => {
      io.emit('checked date list', v)
    })
  },
  getCheckedList: function () {
    const filePath = `${dirname}/data/checkDate.db`
    db.checkdate = new Datastore({ filename: filePath, autoload: true })
    this.selectList()
  },
}
