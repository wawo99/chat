/* ===============================
✅ 1️⃣ DB OPEN (동기식)
================================ */
function openDB() {
  return new Promise((resolve, reject) => {
    const indexedDB = window.indexedDB;
    if (!indexedDB) return reject("IndexedDB not supported");

    const request = indexedDB.open("calendarDB", 3);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ===============================
✅ 2️⃣ Store 헬퍼
================================ */
function getStore(db, storeName, mode = "readwrite") {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

/* ===============================
✅ 3️⃣ connectionDB (완전 동기식 진입)
================================ */
async function connectionDB(storeName, type, calendarData = {}) {
  try {
    const db = await openDB();
    await crudData(db, storeName, type, calendarData);
  } catch (e) {
    console.error("DB Error:", e);
  }
}

/* ===============================
✅ 4️⃣ CRUD 전체 동기식 변환
================================ */
async function crudData(db, storeName, type, calendarData) {
  const dataStore = getStore(db, storeName);

  const crud = {
    /* ✅ INSERT */
    insert: async () => {
      countBadge(calendarData.date, 1);
      const key = await new Promise((resolve, reject) => {
        const req = dataStore.add({ pk: Date.now(), ...calendarData });
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => reject(req.error);
      });

      appendData({ ...calendarData, key });
    },

    /* ✅ HOLIDAY INSERT */
    insertHoliday: async () => {
      await new Promise((resolve, reject) => {
        const req = dataStore.add({ pk: Date.now(), ...calendarData });
        req.onsuccess = resolve;
        req.onerror = () => reject(req.error);
      });

      getHolidayData();
    },

    /* ✅ WORK TIME INSERT OR UPDATE */
    insertWorkTime: async () => {
      const index = dataStore.index("date");
      const existing = await new Promise((resolve) => {
        const req = index.openCursor(IDBKeyRange.only(calendarData.date));
        req.onsuccess = () => resolve(req.result);
      });

      if (existing) {
        const updated = { ...existing.value, ...calendarData };
        existing.update(updated);
      } else {
        await new Promise((resolve) => {
          const req = dataStore.add({ pk: Date.now(), ...calendarData });
          req.onsuccess = resolve;
        });

        setSelectedWorkTime(calendarData.startTime, calendarData.endTime, true);
      }
    },

    /* ✅ SELECT ALL */
    selectAll: async () => {
      const index = dataStore.index("date");

      await new Promise((resolve) => {
        index.openCursor(null, "prev").onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return resolve();

          const cursorData = { ...cursor.value, key: cursor.primaryKey };
          countBadge(cursorData.date, 1);
          createListData(cursorData);
          cursor.continue();
        };
      });
    },

    /* ✅ SELECT HOLIDAY ALL */
    selectHolidayAll: async () => {
      const index = dataStore.index("date");

      await new Promise((resolve) => {
        index.openCursor(null, "prev").onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return resolve();

          const cursorData = { ...cursor.value, key: cursor.primaryKey };
          const date = cursorData.date;

          !eventDay.solarEventKey && (eventDay.solarEventKey = {});
          eventDay.solarEvent[date] = cursorData.name;
          eventDay.solarEventKey[date] = cursorData.key;

          holidayList();
          cursor.continue();
        };
      });
    },

    /* ✅ WORK TIME LIST (월별) */
    selectWorkTimeList: async () => {
      if (!calendarData.date) return;

      const selectDate = calendarData.date.substring(0, 7);
      const start = `${selectDate}-01`;
      const end = `${selectDate}-31`;
      const index = dataStore.index("date");
      const range = IDBKeyRange.bound(start, end);

      const list = await new Promise((resolve) => {
        const req = index.getAll(range);
        req.onsuccess = () => resolve(req.result);
      });

      workTime = {};
      list.forEach((v) => (workTime[v.date] = true));
      createWorkTimeList(list);
    },

    /* ✅ SELECT WORK TIME (하루) */
    selectWorkTime: async () => {
      if (!calendarData.date) return;

      const index = dataStore.index("date");
      const cursor = await new Promise((resolve) => {
        index.openCursor(IDBKeyRange.only(calendarData.date)).onsuccess = (e) =>
          resolve(e.target.result);
      });

      if (cursor) {
        const { startTime, endTime } = cursor.value;
        setSelectedWorkTime(startTime, endTime, true);
      } else {
        setSelectedWorkTime("08:20", "18:00", false);
      }
    },

    /* ✅ EVENT SEARCH */
    selectEvent: async () => {
      const index = dataStore.index("msg");
      const range = IDBKeyRange.bound("[#]", "[#]\uffff");

      const list = await new Promise((resolve) => {
        const req = index.getAll(range);
        req.onsuccess = () => {
          resolve(req.result);
        };
      });

      createEventList(list);
    },

    /* ✅ SELECT BY DATE */
    select: async () => {
      const index = dataStore.index("date");

      await new Promise((resolve) => {
        index.openCursor(IDBKeyRange.only(calendarData.date)).onsuccess = (
          e
        ) => {
          const cursor = e.target.result;
          if (!cursor) return resolve();

          const cursorData = { ...cursor.value, key: cursor.primaryKey };
          appendData(cursorData);
          cursor.continue();
        };
      });
    },

    /* ✅ DELETE */
    delete: async () => {
      await new Promise((resolve) => {
        const req = dataStore.delete(calendarData.key);
        req.onsuccess = resolve;
      });

      countBadge(calendarData.date, -1);
      loadData(todoDate.textContent);
    },

    /* ✅ DELETE HOLIDAY */
    deleteHoliday: async () => {
      const index = dataStore.index("date");
      const cursor = await new Promise((resolve) => {
        index.openCursor(IDBKeyRange.only(calendarData.date)).onsuccess = (e) =>
          resolve(e.target.result);
      });

      if (cursor) {
        await new Promise((resolve) => {
          dataStore.delete(cursor.primaryKey).onsuccess = resolve;
        });

        delete eventDay.solarEvent[calendarData.date];
        holidayList();
        await createCalendar();
        checkDateList(checkedListData);
      }
    },

    /* ✅ DELETE WORK TIME */
    deleteWorkTime: async () => {
      const index = dataStore.index("date");
      const cursor = await new Promise((resolve) => {
        index.openCursor(IDBKeyRange.only(calendarData.date)).onsuccess = (e) =>
          resolve(e.target.result);
      });

      if (cursor) {
        await new Promise((resolve) => {
          dataStore.delete(cursor.primaryKey).onsuccess = resolve;
        });

        await getWorkTimeData();
        await getSelectEvent();
        await createCalendar();
      }
    },
  };

  await crud[type]();
}
