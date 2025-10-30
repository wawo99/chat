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
