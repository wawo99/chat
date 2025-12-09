window.onload = function () {
  document.getElementById("todayBox").textContent = convertedToday;
  changeTopBarDate();
  toggleTheme(true, "dark");
  hljs.highlightAll();
  menuBox.classList.add("close-menu-animation");
};
windowTheme.addEventListener("change", (e) => {
  toggleTheme();
});
socket.emit("checked date list");
socket.on("checked date list", (checkedList) => {
  // console.log("checked date list", { checkedList });
  checkedListData = checkedList;
  getHolidayData();
  getWorkTimeData();
  getSelectEvent();
});

socket.on("calendarRefesh", async ({ date, num }) => {
  console.log("calendarRefesh", date);
  await getSelectEvent();
  await createCalendar();
  // createCalendar(false, false);
  // location.reload();
  // setCountBadge(date, num);
});

menuLogo.addEventListener("click", function () {
  const isClose = menuBox.classList.contains("close-menu-animation");
  menuBox.classList.remove(
    isClose ? "close-menu-animation" : "open-menu-animation"
  );
  menuBox.classList.add(
    isClose ? "open-menu-animation" : "close-menu-animation"
  );
});

menuCard.addEventListener("click", (e) => {
  if (e.target.tagName !== "LI") return;

  // 모든 탭/콘텐츠 비활성화
  document
    .querySelectorAll("#menuCard li")
    .forEach((li) => li.classList.remove("active"));
  menus.forEach((div) => (div.style.display = "none"));

  // 선택된 탭 활성화
  e.target.classList.add("active");
  const targetId = e.target.dataset.target;
  document.getElementById(targetId).style.display = "block";
});

// 초기 상태: 첫 번째 탭 자동 선택
document.querySelector("#menuCard li").click();

// 달력 리스트 스위치 버튼
let transformX = 0;
let classToggle = 1;
convertCalendarList.addEventListener("click", async (e) => {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const toggle = classToggle === 1;
  if (isMobile) {
    // calendarList.style.opacity = toggle ? 1 : 0;
    calendarLayout.style.transform = 0;
    calendarList.style.transform = 0;
    calendarList.style.zIndex = toggle ? 10 : -1;
    calendarList.className = toggle
      ? "calendar-list-box calendar-list-menu-show"
      : "calendar-list-box calendar-list-menu-hide";
  } else {
    calendarList.style.opacity = 1;
    calendarList.style.zIndex = -1;
    calendarList.className = "calendar-list-box";
    transformX = toggle ? getComputedStyle(calendarLayout).width : 0;
    // console.log(getComputedStyle(calendarLayout).width.replace(/(px)/g, ""));
    calendarLayout.style.transform = `translateX(-${transformX})`;
    calendarList.style.transform = `translateX(-${transformX})`;
  }
  classToggle = classToggle * -1;
});

// 창 크기 변경 시 달력 다시 생성 달력 할일 리스트 사이즈 조정
// window.addEventListener("resize", async (e) => {
//   console.log("resize event");
//   await createCalendar();
//   checkDateList(checkedListData);
//   console.log("resize event2");
//   if (transformX === 0) return;

//   transformX = getComputedStyle(calendarLayout).width;
//   calendarLayout.style.transform = `translateX(-${transformX})`;
//   calendarList.style.transform = `translateX(-${transformX})`;
// });

let isTransitioningWidth = 0;
const observer = new ResizeObserver(async (entries) => {
  const w = Math.floor(entries[0].contentRect.width);

  // 10의 의미는 스크롤 넓이 오차범위
  if (Math.abs(isTransitioningWidth - w) <= 10) return;
  isTransitioningWidth = w;
  // console.log(
  //   "entries",
  //   Math.floor(getComputedStyle(calendarLayout).width.replace(/(px)/g, "")),
  //   Math.floor(entries[0].contentRect.width),
  //   isTransitioningWidth === entries[0].contentRect.width
  // );
  await createCalendar();
  checkDateList(checkedListData);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) {
    calendarList.style.zIndex = -1;
    calendarList.style.opacity = 0;
    calendarLayout.style.transform = 0;
    calendarList.style.transform = 0;
  }

  if (transformX === 0) return;

  transformX = getComputedStyle(calendarLayout).width;
  calendarLayout.style.transform = `translateX(-${transformX})`;
  calendarList.style.transform = `translateX(-${transformX})`;
});

observer.observe(calendarLayout);
