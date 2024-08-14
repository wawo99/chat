const socket = io()
const calendar = new KoreanLunarCalendar()
const calendarForBock = new KoreanLunarCalendar()
const eventDay = {
  lunar: {
    1230: '설날',
    '0101': '설날',
    '0102': '설날',
    '0814': '추석',
    '0815': '추석',
    '0719': '(엄)생일',
    '0805': '(장)생일',
  },
  solar: {
    '0815': '광복절',
    1003: '개천절',
    1009: '한글날',
    1225: '크리스마스',
  },
  solarTerm: {
    '0204': '입춘',
    '0219': '우수',
    '0306': '경칩',
    '0321': '춘분',
    '0405': '청명',
    '0420': '곡우',
    '0505': '입하',
    '0521': '소만',
    '0606': '망종',
    '0621': '하지',
    '0707': '소서',
    '0723': '대서',
    '0807': '입추',
    '0823': '처서',
    '0908': '백로',
    '0923': '추분',
    1008: '한로',
    1023: '상강',
    1107: '입동',
    1122: '소설',
    1207: '대설',
    1222: '동지',
    '0105': '소한',
    '0120': '대한',
  },
  solarEvent: {
    '0726': '(순)휴가',
  },
  solarDynamic: {},
  holiday: {},
}
const today = new Date()
const year = today.getFullYear()
const month = `0${today.getMonth() + 1}`.slice(-2)
const date = `0${today.getDate()}`.slice(-2)
const convertedToday = `${year}-${month}-${date}`
let checkedListDate
let changedDate
let isCalc = true
const windowTheme = window.matchMedia('(perfers-color-scheme: dark)')
const todo = document.getElementById('todo')
const todoDate = document.getElementById('todo-date')
const todoBoxMsg = document.getElementById('todo-box-msg')
const todoList = document.getElementById('todo-list')
const calendarBox = document.getElementById('calendarBox')
let db
