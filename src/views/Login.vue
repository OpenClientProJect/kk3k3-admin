<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="../assets/Logo.svg" alt="Logo">
        <h2>视频管理后台</h2>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import adminApi from '../api/admin'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 表单验证
    await loginFormRef.value.validate()
    loading.value = true
    
    // 调用登录API
    const response = await adminApi.login(loginForm)
    const { token, ...adminInfo } = response.data
    
    // 保存token到localStorage
    localStorage.setItem('adminToken', token)
    
    // 保存用户信息
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    // 错误消息已在请求拦截器处理，这里不再重复显示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header img {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
}
</style> 