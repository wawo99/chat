window.onload = function () {
  document.getElementById("todayBox").textContent = convertedToday;
  changeTopBarDate();
  toggleTheme(true);
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

socket.on("calendarRefesh", ({ date, num }) => {
  // console.log("calendarRefesh", date);
  createCalendar();
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
    .querySelectorAll("#menu-card li")
    .forEach((li) => li.classList.remove("active"));
  menus.forEach((div) => (div.style.display = "none"));

  // 선택된 탭 활성화
  e.target.classList.add("active");
  const targetId = e.target.dataset.target;
  document.getElementById(targetId).style.display = "block";
});

// 초기 상태: 첫 번째 탭 자동 선택
document.querySelector("#menu-card li").click();

// 달력 리스트 스위치 버튼
let transformX = 0;
convertCalendarList.addEventListener("click", async (e) => {
  transformX = transformX === 0 ? getComputedStyle(calendarLayout).width : 0;
  console.log(getComputedStyle(calendarLayout).width);
  calendarLayout.style.transform = `translateX(-${transformX})`;
  calendarList.style.transform = `translateX(-${transformX})`;
});

// 창 크기 변경 시 달력 다시 생성 달력 할일 리스트 사이즈 조정
window.addEventListener("resize", async (e) => {
  await createCalendar();
  checkDateList(checkedListData);

  if (transformX === 0) return;

  transformX = getComputedStyle(calendarLayout).width;
  calendarLayout.style.transform = `translateX(-${transformX})`;
  calendarList.style.transform = `translateX(-${transformX})`;
});
