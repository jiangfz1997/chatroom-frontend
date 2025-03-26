<template>
    <div class="home-container">
      <h1>欢迎来到聊天室</h1>
      <p class="subtitle">请选择操作方式</p>
      <div class="button-group">
        <button @click="goToLogin">登录</button>
        <button @click="goToRegister">注册</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router' // 第一步：引入 useRouter
  const router = useRouter()             // 第二步：获取路由实例
  // 暂时先用控制台模拟点击事件
  const goToLogin = () => {
    console.log("点击了登录")
    router.push('/login')
  }
  
  const goToRegister = () => {
    console.log("点击了注册")
    router.push('/register')
  }
  </script>
  
  <style scoped>
  .home-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 20px;
    text-align: center;
  }
  
  .subtitle {
    margin-top: 10px;
    color: #666;
    font-size: 16px;
  }
  
  .button-group {
    margin-top: 40px;
    display: flex;
    gap: 30px;
  }
  
  button {
    padding: 12px 24px;
    font-size: 16px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  button:hover {
    background-color: #36986f;
  }
  </style>
  