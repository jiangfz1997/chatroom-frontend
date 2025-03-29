<template>
  <div class="chatroom-container">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <input
        v-model="searchRoomId"
        @keyup.enter="handleSearchRoom"
        type="text"
        class="search-input"
        placeholder="搜索聊天室（输入 ID 并按下回车）..."
      />
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
        <div class="chatroom-item create-room" @click="showCreateModal = true">
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
          <div class="messages" ref="messageContainer">
            <div
              v-if="selectedRoom && !noMoreMessages[selectedRoom.id]"
              class="history-loader"
              @click="loadHistory(selectedRoom.id)"
            >
              Review more history messages
            </div>
            <div
              v-else-if="selectedRoom && noMoreMessages[selectedRoom.id]"
              class="history-loader no-more"
            >
              No more history messages
            </div>

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

    <!-- 新建聊天室弹窗 -->
    <div class="modal-overlay" v-if="showCreateModal">
      <div class="modal-content">
        <h3>创建新聊天室</h3>
        
        <!-- 创建成功前显示输入和选项 -->
        <template v-if="!createSuccessMessage">
          <input v-model="newRoomName" placeholder="聊天室名称" class="modal-input" />
          <select v-model="newRoomPrivacy" class="modal-select">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <div class="modal-buttons">
            <button @click="createRoomConfirm">Create</button>
            <button @click="showCreateModal = false">Exit</button>
          </div>
        </template>

        <!-- 创建成功后提示 -->
        <template v-else>
          <p class="success-message">{{ createSuccessMessage }}</p>
          <!-- <p class="reminder">Please save your chatroom ID, which is the only way your members can find your chatroom.</p> -->
          <div class="modal-buttons">
            <button @click="closeCreateModal">Got it!</button>
          </div>
        </template>
      </div>
    </div>

    <!-- 搜索聊天室结果弹窗 -->
    <div class="modal-overlay" v-if="showSearchModal">
      <div class="modal-content">
        <!-- 成功找到了聊天室 -->
        <div v-if="foundRoom">
          <h3>We've found your chatroom</h3>
          <p><strong>Name:</strong> {{ foundRoom.name }}</p>
          <p>Would you like to join in?</p>
          <div class="modal-buttons">
            <button @click="joinChatroom(foundRoom.id)">Join</button>
            <button @click="showSearchModal = false">Exit</button>
          </div>
        </div>

        <!-- 没有找到聊天室 -->
        <div v-else>
          <p>{{ searchError }}</p>
          <div class="modal-buttons">
            <button @click="showSearchModal = false">OK</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from 'axios'

// ========================== 通用函数 ==============================

// 封装：添加聊天室到侧边栏
const addChatroomToSidebar = (room: { id: string, name: string, isPrivate: boolean }) => {
  if (!chatrooms.value.some(r => r.id === room.id)) {
    chatrooms.value.push({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      unread: 0,
    })
  }
}


const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      const el = messageContainer.value
      if (el) {
        el.scrollTop = el.scrollHeight - el.clientHeight
        console.log(
          '滚动到底部 scrollTop:',
          el.scrollTop,
          'scrollHeight:',
          el.scrollHeight,
          'clientHeight:',
          el.clientHeight
        )
      }
    }, 50)
  })
}

const isAtBottom = () => {
  const el = messageContainer.value
  if (!el) return false
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 10 // 容差10px
}





// ========================== 登录后加载聊天室 ==========================

onMounted(async () => {
  try {
    const res = await axios.get(`http://host.docker.internal:8080/chatrooms/user/${username}`)
    const rooms = res.data.rooms || []
    rooms.forEach((room: any) => {
      const roomId = room.room_id || room.id //优先用 room.room_id
      if (!roomId || typeof roomId !== 'string') {
        console.warn('跳过无效 room:', room)
        return
      }

      const normalizedRoom = {
        id: roomId,
        name: room.name,
        isPrivate: room.isPrivate,
      }

      addChatroomToSidebar(normalizedRoom)
      messageMap.value[roomId] = []
      connectWebSocket(roomId)
    })
  } catch (err) {
    console.error('加载聊天室失败:', err)
  }
})


//搜索聊天室加入
const searchRoomId = ref('')
const showSearchModal = ref(false)
const foundRoom = ref<{ id: string; name: string } | null>(null)
const searchError = ref('')

// 执行搜索请求
const handleSearchRoom = async () => {
  if (!searchRoomId.value.trim()) return

  try {
    const response = await axios.get(`http://host.docker.internal:8080/chatrooms/${searchRoomId.value.trim()}`)
    foundRoom.value = response.data
    searchError.value = ''
    showSearchModal.value = true // 显示弹窗
  } catch (err) {
    foundRoom.value = null
    searchError.value = 'The chatroom does not exist. Please check your chatroom ID.'
    showSearchModal.value = true
  }
}
//加入
const joinChatroom = async (roomId: string) => {
  try {
    await axios.post('http://host.docker.internal:8080/chatrooms/join', {
      username,
      chatroom_id: roomId
    })

    addChatroomToSidebar({
      id: roomId,
      name: foundRoom.value?.name || 'Unknown',
      isPrivate: false,
    })
    messageMap.value[roomId] = []
    showSearchModal.value = false
    searchRoomId.value = ''
    selectRoom(chatrooms.value.find(room => room.id === roomId)!)
  } catch (err) {
    console.error('加入聊天室失败：', err)
    searchError.value = '加入聊天室失败，请稍后再试'
    foundRoom.value = null
  }
}


const username = localStorage.getItem('username') || '未知用户'
//const socket = ref<WebSocket | null>(null)
const sockets = ref<Record<string, WebSocket>>({}) // 此处有修改
// const chatrooms = ref([
//   { id: 1, name: 'Chatroom Guide', isPrivate: false, unread: 0 },
//   { id: 2, name: '项目讨论组', isPrivate: true, unread: 2 },
//   { id: 3, name: '前端频道', isPrivate: false, unread: 5 },
// ])
const chatrooms = ref<{ id: string; name: string; isPrivate: boolean; unread: number }[]>([])

//选择聊天室开始聊天
const selectedRoom = ref<null | typeof chatrooms.value[0]>(null)
//const messages = ref<{ sender: string; text: string }[]>([])
const newMessage = ref('')
//const messageMap = ref<Record<string, { sender: string; text: string }[]>>({})
const messageMap = ref<Record<string, { sender: string; text: string; timestamp?: string }[]>>({}) //此处有修改
const messages = computed(() =>
  selectedRoom.value ? messageMap.value[selectedRoom.value.id] || [] : []
)

// 建立 WebSocket 连接
const connectWebSocket = (roomId: string) => {
  if (sockets.value[roomId]) return // 已连接则跳过

  const socket = new WebSocket(`ws://host.docker.internal:8080/ws/${roomId}?username=${username}`) // 此处有修改
  sockets.value[roomId] = socket // 此处有修改

  socket.onopen = () => { // 此处有修改
    console.log('WebSocket 已连接')

    if (!messageMap.value[roomId]) {
      messageMap.value[roomId] = []
    }

    // if (messageMap.value[roomId].length === 0) {
    //   messageMap.value[roomId].push({ sender: 'Admin', text: 'Welcome!' })
    // }
  }

  socket.onmessage = (event) => { // 此处有修改
    try {
      const msg = JSON.parse(event.data)
      if (!messageMap.value[roomId]) messageMap.value[roomId] = [] // 此处有修改
      messageMap.value[roomId].push(msg)
      if (isAtBottom()) {
        scrollToBottom()
      }
    } catch (err) {
      console.error('消息解析失败：', err)
    }
  }

  socket.onclose = () => { // 此处有修改
    console.log('WebSocket 已关闭')
  }

  socket.onerror = (err) => { // 此处有修改
    console.error('WebSocket 错误：', err)
  }
}

// 切换聊天室
const selectRoom = (room: typeof chatrooms.value[0]) => {
  console.log('点击事件触发，room:', room)
  console.log("准备创建 WebSocket:", `ws://host.docker.internal:8080/ws/${room.id}?username=${username}`)
  selectedRoom.value = room
  if (!messages.value[room.id]) messages.value[room.id] = [] // 确保有初始化
  room.unread = 0
  connectWebSocket(room.id)
  loadHistory(room.id) // 此处有修改：切换后请求历史记录
  scrollToBottom()
}

// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedRoom.value) return
  const roomId = selectedRoom.value.id
  const socket = sockets.value[roomId] // 此处有修改
  if (socket?.readyState === WebSocket.OPEN) {
    const msg = { sender: username, text: newMessage.value.trim() }
    socket.send(JSON.stringify(msg))
    newMessage.value = ''
    
    scrollToBottom()
    
  }
}

// 页面关闭前断开连接
onBeforeUnmount(() => {
  // if (socket.value) {
  //   socket.value.close()
  // }
  Object.values(sockets.value).forEach(s => s.close()) // 此处有修改
})

const logout = () => {
  alert('已登出，欢迎下次再来')
  localStorage.removeItem('username')
  location.href = '/'
}

//create chatroom创建聊天室
const showCreateModal = ref(false)
const newRoomName = ref('')
const newRoomPrivacy = ref<'public' | 'private'>('public')
const createSuccessMessage = ref('')

const createRoomConfirm = async () => {
  if (!newRoomName.value.trim()) {
    createSuccessMessage.value = '聊天室名称不能为空'
    return
  }

  try {
    const response = await axios.post('http://host.docker.internal:8080/chatrooms', {
      name: newRoomName.value.trim(),
      is_private: newRoomPrivacy.value === 'private',
      created_by: username
    })

    const roomId = response.data.room_id
    createSuccessMessage.value = `Create successfully! Your chatroom ID is ${roomId}.\nPlease save your chatroom ID, which is the only way your members can find your chatroom.`
    // 添加到聊天室列表
    const newRoom = {
      id: roomId,
      name: newRoomName.value.trim(),
      isPrivate: newRoomPrivacy.value === 'private',
      unread: 0
    }
    //chatrooms.value.push(newRoom)
    addChatroomToSidebar(newRoom)
    messageMap.value[roomId] = []
    // 自动选中该聊天室
    selectedRoom.value = newRoom
    connectWebSocket(newRoom.id)

  } catch (error) {
    createSuccessMessage.value = '创建失败，请稍后再试'
    console.error('创建聊天室失败:', error)
  }
}
//取消创建
const closeCreateModal = () => {
  showCreateModal.value = false
  createSuccessMessage.value = ''
  newRoomName.value = ''
  newRoomPrivacy.value = 'public'
}




const messageContainer = ref<HTMLElement | null>(null) // 此处有修改
const noMoreMessages = ref<Record<string, boolean>>({}) // 此处有修改
const loadingHistory = ref(false) // 此处有修改
const pageSize = 20 // 此处有修改

const loadHistory = async (roomId: string) => { // 此处有修改
  if (loadingHistory.value || noMoreMessages.value[roomId]) return // 此处有修改
  loadingHistory.value = true // 此处有修改
  const existing = messageMap.value[roomId] || [] // 此处有修改
  //const lastTimestamp = existing[0]?.timestamp || '' // 此处有修改
  const lastTimestamp = existing.length > 0 ? existing[0].timestamp : '' 
  console.log("发送前的时间戳 before:", lastTimestamp)

  try {
    const res = await axios.get(`http://host.docker.internal:8080/messages/${roomId}`, {
      params: {
        username,
        before: lastTimestamp,
        limit: pageSize,
      }
    })
    const older = res.data.messages
    console.log('历史消息加载结果：', older)
    if (!Array.isArray(older) || older.length === 0) {
      noMoreMessages.value[roomId] = true
      return
    } else {
      messageMap.value[roomId] = [...older.reverse(), ...existing] // 此处有修改
    }
  } catch (e) {
    console.error('加载历史消息失败', e)
  } finally {
    loadingHistory.value = false
  }
} // 此处有修改

const handleScroll = () => { // 此处有修改
  const el = messageContainer.value
  if (!el || !selectedRoom.value) return
  console.log("el.scrollTop current:", el.scrollTop)
  if (el.scrollTop <= 5) {
    console.log("检测到滚动，scrollTop:", el.scrollTop)
    loadHistory(selectedRoom.value.id)
  }
} // 此处有修改




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
  display: flex;                /*新增 */
  flex-direction: column;       /*新增 */
  overflow: hidden;             /*替换 overflow-y 为 overflow，避免双滚动 */
  padding: 20px;
  padding-bottom: 80px;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background-color: #2c2c2c;
  padding: 20px 30px;
  border-radius: 10px;
  width: 320px;
  color: white;
  text-align: center;
  box-shadow: 0 0 10px #000;
}

.modal-input, .modal-select {
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  font-size: 14px;
  background-color: #1e1e1e;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.modal-buttons button {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
}

.modal-buttons button:last-child {
  background-color: #f56c6c;
}

.success-message {
  color: white;
  margin-top: 10px;
}

.history-loader {
  text-align: center;
  font-size: 14px;
  color: #1890ff;
  cursor: pointer;
  text-decoration: underline;
  margin-bottom: 12px;
  transition: opacity 0.3s;
} /* 此处有新增 */

.history-loader.no-more {
  color: #aaa;
  cursor: default;
  text-decoration: none;
} /* 此处有新增 */


</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #1e1e1e;
}
</style>
