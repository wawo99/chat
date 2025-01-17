window.onload = function () {
  document.getElementById('todayBox').textContent = convertedToday
  changeTopBarDate()
  toggleTheme(true)
  hljs.highlightAll()
  menuBox.classList.add('close-menu-animation')
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

menuLogo.addEventListener('click', function(){
  const isClose = menuBox.classList.contains('close-menu-animation')
  menuBox.classList.remove( isClose ? 'close-menu-animation' : 'open-menu-animation')
  menuBox.classList.add(isClose ? 'open-menu-animation' : 'close-menu-animation')
})