<template>
    <div class="login-container">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
          />
        </div>
  
        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
            />
            <button type="button" @click="togglePassword" class="toggle-btn">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>
  
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  
        <button type="submit" :disabled="!isFormValid" class="login-button">
          登录
        </button>
  
        <p class="link-text">
          还没有账号？<a @click.prevent="goToRegister" href="#">去注册</a>
        </p>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  //import axios from 'axios'
  import api from '@/utils/http'
  const apiBase = import.meta.env.VITE_API_BASE
  
  const router = useRouter()
  
  // 表单字段
  const username = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const errorMessage = ref('')
  
  // 密码可见切换
  const togglePassword = () => {
    showPassword.value = !showPassword.value
  }
  
  // 表单校验：用户名非空，密码至少6位
  const isFormValid = computed(() => {
    return username.value.trim() !== '' && password.value.length >= 6
  })

    // // 模拟用户数据
  // const mockUsers = [
  //   { username: 'aaa', password: '123456' },
  //   { username: 'bob', password: 'password' }
  // ]
  
  // // 模拟登录验证
  // const handleLogin = () => {
  //   const match = mockUsers.find(
  //     (user) =>
  //       user.username === username.value &&
  //       user.password === password.value
  //   )
  
  //   if (match) {
  //     console.log('登录成功！')
  //     errorMessage.value = ''
  //     router.push('/chatroom')//跳转到聊天室界面
  //   } else {
  //     console.log('登录失败：用户名或密码错误')
  //     errorMessage.value = '用户名或密码错误，请重新输入'
  //   }
  // }


  // 登录验证（调用后端接口）
  const handleLogin = async () => {
    try {
      //const res = await axios.post('http://host.docker.internal:8080/login', {
      console.log("login request" + apiBase)
      // const res = await axios.post(`${apiBase}/login`, {
      // //const res = await axios.post('/api/login', {
      //   username: username.value,
      //   password: password.value
      // })
      const res = await api.post('/login', {
        username: username.value,
        password: password.value
      })

      // 设置用户名到 localStorage
      localStorage.setItem('username', res.data.username)
      localStorage.setItem('token', res.data.token)       // 新增：保存 token
      // 登录成功：跳转聊天室
      console.log('登录成功：', res.data)
      errorMessage.value = ''
      router.push('/chatroom')
    } catch (err: any) {
      if (err.response?.data?.error) {
        errorMessage.value = err.response.data.error
      } else {
        errorMessage.value = '登录请求失败，请稍后重试'
      }
    }
  }
  
  // 跳转到注册页
  const goToRegister = () => {
    router.push('/register')
  }
  </script>
  
  <style scoped>
  .login-container {
    max-width: 400px;
    margin: 80px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    font-family: Arial, sans-serif;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-group {
    text-align: left;
  }
  
  input {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .password-wrapper {
    position: relative;
  }
  
  .toggle-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #007bff;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
  }
  
  .error-text {
    color: red;
    font-size: 14px;
    margin-top: -10px;
    text-align: left;
  }
  
  .login-button {
    padding: 10px;
    background-color: #42b983;
    color: white;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .login-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .link-text {
    margin-top: 10px;
    font-size: 14px;
  }
  
  .link-text a {
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
  }
  </style>
  