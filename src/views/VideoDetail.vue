<template>
  <div class="video-detail-container">
    <el-card class="box-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" :title="videoInfo.title || '视频详情'" />
          <div class="right">
            <el-button v-if="videoStatus === 2" @click="handleApprove" type="success" :icon="Check">通过审核</el-button>
            <el-button v-if="videoStatus === 2" @click="handleReject" type="danger" :icon="Close">拒绝审核</el-button>
          </div>
        </div>
      </template>
      
      <div v-if="!loading && videoInfo.id" class="video-content">
        <div class="video-wrapper">
          <video 
            ref="videoPlayer" 
            class="video-player" 
            :src="videoInfo.videoUrl" 
            controls 
            preload="metadata"
            :poster="videoInfo.coverUrl"
          ></video>
        </div>
        
        <div class="video-info">
          <h2 class="video-title">{{ videoInfo.title }}</h2>
          <div class="video-meta">
            <span>上传者: {{ videoInfo.uploaderName }}</span>
            <span>分类: {{ videoInfo.category }}</span>
            <span>播放量: {{ videoInfo.views }}</span>
            <span>点赞数: {{ videoInfo.likes }}</span>
            <span>上传时间: {{ formatDateTime(videoInfo.createTime) }}</span>
            <el-tag :type="getStatusType(videoInfo.status)">{{ getStatusText(videoInfo.status) }}</el-tag>
          </div>
          
          <div class="video-description">
            <h3>视频描述</h3>
            <p v-if="videoInfo.description">{{ videoInfo.description }}</p>
            <p v-else class="no-data">暂无描述</p>
          </div>
          
          <div class="video-tags" v-if="videoInfo.tags">
            <h3>标签</h3>
            <div class="tags-list">
              <el-tag v-for="tag in parseTags(videoInfo.tags)" :key="tag" size="small" class="tag-item">{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-else-if="!loading && !videoInfo.id" description="视频不存在或已被删除" />
    </el-card>
    
    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="30%">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因，将通知用户"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReject" :loading="rejectSubmitting">确认拒绝</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import videoApi from '../api/video'

const route = useRoute()
const router = useRouter()

// 视频ID
const videoId = computed(() => route.params.id)

// 加载状态
const loading = ref(false)

// 视频信息
const videoInfo = ref({})

// 视频状态
const videoStatus = computed(() => videoInfo.value.status || 0)

// 视频播放器引用
const videoPlayer = ref(null)

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectSubmitting = ref(false)
const rejectForm = reactive({
  reason: ''
})

// 获取视频详情
const fetchVideoDetail = async () => {
  if (!videoId.value) return
  
  loading.value = true
  try {
    const response = await videoApi.getVideoDetail(videoId.value)
    videoInfo.value = response.data || {}
  } catch (error) {
    console.error('获取视频详情失败', error)
    ElMessage.error('获取视频详情失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 审核通过
const handleApprove = () => {
  ElMessageBox.confirm('确认审核通过该视频?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await videoApi.reviewVideo(videoId.value, { status: 1 })
      ElMessage.success('审核通过成功')
      fetchVideoDetail()
    } catch (error) {
      console.error('审核通过失败', error)
      ElMessage.error('审核通过失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 拒绝对话框
const handleReject = () => {
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  rejectSubmitting.value = true
  try {
    await videoApi.reviewVideo(videoId.value, {
      status: 3,
      rejectReason: rejectForm.reason
    })
    ElMessage.success('已拒绝审核')
    rejectDialogVisible.value = false
    fetchVideoDetail()
  } catch (error) {
    console.error('拒绝审核失败', error)
    ElMessage.error('拒绝审核失败')
  } finally {
    rejectSubmitting.value = false
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
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
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '处理中',
    1: '正常',
    2: '审核中',
    3: '已下架'
  }
  return statusMap[status] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

// 解析标签
const parseTags = (tags) => {
  if (!tags) return []
  return tags.split(',').filter(tag => tag.trim())
}

// 组件挂载后获取视频详情
onMounted(() => {
  fetchVideoDetail()
})
</script>

<style scoped>
.video-detail-container {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  overflow: hidden;
  border-radius: 4px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-title {
  font-size: 1.5rem;
  margin: 0 0 16px 0;
  color: #303133;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.video-description, .video-tags {
  margin-top: 20px;
}

.video-description h3, .video-tags h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

.video-description p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
}

.no-data {
  color: #909399;
  font-style: italic;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-right: 0;
}

@media (max-width: 768px) {
  .video-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 