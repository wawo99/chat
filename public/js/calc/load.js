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
  // console.log('checked date list', { checkedList })
  checkedListData = checkedList;
  getHolidayData();
});
window.addEventListener("resize", async function () {
  await createCalendar();
  checkDateList(checkedListData);
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
