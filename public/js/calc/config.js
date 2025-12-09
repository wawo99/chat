const socket = io();
const calendar = new KoreanLunarCalendar();
const calendarForBock = new KoreanLunarCalendar();
const eventDay = {
  lunar: {
    1229: "설날",
    1230: "설날",
    "0101": "설날",
    "0102": "설날",
    "0814": "추석",
    "0815": "추석",
    "0816": "추석",
    "0719": "(엄)생일",
    "0805": "(장)생일",
  },
  solar: {
    "0815": "광복절",
    1003: "개천절",
    1009: "한글날",
    1225: "크리스마스",
  },
  solarTerm: {
    "0204": "입춘",
    "0219": "우수",
    "0306": "경칩",
    "0321": "춘분",
    "0405": "청명",
    "0420": "곡우",
    "0505": "입하",
    "0521": "소만",
    "0606": "망종",
    "0621": "하지",
    "0707": "소서",
    "0723": "대서",
    "0807": "입추",
    "0823": "처서",
    "0908": "백로",
    "0923": "추분",
    1008: "한로",
    1023: "상강",
    1107: "입동",
    1122: "소설",
    1207: "대설",
    1222: "동지",
    "0105": "소한",
    "0120": "대한",
  },
  solarEvent: {
    // 1029: "(순)휴가",
  },
  solarDynamic: {},
  holiday: {},
  birthday: {
    "0214": "한수민 생일",
    "0403": "한솔지 생일",
    "0416": "한강민 생일",
    "0418": "유지은 생일",
    "0909": "MY 생일",
    1122: "(아)생일",
  },
};

// 설정하기
const cf = {
  coffe: false, // 커피박스 보이기
};

// 출퇴근PK
const WORK = {
  workTime: {},
};

let checkedListData = [];

// EVENT 설정
const EVENT = {
  eventAllList: {},
  eventDateList: {},
  eventTotalMoney: 0,
};

const today = new Date();
const year = today.getFullYear();
const month = `0${today.getMonth() + 1}`.slice(-2);
const date = `0${today.getDate()}`.slice(-2);
const convertedToday = `${year}-${month}-${date}`;
let checkedListDate;
let changedDate;
let isCalc = true;
const windowTheme = window.matchMedia("(perfers-color-scheme: dark)");
const todo = document.getElementById("todo");
const todoDate = document.getElementById("todoDate");
const todoCheckedHoliday = document.getElementById("todoCheckedHoliday");
const todoBoxMsg = document.getElementById("todoBoxMsg");
const todoList = document.getElementById("todoList");
const calendarBox = document.getElementById("calendarBox");
let db;

// gnb
const menuLogo = document.getElementById("menuLogo");
const menuBox = document.getElementById("menuBox");
const menuCard = document.getElementById("menuCard");
const menus = document.querySelectorAll(".menu");

// coffeeBox
const coffeeBox = document.getElementById("coffeeBox");
coffeeBox.style.display = cf.coffe ? "block" : "none";

// calendarLayout
const calendarLayout = document.getElementById("calendarLayout");
const calendarList = document.getElementById("calendarList");

// 달력 전환 버튼
const convertCalendarList = document.getElementById("convertCalendarList");

// 근무시간 리스트
const workTimeList = document.getElementById("workTimeList");
const workStartTime = document.getElementById("workStartTime");
const workEndTime = document.getElementById("workEndTime");
const workTimeBtn = document.getElementById("workTimeBtn");
const workMonth = document.getElementById("workMonth");

// 이벤트 리스트
const eventList = document.getElementById("eventList");
const eventCount = document.getElementById("eventCount");
const eventTotal = document.getElementById("eventTotal");
const eventSelect = document.getElementById("eventSelect");
const eventStartDate = document.getElementById("eventStartDate");
const eventEndDate = document.getElementById("eventEndDate");
const todoCheckedEventday = document.getElementById("todoCheckedEventday");

// 메모리
const memoryList = document.getElementById("memoryList");
const todoCheckedMemory = document.getElementById("todoCheckedMemory");

// 로딩
const loading = document.getElementById("loading");
