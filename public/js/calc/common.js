async function getDateApi(year) {
  const url = `https://cdn.jsdelivr.net/gh/distbe/holidays@gh-pages/${year}.json`

  eventDay.holiday = {}
  await fetch(url)
    .then(async (res) => {
      const data = await res.json()
      // console.log({ data })
      isCalc = false
      data.forEach((v) => {
        const date = v.date.split('-')
        eventDay.holiday[`${date[1]}${date[2]}`] = {
          name: v.name,
          holiday: v.holiday,
        }
      })
    })
    .catch((e) => {
      isCalc = true
    })
}

function toggleTheme(init = false) {
  const body = document.getElementsByTagName('body')[0]
  const theme = body.id
  const themeConfig = {
    dark: 'white',
    white: 'dark',
  }
  if (init) {
    const themeItem = localStorage.getItem('theme')
    // console.log({ themeItem })
    body.id = themeItem ? themeItem : windowTheme.matches ? 'dark' : 'white'
  } else {
    body.id = themeConfig[theme]
  }
  localStorage.setItem('theme', body.id)
  // socket.emit('checked date list')
}
function changeTopBarDate() {
  const selectDay = changedDate ? new Date(changedDate) : new Date()
  const year = selectDay.getFullYear()
  const month = `0${selectDay.getMonth() + 1}`.slice(-2)
  // console.log({ month })
  document.getElementById(
    'calendarInfo',
  ).innerHTML = `<span class='btn' onclick='preMonth()'>이전</span><span>${year}년 ${month}월</span><span class='btn' onclick='nextMonth()'>다음</span>`
}
function checkDateList(checkedList) {
  const realName = {
    W: '우현',
    S: '순도',
    C: '쿠폰',
  }
  const opponentName = {
    W: 'S',
    S: 'W',
  }
  const orderbyCheckedList =
    checkedList.length > 0 ? _.orderBy(checkedList, ['date'], ['asc']) : []
  const filterCheckedObject = orderbyCheckedList
    .filter((v) => v.name !== 'C')
    .slice(-1)[0]
  const lastCheckedObject = orderbyCheckedList.slice(-1)[0] || {}
  const lastBuyerName = filterCheckedObject?.name
  const futureBuyerName = opponentName[lastBuyerName]
  const isBuy = lastCheckedObject?.date === convertedToday
  const selectBox = document.getElementById('selectBox')
  selectBox.innerHTML = ''
  Object.keys(realName).forEach((v) => {
    const option = document.createElement('option')
    option.value = v
    option.id = v
    option.textContent = realName[v]
    selectBox.append(option)
  })
  function getMessage() {
    let message
    const nameToBuy = isBuy
      ? realName[lastBuyerName]
      : realName[futureBuyerName]
    switch (lastCheckedObject.name === 'C' && isBuy) {
      case true:
        message = '쿠폰으로 결제'
        break
      default:
        message = `${nameToBuy}님이${isBuy ? '결제' : '결제예정'}`
    }
    if (!nameToBuy) message = '초기화중...'
    return message
  }

  orderbyCheckedList.forEach((v, i) => {
    const dateElement = document.createElement('div')
    const selectDate = document.getElementById(`c-${v.date}`)
    dateElement.className = `${realName[v.name]} content`
    let deleteButton = ''
    if (isBuy && orderbyCheckedList.length - 1 === i) {
      deleteButton = `<button type='button' class='remove' onclick='remove("${v.date}")'>X</button>`
    }
    dateElement.innerHTML = `<span>${realName[v.name]}${deleteButton}</span>`
    if (selectDate) selectDate.append(dateElement)
  })

  if (futureBuyerName)
    document.getElementById(futureBuyerName ?? '').selected = true
  document.getElementById('whosCoffee').textContent = getMessage()
}
function remove(date) {
  socket.emit('checked remove date', { date })
}
function submit() {
  const selectBox = document.getElementById('selectBox')
  // console.log({ convertedToday })
  socket.emit('checked date', {
    date: convertedToday,
    name: selectBox.value,
  })
}
function getComputedCalendarWidth() {
  const body = getComputedStyle(calendarBox)
  const width = Number(body.width.replace('px', ''))
  const dateWidth = Math.floor(width / 7)
  return { width, dateWidth }
}
async function createCalendar(isChangeYear) {
  // console.log('createCalendar')
  const today = changedDate ? new Date(changedDate) : new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentLastDay = new Date(currentYear, currentMonth, 0)
  const currentTotalDay = currentLastDay.getDate()
  const preFirstDay = new Date(currentYear, currentMonth - 1, 1)
  const preLastDay = new Date(currentYear, currentMonth - 1, 0)
  const preRemainDay = preFirstDay.getDay()
  const preTotalDay = preLastDay.getDate()
  const nextLastDay = new Date(currentYear, currentMonth + 1, 0)
  const totalCellNumber = currentTotalDay + preRemainDay

  const nextRemainNumber = Math.ceil(totalCellNumber / 7) * 7 - totalCellNumber
  const { width, dateWidth } = getComputedCalendarWidth()

  isChangeYear && (await getDateApi(currentYear))

  function getBockDate(currentDate, bockTypeNum) {
    let gengDays = []
    const solarDynamic = {}
    const bockTypeMaxNum = _.max(bockTypeNum)
    const bockType = {
      1: '말복',
      3: '초복',
      4: '중복',
    }
    while (gengDays.length < bockTypeMaxNum) {
      calendarForBock.setSolarDate(
        currentYear,
        currentDate.getMonth() + 1,
        currentDate.getDate(),
      )
      const gapja = calendarForBock.getKoreanGapja()
      // console.log({ gapja })
      if (gapja.day.includes('경')) {
        const gengDayMonthKey = `0${currentDate.getMonth() + 1}`.slice(-2)
        const gengDayDateKey = `0${currentDate.getDate()}`.slice(-2)
        gengDays.push({
          gapja: gapja.day,
          day: `${gengDayMonthKey}${gengDayDateKey}`,
        })
        const gngLen = gengDays.length
        bockTypeNum.includes(gngLen) &&
          (solarDynamic[`${gengDayMonthKey}${gengDayDateKey}`] =
            bockType[gngLen])
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return solarDynamic
  }

  if (isChangeYear) {
    eventDay.solarDynamic = {
      ...getBockDate(new Date(currentYear, 5, 21), [3, 4]),
      ...getBockDate(new Date(currentYear, 7, 7), [1]),
    }
  }

  function createCell(
    className,
    { year = '', month = '', date = '', lunarDate = {} },
  ) {
    const selectDate = new Date(`${year}-${month}-${date}`)
    const weekOfDay = selectDate.getDay()
    const weekOfDayObject = {
      0: ' sunday',
      6: ' saturday',
    }
    const box = document.createElement('div')
    box.style.width = `${dateWidth}px`
    box.style.height = `${dateWidth}px`
    box.className = className
    box.className += ' c-box'
    box.className += weekOfDayObject[weekOfDay] ? ' holiday' : ''
    box.id = `c-${year}-${month}-${date}`
    const getDateTemplate = (dateData, className, originElement = '') => {
      const isString = typeof dateData === 'string'
      const element = isString
        ? (dateData && `<span class='${className}'>${dateData}</span>`) ||
          originElement
        : (dateData &&
            `<span class='${dateData.holiday ? ' holi-date' : ' term-date'}'>${
              dateData.name
            }</span>`) ||
          originElement
      return element
    }

    const lunarDateElement = lunarDate.month
      ? `<span class='lunar-date'>(${lunarDate.month}/${lunarDate.day})</span>`
      : ''

    if (lunarDate.month) {
      lunarDate.month = `0${lunarDate.month}`.slice(-2)
      lunarDate.day = `0${lunarDate.day}`.slice(-2)
    }

    const solarDateKey = `${month}${date}`
    const lunarDateKey = `${lunarDate.month}${lunarDate.day}`
    const eventDayElement = getDateTemplate(
      eventDay.solarEvent[solarDateKey],
      'event-date',
    )
    if (isCalc) {
      const termElement = getDateTemplate(
        eventDay.solarTerm[solarDateKey] || eventDay.solarDynamic[solarDateKey],
        'term-date',
      )
      const holidayElement = getDateTemplate(
        eventDay.solar[solarDateKey] || eventDay.lunar[lunarDateKey],
        'holi-date',
      )
      box.innerHTML = `<span class='date'><span class='${weekOfDayObject[weekOfDay]}'>${date}</span>${lunarDateElement}${holidayElement}${eventDayElement}${termElement}</span>`
    } else {
      const holidayObjOriginElement = getDateTemplate(
        eventDay.holiday[solarDateKey] || eventDay.solarDynamic[solarDateKey],
        'term-date',
      )
      const holidayObjElement = getDateTemplate(
        eventDay.lunar[lunarDateKey],
        'holi-date',
        holidayObjOriginElement,
      )
      box.innerHTML = `<span class='date'><span class='${weekOfDayObject[weekOfDay]}'>${date}</span>${lunarDateElement}${eventDayElement}</span><div>${holidayObjElement}</div>`
    }
    box.innerHTML += `<div class='badge' id='badge-${year}-${month}-${date}'></div>`
    box.addEventListener('click', () => {
      const cBox = calendarBox.getElementsByClassName('c-box')
      for (v of cBox) {
        v.className = v.className.replace('c-box-active', '')
      }
      document.getElementById(box.id).className += ' c-box-active'
      todoDate.textContent = `${year}-${month}-${date}`
      todo.style.display = 'block'
      loadData(todoDate.textContent, box)
    })

    calendarBox.append(box)
  }

  calendarBox.innerHTML = ''

  for (let i = 0; i < preRemainDay; i++) {
    createCell('empty-box', {
      year: preLastDay.getFullYear(),
      month: `0${preLastDay.getMonth() + 1}`.slice(-2),
      date: `0${preTotalDay - (preRemainDay - i - 1)}`.slice(-2),
    })
  }
  for (let i = 0; i < currentTotalDay; i++) {
    calendar.setSolarDate(currentYear, currentMonth, i + 1)
    const lunarDate = calendar.getLunarCalendar()
    createCell('box', {
      year: currentYear,
      month: `0${currentMonth}`.slice(-2),
      date: `0${i + 1}`.slice(-2),
      lunarDate,
    })
  }
  for (let i = 0; i < nextRemainNumber; i++) {
    createCell('empty-box', {
      year: nextLastDay.getFullYear(),
      month: `0${nextLastDay.getMonth() + 1}`.slice(-2),
      date: `0${i + 1}`.slice(-2),
    })
  }

  connectionDB('calendar', 'selectAll', {})
}

function changeDate(n) {
  const dateInfo = changedDate?.split('-') || convertedToday.split('-')
  const month = dateInfo[1]
  const checkedDate = new Date(dateInfo[0], Number(dateInfo[1]) - 1 + n)
  changedDate = `${checkedDate.getFullYear()}-${`0${
    checkedDate.getMonth() + 1
  }`.slice(-2)}`
  changeTopBarDate()
  return Number(dateInfo[0]) !== checkedDate.getFullYear()
}
async function preMonth() {
  await createCalendar(changeDate(-1))
  checkDateList(checkedListData)
  closeTodo()
}
async function nextMonth() {
  await createCalendar(changeDate(1))
  checkDateList(checkedListData)
  closeTodo()
}
function closeTodo() {
  todo.style.display = 'none'
}
function saveTodo() {
  const date = todoDate.textContent
  const msg = todoBoxMsg.value
  const user = 'test'
  appendData({ date, user, msg })
  // console.log({ date, user, msg })
  connectionDB('calendar', 'insert', { user, date, msg })
}
function appendData({ key, date, user, msg }) {
  const todoDiv = document.createElement('div')
  const contents = document.createElement('pre')
  const codeDiv = document.createElement('code')
  const button = document.createElement('button')
  button.textContent = 'X'
  button.addEventListener('click', () => {
    connectionDB('calendar', 'delete', { key, date })
  })
  codeDiv.className = 'code html'
  codeDiv.textContent = msg
  hljs.highlightElement(codeDiv)
  contents.appendChild(codeDiv)
  contents.style.marginLeft = '10px'
  todoDiv.style.display = 'flex'
  todoDiv.appendChild(contents)
  if (key) todoDiv.prepend(button)
  todoList.prepend(todoDiv)
}
function loadData(date) {
  todoList.innerHTML = ''
  connectionDB('calendar', 'select', { date })
}
function countBadge(date, num) {
  // console.log('countBadge')
  const badge = document.getElementById(`badge-${date}`)
  if (badge) {
    const badgeCount = badge.textContent || ''
    // console.log({ badgeCount })
    badge.textContent = Number(badgeCount) + num
    badge.textContent = badge.textContent === '0' ? '' : badge.textContent
    badge.className = badge.textContent === '' ? 'badge' : 'badge badge-active'
  }
}
