<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>控制台</h2>
      <el-button @click="refreshData" type="primary" size="small" :icon="Refresh">刷新</el-button>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="18 " class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-icon videos-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.totalVideos || 0 }}</div>
            <div class="stats-label">视频总数</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-icon pending-icon">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.pendingVideos || 0 }}</div>
            <div class="stats-label">待审核视频</div>
          </div>
          <div v-if="stats.pendingVideos > 0" class="stats-action">
            <el-button type="primary" link @click="goToVideoReview">去审核</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-icon users-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.totalUsers || 0 }}</div>
            <div class="stats-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近待审核视频 -->
    <el-card class="box-card recent-card">
      <template #header>
        <div class="card-header">
          <span>最近待审核视频</span>
          <el-button v-if="recentPendingVideos.length > 0" type="primary" link @click="goToVideoReview">查看全部</el-button>
        </div>
      </template>
      
      <el-table v-loading="loading" :data="recentPendingVideos" style="width: 100%">
        <el-table-column label="封面" width="120" align="center">
          <template #default="scope">
            <el-image 
              :src="scope.row.coverUrl" 
              class="video-cover" 
              fit="cover"
              lazy
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="uploaderName" label="上传者" width="120" align="center" />
        <el-table-column prop="createTime" label="上传时间" width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button @click="handlePreview(scope.row.id)" type="primary" link>预览</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="recentPendingVideos.length === 0 && !loading" description="暂无待审核视频" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, VideoCamera, Timer, User, View, Picture } from '@element-plus/icons-vue'
import adminApi from '../api/admin'
import videoApi from '../api/video'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 统计数据
const stats = reactive({
  totalVideos: 0,
  pendingVideos: 0,
  totalUsers: 0,
})

// 最近待审核视频
const recentPendingVideos = ref([])

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await adminApi.getStats()
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

// 获取最近待审核视频
const fetchRecentPendingVideos = async () => {
  loading.value = true
  try {
    const response = await videoApi.getPendingVideos({
      page: 1,
      size: 5
    })
    recentPendingVideos.value = response.data.videos || []
  } catch (error) {
    console.error('获取最近待审核视频失败', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  await Promise.all([fetchStats(), fetchRecentPendingVideos()])
}

// 格式化数字（添加千位分隔符）
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 跳转到视频审核页面
const goToVideoReview = () => {
  router.push('/video-review')
}

// 预览视频
const handlePreview = (id) => {
  router.push(`/video-detail/${id}`)
}

// 组件挂载后获取数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  height: 120px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.stats-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.stats-icon i {
  font-size: 28px;
  color: #fff;
}

.stats-info {
  flex-grow: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stats-action {
  position: absolute;
  right: 20px;
  bottom: 15px;
}

.videos-icon {
  background-color: #409EFF;
}

.pending-icon {
  background-color: #E6A23C;
}

.users-icon {
  background-color: #67C23A;
}

.views-icon {
  background-color: #F56C6C;
}

.recent-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-cover {
  width: 100px;
  height: 56px;
  border-radius: 4px;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

@media (max-width: 768px) {
  .stats-row .el-col {
    margin-bottom: 15px;
  }
}
</style> 