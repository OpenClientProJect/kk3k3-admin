<template>
  <el-container class="admin-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="admin-aside">
      <div class="logo">
        <img src="../assets/Logo.svg" alt="Logo">
        <span v-show="!isCollapse">视频管理后台</span>
      </div>
      <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          :collapse="isCollapse"
          router
      >
        <el-menu-item index="/">
          <el-icon>
            <Monitor/>
          </el-icon>
          <template #title>控制台</template>
        </el-menu-item>
        <el-menu-item index="/videos">
          <el-icon>
            <Monitor/>
          </el-icon>
          <template #title>视频管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主容器 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon class="toggle-sidebar" @click="toggleSidebar">
            <Fold v-if="!isCollapse"/>
            <Expand v-else/>
          </el-icon>
          <breadcrumb/>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" :src="adminInfo.avatar || defaultAvatar"/>
              <span class="username">{{ adminInfo.nickname || adminInfo.username }}</span>
              <el-icon class="el-icon--right"><arrow-down/></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容区 -->
      <el-main>
        <router-view/>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  ArrowDown,
  Monitor,
  VideoCamera,
  User,
  ChatDotRound,
  Postcard,
  Fold,
  Expand,
  VideoPlay,
  View
} from '@element-plus/icons-vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import adminApi from '../api/admin'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 计算当前激活的菜单
const activeMenu = computed(() => route.path)

// 用户信息
const adminInfo = ref({
  id: '',
  username: '',
  nickname: '',
  avatar: ''
})

// 初始化管理员信息
const initAdminInfo = () => {
  try {
    const info = localStorage.getItem('adminInfo')
    if (info) {
      adminInfo.value = JSON.parse(info)
    } else {
      loadAdminInfo()
    }
  } catch (error) {
    console.error('初始化管理员信息失败', error)
    router.push('/login')
  }
}

// 加载管理员信息
const loadAdminInfo = async () => {
  try {
    const response = await adminApi.getInfo()
    adminInfo.value = response.data
    localStorage.setItem('adminInfo', JSON.stringify(response.data))
  } catch (error) {
    console.error('获取管理员信息失败', error)
    ElMessage.error('获取个人信息失败')
    // 如果获取信息失败且可能是token过期，跳转到登录页
    router.push('/login')
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确认退出登录?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 调用退出登录API
      await adminApi.logout()
    } catch (error) {
      console.error('退出登录失败', error)
    } finally {
      // 无论接口成功失败，都清除本地信息并跳转到登录页
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminInfo')
      router.push('/login')
      ElMessage.success('已退出登录')
    }
  }).catch(() => {
    // 取消退出
  })
}

// 组件挂载后初始化管理员信息
onMounted(() => {
  initAdminInfo()
})
</script>

<style scoped>
.admin-container {
  height: 100vh;
}

.admin-aside {
  background-color: #304156;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  flex-shrink: 0;
}

.admin-menu {
  border-right: none;
  flex: 1;
}

.admin-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  font-size: 14px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style> 