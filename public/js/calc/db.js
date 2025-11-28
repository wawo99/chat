function connectionDB(storeName, type, calendarData = {}) {
  const indexdDB = window.indexedDB;
  if (!indexdDB) {
    alert("do not support");
    return false;
  }
  const request = indexdDB.open("calendarDB", 3);

  request.onsuccess = (e) => {
    db = request.result;
    crudData(storeName, type, calendarData);
  };
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    const objectStore = db.createObjectStore("calendar", {
      autoIncrement: true,
    });
    const holidayStore = db.createObjectStore("holiday", {
      autoIncrement: true,
    });
    const workStore = db.createObjectStore("work", {
      autoIncrement: true,
    });
    objectStore.createIndex("user", "user", { unique: false });
    objectStore.createIndex("msg", "msg", { unique: false });
    objectStore.createIndex("date", "date", { unique: false });
    holidayStore.createIndex("date", "date", { unique: false });
    holidayStore.createIndex("name", "name", { unique: false });
    workStore.createIndex("startTime", "startTime", { unique: false });
    workStore.createIndex("endTime", "endTime", { unique: false });
    workStore.createIndex("date", "date", { unique: true });

    db.onerror = (error) => {
      // console.log({ error })
    };
  };
}
function crudData(storeName, type, calendarData) {
  const dataTransaction = db.transaction(storeName, "readwrite");
  const dataStore = dataTransaction.objectStore(storeName);
  const crud = {
    insert: function () {
      // console.log('insert')
      countBadge(calendarData.date, 1);
      const req = dataStore.add({ pk: Date.now(), ...calendarData });
      req.onsuccess = (res) => {
        appendData({ ...calendarData, key: res.target.result });
      };
    },
    insertHoliday: function () {
      // console.log('insert')
      dataStore.add({ pk: Date.now(), ...calendarData }).onsuccess = async (
        res
      ) => {
        const cursorData = res.target.result;
        // console.log("TEST eventDay.solarEventKey", cursorData);
        getHolidayData();
      };
    },
    insertWorkTime: function () {
      const index = dataStore.index("date");

      // ① 날짜(date) 인덱스로 검색
      const request = index.openCursor(IDBKeyRange.only(calendarData.date));

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          console.log("update");
          const existing = cursor.value;

          const updated = {
            ...existing,
            ...calendarData, // 새로운 값 적용 (value 등)
          };

          cursor.update(updated);
          // .onsuccess = () => {};
        } else {
          console.log("insert");
          dataStore.add({ pk: Date.now(), ...calendarData });
          // .onsuccess = async (
          //   res
          // ) => {
          //    const cursorData = res.target.result;
          // };
        }
      };
    },
    selectAll: function () {
      dataStore.index("date").openCursor(null, "prev").onsuccess = (res) => {
        const cursor = res.target.result;
        if (!cursor) return;
        const cursorData = { ...cursor.value, key: cursor.primaryKey };
        countBadge(cursorData.date, 1);
        createListData(cursorData);
        cursor.continue();
      };
      // console.log("TEST select all complete");
    },

    selectHolidayAll: function async() {
      dataStore.index("date").openCursor(null, "prev").onsuccess = async (
        res
      ) => {
        const cursor = res.target.result;
        if (!cursor) return;
        const cursorData = { ...cursor.value, key: cursor.primaryKey };
        // const date = cursorData.date.slice(5).replace("-", "");
        const date = cursorData.date;
        // console.log("TEST eventDay.solarEventKey", eventDay.solarEventKey);
        !eventDay.solarEventKey && (eventDay.solarEventKey = {});
        // console.log("TEST eventDay.solarEventKey", eventDay.solarEventKey);
        eventDay.solarEvent[date] = cursorData.name;
        eventDay.solarEventKey[date] = cursorData.key;
        holidayList();
        cursor.continue();
        // console.log("TEST select holiday all complete");
      };
    },

    // 근무시간 리스트 가져오기
    selectWorkTimeList: function () {
      console.log("selectWorkTimeList", calendarData.date);

      if (!calendarData.date) return;

      const selectDate = calendarData.date.substring(0, 7); // 'YYYY-MM'
      const start = `${selectDate}-01`; // 2025-11-01
      const end = `${selectDate}-31`; // 2025-11-31 (31까지 OK)
      const index = dataStore.index("date");

      const range = IDBKeyRange.bound(start, end);

      const request = index.getAll(range);

      request.onsuccess = () => {
        console.log("11월 데이터:", request.result);
        createWorkTimeList(request.result);
      };
    },

    // 선택날짜 근무시간 가져오기
    selectWorkTime: function () {
      const index = dataStore.index("date");

      if (!calendarData.date) return;

      const request = index.openCursor(IDBKeyRange.only(calendarData.date));

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          const { startTime, endTime } = cursor.value;
          setSelectedWorkTime(startTime, endTime, true);
        } else {
          // 기본 출퇴근 시간 설정
          setSelectedWorkTime("08:20", "18:00", false);
        }
      };
    },

    select: function () {
      const index = dataStore.index("date");

      const keyRange = IDBKeyRange.only(calendarData.date);
      // console.log('select:', { calendarData, keyRange })

      index.openCursor(keyRange).onsuccess = (res) => {
        const cursor = res.target.result;
        // console.log({ cursor })
        if (!cursor) return;
        const cursorData = { ...cursor.value, key: cursor.primaryKey };
        appendData(cursorData);
        cursor.continue();
      };
      dataTransaction.oncomplete = () => {};
    },
    update: function (key) {
      console.log("update not support", key);
      // dataStore.openCursor().onsuccess = (res) => {
      //   const cursor = res.target.result
      //   if (cursor && cursor.key === calendarData.key) {
      //     cursor.update({ ...cursor.value, ...calendarData })
      //     return
      //   }
      //   cursor.continue()
      // }
    },
    delete: function () {
      const request = dataStore.delete(calendarData.key);
      // console.log("delete request", calendarData.key);
      request.onsuccess = (res) => {
        countBadge(calendarData.date, -1);
        loadData(todoDate.textContent);
      };
    },
    deleteHoliday: function () {
      const request = dataStore.delete(
        eventDay.solarEventKey[calendarData.date]
      );
      request.onsuccess = async (res) => {
        delete eventDay.solarEvent[calendarData.date];
        holidayList();
        await createCalendar();
        checkDateList(checkedListData);
      };
    },
    deleteWorkTime: function () {
      console.log(eventDay.solarEventKey);

      const index = dataStore.index("date");

      // ① 날짜(date) 인덱스로 검색
      const request = index.openCursor(IDBKeyRange.only(calendarData.date));

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          dataStore.delete(cursor.primaryKey).onsuccess = async (res) => {
            this.selectWorkTimeList();
          };
        }
      };
    },
  };

  crud[type]();
}
