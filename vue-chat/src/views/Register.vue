<template>
    <div class="register-container">
      <h2>注册</h2>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            @blur="checkUsername"
            type="text"
            placeholder="请输入用户名"
          />
          <p v-if="usernameTaken" class="error-text">该用户名已被占用</p>
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
            <button type="button" class="toggle-btn" @click="togglePassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
          <p v-if="!isPasswordValid" class="error-text">
            密码需为 6~18 位，仅包含字母、数字及常用符号
          </p>
        </div>
  
        <div class="form-group">
          <label for="confirm">确认密码</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
          />
          <p v-if="passwordsMismatch" class="error-text">两次密码输入不一致</p>
        </div>
  
        <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
  
        <button type="submit" :disabled="!canRegister" class="register-button">
          注册
        </button>
  
        <p class="link-text">
          已有账号？<a @click.prevent="goToLogin" href="#">去登录</a>
        </p>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import axios from 'axios'
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const username = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const showPassword = ref(false)
  const usernameTaken = ref(false)
  const successMessage = ref('')
  
  // 模拟已存在的用户名
  const existingUsers = ['aaa', 'bob']
  
  const checkUsername = () => {
    usernameTaken.value = existingUsers.includes(username.value.trim())
  }
  
  // 新密码规则：6~18 位，允许英文 + 数字 + 常见符号
  const isPasswordValid = computed(() =>
    /^[A-Za-z0-9!@#$%^&*()_\-+=\[\]{}|\\:;"'<>,.?/~`]{6,18}$/.test(password.value)
  )
  
  const passwordsMismatch = computed(() => {
    return confirmPassword.value !== password.value
  })
  
  const canRegister = computed(() => {
    return (
      username.value.trim() !== '' &&
      !usernameTaken.value &&
      isPasswordValid.value &&
      !passwordsMismatch.value
    )
  })
  
  const togglePassword = () => {
    showPassword.value = !showPassword.value
  }
  
  // const handleRegister = () => {
  //   successMessage.value = '注册成功！即将跳转至登录页面...'
  //   setTimeout(() => {
  //     router.push('/login')
  //   }, 2000)
  // }
  const handleRegister = async () => {
  try {
    const res = await axios.post('http://host.docker.internal:8080/register', {
      username: username.value,
      password: password.value,
    })

    // 注册成功提示
    successMessage.value = res.data.message || '注册成功！即将跳转至登录页面...'

    // 2 秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    successMessage.value = ''

    // 如果后端返回了错误信息
    if (err.response?.data?.error) {
      alert(err.response.data.error)
    } else {
      alert('请求失败，请稍后再试')
    }
  }
}

  
  const goToLogin = () => {
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .register-container {
    max-width: 450px;
    margin: 80px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    font-family: Arial, sans-serif;
  }
  
  .register-form {
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
    margin-top: 5px;
  }
  
  .success-text {
    color: green;
    font-size: 15px;
    margin: -10px 0 10px;
  }
  
  .register-button {
    padding: 10px;
    background-color: #42b983;
    color: white;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .register-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .link-text {
    margin-top: 10px;
    font-size: 14px;
    text-align: center;
  }
  
  .link-text a {
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
  }
  </style>
  