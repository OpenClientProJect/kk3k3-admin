<template>
  <div class="video-review-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>待审核视频列表</span>
          <div class="right">
            <el-button @click="fetchPendingVideos" type="primary" size="small" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <el-table v-loading="loading" :data="pendingVideos" style="width: 100%" border>
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="封面" width="120" align="center">
          <template #default="scope">
            <el-image 
              :src="scope.row.coverUrl" 
              :preview-src-list="[scope.row.coverUrl]"
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
        <el-table-column prop="category" label="分类" width="100" align="center" />
        <el-table-column prop="createTime" label="上传时间" width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <el-button @click="handlePreview(scope.row.id)" type="primary" size="small" :icon="VideoPlay">预览</el-button>
            <el-button @click="handleApprove(scope.row.id)" type="success" size="small" :icon="Check">通过</el-button>
            <el-button @click="handleReject(scope.row.id)" type="danger" size="small" :icon="Close">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
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
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Refresh, VideoPlay, Check, Close, Picture } from '@element-plus/icons-vue'
import videoApi from '../api/video'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 待审核视频列表
const pendingVideos = ref([])

// 总数
const total = ref(0)

// 查询参数
const query = reactive({
  page: 1,
  size: 10
})

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectSubmitting = ref(false)
const rejectForm = reactive({
  id: null,
  reason: ''
})

// 获取待审核视频列表
const fetchPendingVideos = async () => {
  loading.value = true
  try {
    const response = await videoApi.getPendingVideos({
      page: query.page,
      size: query.size
    })
    pendingVideos.value = response.data.videos
    total.value = response.data.total
  } catch (error) {
    console.error('获取待审核视频失败', error)
    ElMessage.error('获取待审核视频失败')
  } finally {
    loading.value = false
  }
}

// 预览视频
const handlePreview = (id) => {
  router.push(`/video-detail/${id}`)
}

// 审核通过
const handleApprove = async (id) => {
  ElMessageBox.confirm('确认审核通过该视频?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await videoApi.reviewVideo(id, { status: 1 })
      ElMessage.success('审核通过成功')
      fetchPendingVideos()
    } catch (error) {
      console.error('审核通过失败', error)
      ElMessage.error('审核通过失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 拒绝对话框
const handleReject = (id) => {
  rejectForm.id = id
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
    await videoApi.reviewVideo(rejectForm.id, {
      status: 3,
      rejectReason: rejectForm.reason
    })
    ElMessage.success('已拒绝审核')
    rejectDialogVisible.value = false
    fetchPendingVideos()
  } catch (error) {
    console.error('拒绝审核失败', error)
    ElMessage.error('拒绝审核失败')
  } finally {
    rejectSubmitting.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  query.size = size
  fetchPendingVideos()
}

const handleCurrentChange = (page) => {
  query.page = page
  fetchPendingVideos()
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

// 组件挂载后获取待审核视频列表
onMounted(() => {
  fetchPendingVideos()
})
</script>

<style scoped>
.video-review-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 