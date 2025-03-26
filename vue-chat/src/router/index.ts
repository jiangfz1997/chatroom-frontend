// src/router/index.ts
console.log('router/index.ts 加载成功')
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Chatroom from '@/views/Chatroom.vue'
//import Login from '../views/Login.vue' // 用相对路径测试


const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/chatroom',
    name: 'Chatroom',
    component: Chatroom
  }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

console.log('路由表：', routes)