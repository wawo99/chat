window.onload = function () {
  document.getElementById('todayBox').textContent = convertedToday
  changeTopBarDate()
  toggleTheme(true)
  hljs.highlightAll()
}
windowTheme.addEventListener('change', (e) => {
  toggleTheme()
})
socket.emit('checked date list')
socket.on('checked date list', async (checkedList) => {
  // console.log('checked date list', { checkedList })
  await createCalendar(true)
  checkedListData = checkedList
  checkDateList(checkedListData)
})
window.addEventListener('resize', async function () {
  await createCalendar()
  checkDateList(checkedListData)
})
