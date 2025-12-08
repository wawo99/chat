async function exportIndexedDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const backup = {};

      // 모든 object store 순회
      const storeNames = db.objectStoreNames;
      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();

        backup[storeName] = await new Promise((res, rej) => {
          getAllReq.onsuccess = () => res(getAllReq.result);
          getAllReq.onerror = rej;
        });
      }

      // JSON 문자열로 변환
      const json = JSON.stringify(backup, null, 2);

      // 다운로드 파일 생성
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dbName}_backup.json`;
      a.click();
      URL.revokeObjectURL(url);

      resolve("백업 완료!");
    };

    request.onerror = () => reject("DB 열기 실패");
  });
}

async function importIndexedDB(dbName) {
  const jsonFileInput = document.getElementById("importFile");
  const jsonFile = jsonFileInput.files[0];
  if (!jsonFile) {
    alert("JSON 파일을 선택해주세요.");
    return;
  }
  console.log("importIndexedDB", { dbName, jsonFile });
  const text = await jsonFile.text();
  const data = JSON.parse(text);

  const request = indexedDB.open(dbName);
  request.onsuccess = async (event) => {
    const db = event.target.result;

    for (const [storeName, records] of Object.entries(data)) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      for (const record of records) {
        store.put(record);
      }

      await new Promise((res) => (tx.oncomplete = res));
    }

    alert("복원 완료!");
  };
}

async function uploadIndexedDBToServer(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = async (event) => {
      const db = event.target.result;
      const backup = {};

      const storeNames = db.objectStoreNames;

      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();

        backup[storeName] = await new Promise((res, rej) => {
          getAllReq.onsuccess = () => res(getAllReq.result);
          getAllReq.onerror = rej;
        });
      }

      // ✅ JSON 변환
      const json = JSON.stringify({
        dbName,
        createdAt: new Date().toISOString(),
        data: backup,
      });

      try {
        // ✅ 서버로 업로드
        const res = await fetch("/api/db-backup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: json,
        });

        if (!res.ok) throw new Error("업로드 실패");

        resolve("✅ 서버 업로드 백업 완료!");
      } catch (err) {
        reject("❌ 서버 업로드 실패");
      }
    };

    request.onerror = () => reject("❌ DB 열기 실패");
  });
}

async function deleteIndexedDB(dbName) {
  indexedDB.deleteDatabase(dbName);
  location.reload();
}

function deleteIndexedDBSafe(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);

    let isFinished = false;

    request.onsuccess = () => {
      isFinished = true;
      console.log("✅ delete onsuccess");
      resolve(true);
    };

    request.onerror = () => {
      isFinished = true;
      console.error("❌ delete onerror");
      reject(false);
    };

    request.onblocked = () => {
      console.warn("⛔ delete blocked: 다른 탭에서 사용중");
    };

    // ✅ Safari / 모바일 / 이벤트 누락 대비
    setTimeout(() => {
      if (!isFinished) {
        console.warn("⚠ onsuccess 미발생 → fallback 강제 성공 처리");
        resolve(true);
      }
    }, 1000);
  });
}

async function importIndexedDB2(dbName) {
  await deleteIndexedDBSafe(dbName);
  await openDB(); // DB 재생성 대기
  const res = await fetch(`/api/db-backup/${dbName}`);
  const data = await res.json();
  // console.log("restoreFromServer", { dbName, data });

  const request = indexedDB.open(dbName);
  request.onsuccess = async (event) => {
    const db = event.target.result;

    for (const [storeName, records] of Object.entries(data)) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      for (const record of records) {
        store.put(record);
      }

      await new Promise((res) => (tx.oncomplete = res));
    }

    alert("복원 완료!");
    location.reload();
  };
}
