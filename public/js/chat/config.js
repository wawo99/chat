const socket = io()
const message = document.getElementById('chat-msg')
const form = document.getElementById('chat-form')
const inputValue = document.getElementById('msg-input')
const isTyping = document.getElementById('is-typing')
const setId = document.getElementById('set-id')
const outputImage = document.getElementById('output-image')
const roomTitle = document.getElementById('room-title')
const roomTitleCount = document.getElementById('room-title-count')
const chatRoom = document.getElementById('chat-room-list')
const chatToggleBtn = document.getElementById('chat-toggle-btn')

outputImage.src = ''
let setUser = 'guest'
let db
