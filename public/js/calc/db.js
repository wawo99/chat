function connectionDB(storeName, type, calendarData = {}) {
  const indexdDB = window.indexedDB;
  if (!indexdDB) {
    alert("do not support");
    return false;
  }
  const request = indexdDB.open("calendarDB", 1);

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
    objectStore.createIndex("user", "user", { unique: false });
    objectStore.createIndex("msg", "msg", { unique: false });
    objectStore.createIndex("date", "date", { unique: false });
    holidayStore.createIndex("date", "date", { unique: false });
    holidayStore.createIndex("name", "name", { unique: false });

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
      dataStore.add({ pk: Date.now(), ...calendarData });
    },
    insertHoliday: function () {
      // console.log('insert')
      dataStore.add({ pk: Date.now(), ...calendarData }).onsuccess = async (
        res
      ) => {
        const cursorData = res.target.result;
        console.log("TEST eventDay.solarEventKey", cursorData);
        getHolidayData();
      };
    },
    selectAll: function () {
      dataStore.openCursor().onsuccess = (res) => {
        const cursor = res.target.result;
        if (!cursor) return;
        const cursorData = { ...cursor.value, key: cursor.primaryKey };
        countBadge(cursorData.date, 1);
        cursor.continue();
      };
    },
    selectHolidayAll: function async() {
      dataStore.openCursor().onsuccess = async (res) => {
        const cursor = res.target.result;
        if (!cursor) return;
        const cursorData = { ...cursor.value, key: cursor.primaryKey };
        const date = cursorData.date.slice(5).replace("-", "");
        console.log("TEST eventDay.solarEventKey", eventDay.solarEventKey);
        !eventDay.solarEventKey && (eventDay.solarEventKey = {});
        console.log("TEST eventDay.solarEventKey", eventDay.solarEventKey);
        eventDay.solarEvent[date] = cursorData.name;
        eventDay.solarEventKey[date] = cursorData.key;
        holidayList();
        cursor.continue();
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
    // update: function () {
    //   dataStore.openCursor().onsuccess = (res) => {
    //     const cursor = res.target.result
    //     if (cursor && cursor.key === calendarData.key) {
    //       cursor.update({ ...cursor.value, ...calendarData })
    //       return
    //     }
    //     cursor.continue()
    //   }
    // },
    delete: function () {
      const request = dataStore.delete(calendarData.key);
      console.log("delete request", calendarData.key);
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
  };
  crud[type]();
}
