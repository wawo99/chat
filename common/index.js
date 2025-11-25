const utils = require("./utils");
const Datastore = require("nedb");
let io, db;
module.exports = {
  init: function (dirname, getIo, getDb) {
    utils.init(dirname, getIo, getDb);

    io = getIo;
    db = getDb;

    io.on("connection", (socket) => {
      console.log("connect");
      socket.on("chat message", ({ user, msg, imageData }) => {
        console.log("수신 ");
        db.chat = new Datastore({ filename: utils.getTodayChatFile("chat") });
        db.chat.loadDatabase();
        db.chat.insert({ user, msg });

        if (imageData) {
          db.image = new Datastore({
            filename: utils.getTodayChatFile("image"),
          });
          db.image.loadDatabase();
          db.image.insert({ user, imageData });
        }

        io.to(socket.room).emit("chat message", { user, msg, imageData });
      });

      socket.on("chat typing", (m) => {
        console.log("on typing", m);
        io.to(socket.room).emit("chat typing", m);
      });

      socket.on("leave room", (name) => {
        socket.leave(name);
        const rooms = utils.getUserRooms();
        if (!rooms.includes(name)) {
          io.emit("remove room", { name });
        }
      });

      socket.on("checked date", ({ date, name }) => {
        db.checkdate.findOne({ date }, (e, d) => {
          if (d) db.checkdate.remove({ _id: d._id }, { multi: false });
          db.checkdate.insert({ date, name });
          utils.selectList();
        });
      });

      socket.on("checked date list", () => {
        utils.getCheckedList();
      });

      socket.on("checked remove date", ({ date }) => {
        db.checkdate.remove({ date }, { multi: false });
        utils.getCheckedList();
      });

      socket.on("remove room", ({ name }) => {
        setRooms((prev) => prev.filter((item) => item !== name));
      });

      socket.on("join room", ({ preRoom, newRoom, name }) => {
        console.log("입장");
        socket.name = name;
        socket.join(newRoom);
        socket.room = newRoom;
        let clients = io.sockets.adapter.rooms.get(newRoom);
        const { currentChatRoomUserList, roomClientsNum } =
          utils.getRoomInfo(clients);

        const chatRoomList = utils.getUserRooms();
        io.emit("chatRoomList", chatRoomList);
        io.emit("notice", {
          currentChatRoomUserList,
          roomClientsNum,
          name: socket.name,
        });
      });

      socket.on("get room list", () => {
        const chatRoomList = utils.getUserRooms();
        io.emit("chatRoomList", chatRoomList);
      });

      // 달력 새로고침
      socket.on("calendar refesh", (data) => {
        console.log("서버 calendar refesh", data);
        io.emit("calendarRefesh", data);
      });
    });
  },
};
