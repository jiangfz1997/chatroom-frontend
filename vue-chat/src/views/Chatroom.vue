<template>
  <div class="chatroom-container">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <input type="text" class="search-input" placeholder="搜索聊天室..." />
      <div class="user-info">
        <span class="username">{{ username }}</span>
        <button class="logout-button" @click="logout">登出</button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="main-content">
      <!-- 左侧聊天室列表 -->
      <div class="sidebar">
        <div
          v-for="room in chatrooms"
          :key="room.id"
          class="chatroom-item"
          :class="{ active: selectedRoom && selectedRoom.id === room.id }"
          @click="selectRoom(room)"
        >
          <span class="room-name">{{ room.name }}</span>
          <span class="room-type">{{ room.isPrivate ? '私密' : '公开' }}</span>
          <span v-if="room.unread > 0" class="unread">{{ room.unread }}</span>
        </div>
        <div class="chatroom-item create-room" @click="createRoom">
          + 新建聊天室
        </div>
      </div>

      <!-- 右侧聊天窗口 -->
      <div class="chat-window">
        <div v-if="!selectedRoom" class="placeholder-text">
          选择一个聊天室开始聊天吧。
        </div>
        <div v-else class="chat-content">
          <h3>{{ selectedRoom.name }}</h3>
          <div class="messages">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message-container', msg.sender === username ? 'own' : 'other']"
            >
              <div class="sender">{{ msg.sender }}</div>
              <div class="message-bubble">{{ msg.text }}</div>
            </div>
          </div>
          <div class="input-area">
            <input
              v-model="newMessage"
              class="message-input"
              type="text"
              placeholder="请输入消息..."
              @keyup.enter="sendMessage"
            />
            <button class="send-button" @click="sendMessage">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- <script setup lang="ts">
import { ref } from 'vue'

const username = localStorage.getItem('username') || '未知用户'

const chatrooms = ref([
  { id: 1, name: 'Chatroom Guide', isPrivate: false, unread: 0 },
  { id: 2, name: '项目讨论组', isPrivate: true, unread: 2 },
  { id: 3, name: '前端频道', isPrivate: false, unread: 5 },
])

const selectedRoom = ref<null | typeof chatrooms.value[0]>(null)
const messages = ref<{ sender: string; text: string }[]>([])
const newMessage = ref('')

const selectRoom = (room: typeof chatrooms.value[0]) => {
  selectedRoom.value = room
  messages.value = [
    { sender: 'Admin', text: 'Welcome' }
  ]
  room.unread = 0
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({ sender: username, text: newMessage.value })
    newMessage.value = ''
  }
}

const logout = () => {
  alert('已登出，欢迎下次再来')
  localStorage.removeItem('username')
  location.href = '/'
}

const createRoom = () => {
  console.log('点击了创建聊天室')
}
</script> -->

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const username = localStorage.getItem('username') || '未知用户'
const socket = ref<WebSocket | null>(null)

const chatrooms = ref([
  { id: 1, name: 'Chatroom Guide', isPrivate: false, unread: 0 },
  { id: 2, name: '项目讨论组', isPrivate: true, unread: 2 },
  { id: 3, name: '前端频道', isPrivate: false, unread: 5 },
])

const selectedRoom = ref<null | typeof chatrooms.value[0]>(null)
const messages = ref<{ sender: string; text: string }[]>([])
const newMessage = ref('')

// 建立 WebSocket 连接
const connectWebSocket = (roomId: number) => {
  if (socket.value) {
    socket.value.close()
  }

  socket.value = new WebSocket(`ws://host.docker.internal:8080/ws/${roomId}?username=${username}`)

  socket.value.onopen = () => {
    console.log('WebSocket 已连接')
  }

  socket.value.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      messages.value.push(msg)
    } catch (err) {
      console.error('消息解析失败：', err)
    }
  }

  socket.value.onclose = () => {
    console.log('WebSocket 已关闭')
  }

  socket.value.onerror = (err) => {
    console.error('WebSocket 错误：', err)
  }
}

// 切换聊天室
const selectRoom = (room: typeof chatrooms.value[0]) => {
  console.log('点击事件触发，room:', room)
  console.log("准备创建 WebSocket:", `ws://host.docker.internal:8080/ws/${room.id}?username=${username}`)
  selectedRoom.value = room
  messages.value = [{ sender: 'Admin', text: 'Welcome' }]
  room.unread = 0
  connectWebSocket(room.id)
}

// 发送消息
const sendMessage = () => {
  if (newMessage.value.trim() && socket.value?.readyState === WebSocket.OPEN) {
    const msg = {
      sender: username,
      text: newMessage.value.trim(),
    }
    socket.value.send(JSON.stringify(msg))
    newMessage.value = ''
  }
}

// 页面关闭前断开连接
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close()
  }
})

const logout = () => {
  alert('已登出，欢迎下次再来')
  localStorage.removeItem('username')
  location.href = '/'
}

const createRoom = () => {
  console.log('点击了创建聊天室')
}
</script>


<style scoped>
.chatroom-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: white;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #444;
  background-color: #2c2c2c;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 8px;
  font-size: 14px;
  background-color: #3a3a3a;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-weight: bold;
}

.logout-button {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  border-right: 1px solid #444;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #2c2c2c;
}

.chatroom-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  background-color: #3a3a3a;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.chatroom-item:hover {
  background-color: #505050;
}

.chatroom-item.active {
  background-color: #1890ff;
  color: white;
}

.room-name {
  flex: 1;
}

.room-type {
  font-size: 12px;
  color: #ccc;
  margin-left: 6px;
}

.unread {
  background-color: #f56c6c;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  margin-left: 6px;
}

.create-room {
  font-weight: bold;
  color: #1890ff;
  text-align: center;
  border: 1px dashed #1890ff;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #1e1e1e;
  position: relative;
}

.placeholder-text {
  color: #ccc;
  font-size: 16px;
  text-align: center;
  margin-top: 100px;
}

.chat-content h3 {
  margin-bottom: 10px;
  text-align: center;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px; /* 给底部输入栏预留空间 */
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-container {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  word-break: break-word;
}

.message-container.own {
  align-self: flex-end;
  text-align: right;
}

.message-container.other {
  align-self: flex-start;
  text-align: left;
}

.sender {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
  padding: 0 10px;
}

.message-bubble {
  background-color: #3a3a3a;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  color: white;
  display: inline-block;
  max-width: 100%;
}

.message-container.own .message-bubble {
  background-color: #1890ff;
  color: white;
  border-top-right-radius: 0;
}

.message-container.other .message-bubble {
  background-color: #3a3a3a;
  color: white;
  border-top-left-radius: 0;
}

.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
}

.message-input {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  background-color: #2c2c2c;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

.send-button {
  padding: 12px 18px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #1e1e1e;
}
</style>
