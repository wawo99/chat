// 달력 일정 가져오는 api
async function getDateApi(year) {
  const url = `https://cdn.jsdelivr.net/gh/distbe/holidays@gh-pages/${year}.json`;

  eventDay.holiday = {};

  await fetch(url)
    .then(async (res) => {
      const data = await res.json();
      // console.log({ data })
      isCalc = false;
      data.forEach((v) => {
        const date = v.date.split("-");
        eventDay.holiday[`${date[1]}${date[2]}`] = {
          name: v.name,
          holiday: v.holiday,
        };
      });
    })
    .catch((e) => {
      isCalc = true;
    });
}

// 휴가 업데이트
function updateHoliday() {
  // console.log(todoDate.textContent);
  connectionDB("holiday", "deleteHoliday", {
    key: todoDate.textContent,
    date: todoDate.textContent,
  });
  if (todoCheckedHoliday.checked) {
    connectionDB("holiday", "insertHoliday", {
      date: todoDate.textContent,
      name: "월차",
    });
  }
}

// 휴가 설정 데이터 가져오기
function getHolidayData() {
  connectionDB("holiday", "selectHolidayAll", {});

  const loadData = setTimeout(async () => {
    await createCalendar(true);
    checkDateList(checkedListData);
    clearTimeout(loadData);
  }, 50);
}

// 근무시간 데이터 가져오기
function getWorkTimeData(date = getTodayDate()) {
  connectionDB("work", "selectWorkTimeList", { date });
  workMonth.value = date.substring(0, 7);
}

// 근무시간 리스트 생성
function createWorkTimeList(workTimeData) {
  workTimeList.innerHTML = "";

  workTimeData.forEach((v) => {
    const workTimeItem = document.createElement("div");
    const workTimeItemBtn = document.createElement("button");

    workTimeItem.textContent = `${v.date} : ${v.startTime} ~ ${v.endTime}`;
    workTimeItemBtn.textContent = "X";
    workTimeItemBtn.addEventListener("click", () => {
      connectionDB("work", "deleteWorkTime", { key: v.pk, date: v.date });
    });

    workTimeItem.appendChild(workTimeItemBtn);
    workTimeList.appendChild(workTimeItem);
  });
}

// 휴가 연도 변경
function changeHolidayYear() {
  const holidayYearSelect = document.getElementById("holidayYear");
  const year = holidayYearSelect.value;

  holidayList(year);
}

// 휴가 리스트 출력
function holidayList(year = `${new Date().getFullYear()}`) {
  const holidayList = document.getElementById("holidayList");
  const holidayListCount = document.getElementById("holidayListCount");
  const holidayYear = document.getElementById("holidayYear");

  holidayList.innerHTML = "";
  holidayListCount.innerHTML = "";
  holidayYear.innerHTML = "<option value='all'>전체</option>";

  const holidayYears = {};
  let holidayCount = 0;

  Object.entries(eventDay.solarEvent).map((k, v) => {
    // console.log(k, v, k[0].slice(0, 4));
    const holidayYearKey = k[0].slice(0, 4);
    holidayYears[holidayYearKey] = true;
    if (year != "all" && holidayYearKey !== year) return;
    const holidayItem = document.createElement("div");
    const holidayItemBtn = document.createElement("button");
    holidayItem.textContent = `${k[0]} : ${k[1]} `;
    holidayItemBtn.textContent = "X";
    holidayItemBtn.addEventListener("click", () => {
      connectionDB("holiday", "deleteHoliday", {
        key: k[0],
        date: k[0],
      });
    });
    holidayItem.appendChild(holidayItemBtn);
    holidayList.appendChild(holidayItem);
    holidayCount++;
  });

  Object.keys(holidayYears).forEach((y) => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    option.selected = year === y;
    holidayYear.appendChild(option);
  });

  holidayListCount.textContent = `(${holidayCount})`;
}

// 테마 토글
function toggleTheme(init = false) {
  const body = document.getElementsByTagName("body")[0];
  const theme = body.id;
  const themeConfig = {
    dark: "white",
    white: "dark",
  };
  if (init) {
    const themeItem = localStorage.getItem("theme");
    // console.log({ themeItem })
    body.id = themeItem ? themeItem : windowTheme.matches ? "dark" : "white";
  } else {
    body.id = themeConfig[theme];
  }
  localStorage.setItem("theme", body.id);
  // socket.emit('checked date list')
}

// 상단 바 날짜 변경
function changeTopBarDate() {
  const selectDay = changedDate ? new Date(changedDate) : new Date();
  const year = selectDay.getFullYear();
  const month = `0${selectDay.getMonth() + 1}`.slice(-2);
  // console.log({ month })
  document.getElementById(
    "calendarInfo"
  ).innerHTML = `<span class='btn' onclick='preMonth()'>이전</span><span>${year}년 ${month}월</span><span class='btn' onclick='nextMonth()'>다음</span>`;
}

// 결제자 체크리스트 출력
function checkDateList(checkedList) {
  const realName = {
    W: "우현",
    S: "순도",
    C: "쿠폰",
  };
  const opponentName = {
    W: "S",
    S: "W",
  };
  const orderbyCheckedList =
    checkedList.length > 0 ? _.orderBy(checkedList, ["date"], ["asc"]) : [];
  const filterCheckedObject = orderbyCheckedList
    .filter((v) => v.name !== "C")
    .slice(-1)[0];
  const lastCheckedObject = orderbyCheckedList.slice(-1)[0] || {};
  const lastBuyerName = filterCheckedObject?.name;
  const futureBuyerName = opponentName[lastBuyerName];
  const isBuy = lastCheckedObject?.date === convertedToday;
  const selectBox = document.getElementById("selectBox");

  selectBox.innerHTML = "";

  Object.keys(realName).forEach((v) => {
    const option = document.createElement("option");

    option.value = v;
    option.id = v;
    option.textContent = realName[v];

    selectBox.append(option);
  });

  function getMessage() {
    let message;
    const nameToBuy = isBuy
      ? realName[lastBuyerName]
      : realName[futureBuyerName];
    switch (lastCheckedObject.name === "C" && isBuy) {
      case true:
        message = "쿠폰으로 결제";
        break;
      default:
        message = `${nameToBuy}님이${isBuy ? "결제" : "결제예정"}`;
    }
    if (!nameToBuy) message = "초기화중...";
    return message;
  }

  orderbyCheckedList.forEach((v, i) => {
    const dateElement = document.createElement("div");
    const selectDate = document.getElementById(`c-${v.date}`);

    dateElement.className = `${realName[v.name]} content`;

    let deleteButton = "";

    if (isBuy && orderbyCheckedList.length - 1 === i) {
      deleteButton = `<button type='button' class='remove' onclick='remove("${v.date}")'>X</button>`;
    }

    dateElement.innerHTML = `<span>${realName[v.name]}${deleteButton}</span>`;

    if (selectDate) selectDate.append(dateElement);
  });

  if (futureBuyerName)
    document.getElementById(futureBuyerName ?? "").selected = true;

  document.getElementById("whosCoffee").textContent = getMessage();
}

// 체크리스트 삭제
function remove(date) {
  socket.emit("checked remove date", { date });
}

// 체크리스트 등록
function submit() {
  const selectBox = document.getElementById("selectBox");
  // console.log({ convertedToday })
  socket.emit("checked date", {
    date: convertedToday,
    name: selectBox.value,
  });
}

// 달력 너비 계산
function getComputedCalendarWidth() {
  const body = getComputedStyle(calendarBox);
  const width = Number(body.width.replace("px", ""));
  const dateWidth = Math.floor(width / 7);
  return { width, dateWidth };
}

// 달력 생성
async function createCalendar(isChangeYear = false, isEffect = true) {
  // console.log("TEST 1 createCalendar");
  const today = changedDate ? new Date(changedDate) : new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentLastDay = new Date(currentYear, currentMonth, 0);
  const currentTotalDay = currentLastDay.getDate();
  const preFirstDay = new Date(currentYear, currentMonth - 1, 1);
  const preLastDay = new Date(currentYear, currentMonth - 1, 0);
  const preRemainDay = preFirstDay.getDay();
  const preTotalDay = preLastDay.getDate();
  const nextLastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalCellNumber = currentTotalDay + preRemainDay;

  const nextRemainNumber = Math.ceil(totalCellNumber / 7) * 7 - totalCellNumber;
  const { dateWidth } = getComputedCalendarWidth();

  isChangeYear && (await getDateApi(currentYear));

  function getBockDate(currentDate, bockTypeNum) {
    let gengDays = [];
    const solarDynamic = {};
    const bockTypeMaxNum = _.max(bockTypeNum);
    const bockType = {
      1: "말복",
      3: "초복",
      4: "중복",
    };
    while (gengDays.length < bockTypeMaxNum) {
      calendarForBock.setSolarDate(
        currentYear,
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      const gapja = calendarForBock.getKoreanGapja();

      // console.log({ gapja })
      if (gapja.day.includes("경")) {
        const gengDayMonthKey = `0${currentDate.getMonth() + 1}`.slice(-2);
        const gengDayDateKey = `0${currentDate.getDate()}`.slice(-2);

        gengDays.push({
          gapja: gapja.day,
          day: `${gengDayMonthKey}${gengDayDateKey}`,
        });

        const gngLen = gengDays.length;

        bockTypeNum.includes(gngLen) &&
          (solarDynamic[`${gengDayMonthKey}${gengDayDateKey}`] =
            bockType[gngLen]);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return solarDynamic;
  }

  if (isChangeYear) {
    eventDay.solarDynamic = {
      ...getBockDate(new Date(currentYear, 5, 21), [3, 4]),
      ...getBockDate(new Date(currentYear, 7, 7), [1]),
    };
  }

  function createCell(
    className,
    { year = "", month = "", date = "", lunarDate = {} }
  ) {
    const selectDate = new Date(`${year}-${month}-${date}`);
    const weekOfDay = selectDate.getDay();
    const weekOfDayObject = {
      0: " sunday",
      6: " saturday",
    };

    const box = document.createElement("div");

    box.style.width = `${dateWidth}px`;
    box.style.height = `${dateWidth}px`;
    box.className = className;
    box.className += " c-box";
    box.className +=
      Number(month) === new Date().getMonth() + 1 &&
      Number(date) === new Date().getDate()
        ? " today"
        : "";
    box.className += weekOfDayObject[weekOfDay] ? " holiday" : "";
    box.id = `c-${year}-${month}-${date}`;

    const getDateTemplate = (dateData, className, originElement = "") => {
      const isString = typeof dateData === "string";
      const element = isString
        ? (dateData && `<span class='${className}'>${dateData}</span>`) ||
          originElement
        : (dateData &&
            `<span class='${dateData.holiday ? " holi-date" : " term-date"}'>${
              dateData.name
            }</span>`) ||
          originElement;
      return element;
    };

    const lunarDateElement = lunarDate.month
      ? `<span class='lunar-date'>(${lunarDate.month}/${lunarDate.day})</span>`
      : "";

    if (lunarDate.month) {
      lunarDate.month = `0${lunarDate.month}`.slice(-2);
      lunarDate.day = `0${lunarDate.day}`.slice(-2);
    }

    const solarDateKey = `${month}${date}`;
    const lunarDateKey = `${lunarDate.month}${lunarDate.day}`;
    const solarFullDateKey = `${year}-${month}-${date}`;

    const eventDayElement = getDateTemplate(
      eventDay.solarEvent[solarFullDateKey],
      "event-date"
    );

    if (isCalc) {
      // 이 부분은 혹시라도 공휴일 가져오는 api가 에러일때 또는 접속불가일때 공휴일 이벤트 일정 표시한다.
      const termElement = getDateTemplate(
        eventDay.solarTerm[solarDateKey] || eventDay.solarDynamic[solarDateKey],
        "term-date"
      );
      const holidayElement = getDateTemplate(
        eventDay.solar[solarDateKey] || eventDay.lunar[lunarDateKey],
        "holi-date"
      );
      box.innerHTML = `<span class='date'><span class='${
        weekOfDayObject[weekOfDay] ?? ""
      }'>${date}</span>${lunarDateElement}${holidayElement}${eventDayElement}${termElement}</span>`;
    } else {
      // 여기에서 실질적인 공휴일 및 이벤트 날을 설정한다.
      const holidayObjOriginElement = getDateTemplate(
        eventDay.holiday[solarDateKey] || eventDay.solarDynamic[solarDateKey],
        "term-date"
      );
      const holidayObjElement = getDateTemplate(
        eventDay.lunar[lunarDateKey],
        "holi-date",
        holidayObjOriginElement
      );
      const birthdayObjElement = getDateTemplate(
        eventDay.birthday[solarDateKey],
        "holi-date",
        holidayObjElement
      );
      box.innerHTML = `<span class='date'><span class='${
        weekOfDayObject[weekOfDay] ?? ""
      }'>${date}</span>${lunarDateElement}${eventDayElement}</span><div>${birthdayObjElement}</div>`;
    }

    box.innerHTML += `<div class='badge' id='badge-${solarFullDateKey}'></div>`;

    box.addEventListener("click", () => {
      const cBox = calendarBox.getElementsByClassName("c-box");

      for (v of cBox) {
        v.className = v.className.replace("c-box-active", "");
      }

      document.getElementById(box.id).className += " c-box-active";

      todoDate.textContent = `${solarFullDateKey}`;
      todo.style.display = "block";

      // 휴무 체크박스
      todoCheckedHoliday.checked = !!eventDay.solarEvent[`${solarFullDateKey}`];
      loadData(todoDate.textContent, box);

      // 출퇴근시간 로드
      connectionDB("work", "selectWorkTime", {
        date: solarFullDateKey,
      });
      const workTimeBtn = document.getElementById("workTimeBtn");
      workTimeBtn.dataset.date = solarFullDateKey;
    });

    calendarBox.append(box);
  }

  calendarBox.innerHTML = "";

  for (let i = 0; i < preRemainDay; i++) {
    createCell("empty-box", {
      year: preLastDay.getFullYear(),
      month: `0${preLastDay.getMonth() + 1}`.slice(-2),
      date: `0${preTotalDay - (preRemainDay - i - 1)}`.slice(-2),
    });
  }
  for (let i = 0; i < currentTotalDay; i++) {
    calendar.setSolarDate(currentYear, currentMonth, i + 1);

    const lunarDate = calendar.getLunarCalendar();

    createCell("box", {
      year: currentYear,
      month: `0${currentMonth}`.slice(-2),
      date: `0${i + 1}`.slice(-2),
      lunarDate,
    });
  }
  for (let i = 0; i < nextRemainNumber; i++) {
    createCell("empty-box", {
      year: nextLastDay.getFullYear(),
      month: `0${nextLastDay.getMonth() + 1}`.slice(-2),
      date: `0${i + 1}`.slice(-2),
    });
  }

  if (isEffect) {
    // 효과
    const effectBox = document.querySelectorAll(".c-box");

    effectBox.forEach((box) => {
      box.style.animationDelay = `${Math.random() * 0.5}s`;
      const rect = box.getBoundingClientRect();
      box.style.top = `${rect.top}px`;
      box.style.left = `${rect.left}px`;
    });

    effectBox.forEach((box) => {
      box.className += " c-box-animation";
    });
  }

  calendarList.innerHTML = "";

  connectionDB("calendar", "selectAll", {});
}

// 달력 날짜 변경
function changeDate(n) {
  const dateInfo = changedDate?.split("-") || convertedToday.split("-");
  // const month = dateInfo[1];
  const checkedDate = new Date(dateInfo[0], Number(dateInfo[1]) - 1 + n);

  changedDate = `${checkedDate.getFullYear()}-${`0${
    checkedDate.getMonth() + 1
  }`.slice(-2)}`;

  changeTopBarDate();

  return Number(dateInfo[0]) !== checkedDate.getFullYear();
}

// 이전 달
async function preMonth() {
  await createCalendar(changeDate(-1));
  checkDateList(checkedListData);
  closeTodo();
}

// 다음 달
async function nextMonth() {
  await createCalendar(changeDate(1));
  checkDateList(checkedListData);
  closeTodo();
}

// 할일창 닫기
function closeTodo() {
  todo.style.display = "none";
}

// 할일 저장
function saveTodo() {
  const date = todoDate.textContent;
  const msg = todoBoxMsg.value;
  const user = "test";

  // console.log({ date, user, msg })
  connectionDB("calendar", "insert", { user, date, msg });

  socket.emit("calendar refesh", { date, num: selectCountBadge(date) });

  todoBoxMsg.value = "";
}

// 할일 데이터 추가
function appendData({ key, date, user, msg }) {
  const todoDiv = document.createElement("div");
  const contents = document.createElement("pre");
  const codeDiv = document.createElement("code");
  const button = document.createElement("button");

  button.textContent = "X";

  button.addEventListener("click", () => {
    connectionDB("calendar", "delete", { key, date });
    // console.log("삭제:", { key, date });
    socket.emit("calendar refesh", { date, num: selectCountBadge(date) });
  });

  codeDiv.className = "code html";
  codeDiv.textContent = msg;

  hljs.highlightElement(codeDiv);

  contents.appendChild(codeDiv);
  contents.style.marginLeft = "10px";

  todoDiv.style.display = "flex";
  todoDiv.appendChild(contents);

  if (key) todoDiv.prepend(button);

  todoList.prepend(todoDiv);
}

// 할일 데이터 불러오기
function loadData(date) {
  todoList.innerHTML = "";
  connectionDB("calendar", "select", { date });
}

// 배지 카운트 변경
function countBadge(date, num) {
  // console.log('countBadge')
  const badge = document.getElementById(`badge-${date}`);

  if (badge) {
    const badgeCount = badge.textContent || "";

    // console.log({ badgeCount })
    if ((num === -1 && badgeCount > 0) || num === 1)
      badge.textContent = Number(badgeCount) + num;

    badge.textContent = badge.textContent === "0" ? "" : badge.textContent;
    badge.className = badge.textContent === "" ? "badge" : "badge badge-active";
  }
}

// 할일 리스트 전체 일자 데이터 생성
function createListData({ date, msg }) {
  const box = document.createElement("div");

  // 오늘 날짜 클래스 추가
  const todayClass = date === getTodayDate() ? " list-today" : "";

  box.className += " msg-list-box";
  box.innerHTML = `<span class='msg-list-date ${todayClass}'>${date}</span><div class='msg-list-msg'>${msg}</div>`;

  calendarList.append(box);
}

// 배지 카운트 선택
function selectCountBadge(date) {
  // console.log('countBadge')
  const badge = document.getElementById(`badge-${date}`);

  if (badge) {
    const badgeCount = badge.textContent || "";
    return badgeCount;
  }

  return 0;
}

// 배지 카운트 설정
function setCountBadge(date, num) {
  // console.log('countBadge')
  const badge = document.getElementById(`badge-${date}`);

  if (badge) {
    badge.textContent = num;
  }
}

// 휴일 추가
function insertHoliday() {
  const holidayDateInput = document.getElementById("holidayDate");
  const holidayNameInput = document.getElementById("holidayName");
  const holidayDate = holidayDateInput.value;
  const holidayName = holidayNameInput.value;

  if (!holidayDate) return;

  connectionDB("holiday", "insertHoliday", {
    date: holidayDate,
    name: holidayName,
  });
}

// 오늘 날짜
function getTodayDate() {
  const today = new Date();
  const Y = today.getFullYear();
  const M = `0${today.getMonth() + 1}`.slice(-2);
  const D = `0${today.getDate()}`.slice(-2);
  return `${Y}-${M}-${D}`;
}

// 출퇴근 시간 설정 저장
function setWorkTime() {
  const workDate = workTimeBtn.dataset.date || getTodayDate();

  connectionDB("work", "insertWorkTime", {
    startTime: workStartTime.value,
    endTime: workEndTime.value,
    date: workDate,
  });
}

// 선택된 출퇴근 시간 설정
function setSelectedWorkTime(startTime, endTime, isSavedWorkTime) {
  workStartTime.value = startTime;
  workEndTime.value = endTime;

  if (isSavedWorkTime) {
    workStartTime.classList.add("saved-work-time");
    workEndTime.classList.add("saved-work-time");
  } else {
    workStartTime.classList.remove("saved-work-time");
    workEndTime.classList.remove("saved-work-time");
  }
}
