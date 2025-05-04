<template>
  <div class="comments-container">
    <div class="page-header">
      <h2>评论管理</h2>
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索评论内容"
          clearable
          class="search-input"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch"></el-button>
          </template>
        </el-input>
        <el-select v-model="searchStatus" placeholder="评论状态" clearable @change="handleSearch">
          <el-option label="全部" value=""></el-option>
          <el-option label="正常" :value="1"></el-option>
          <el-option label="已删除" :value="0"></el-option>
        </el-select>
      </div>
    </div>

    <!-- 评论列表 -->
    <el-card class="comments-list">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="comments.length === 0" class="empty-container">
        <el-empty description="暂无评论数据"></el-empty>
      </div>
      
      <div v-else>
        <el-table
          :data="comments"
          border
          stripe
          style="width: 100%"
          @row-click="rowClick"
        >
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="content" label="评论内容" min-width="200">
            <template #default="{ row }">
              <el-tooltip
                :content="row.content"
                placement="top"
                :show-after="500"
                v-if="row.content && row.content.length > 50"
              >
                <span>{{ row.content.slice(0, 50) }}...</span>
              </el-tooltip>
              <span v-else>{{ row.content }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="评论用户" width="120"></el-table-column>
          <el-table-column label="所属视频" width="150">
            <template #default="{ row }">
              <el-link type="primary" @click.stop="viewVideo(row.videoId)">
                查看视频
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="评论类型" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.parentId" type="info" size="small">回复</el-tag>
              <el-tag v-else type="success" size="small">主评论</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="评论时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 1" type="success">正常</el-tag>
              <el-tag v-else type="danger">已删除</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === 1" 
                type="danger" 
                size="small" 
                @click.stop="handleDelete(row)"
              >
                删除
              </el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                @click.stop="handleRestore(row)"
              >
                恢复
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click.stop="handleDetail(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>

    <!-- 评论详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="评论详情"
      width="600px"
    >
      <div v-if="currentComment" class="comment-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="评论ID">{{ currentComment.id }}</el-descriptions-item>
          <el-descriptions-item label="评论内容">{{ currentComment.content }}</el-descriptions-item>
          <el-descriptions-item label="评论用户">{{ currentComment.username }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentComment.userId }}</el-descriptions-item>
          <el-descriptions-item label="视频ID">{{ currentComment.videoId }}</el-descriptions-item>
          <el-descriptions-item label="父评论ID">
            {{ currentComment.parentId || '无 (主评论)' }}
          </el-descriptions-item>
          <el-descriptions-item label="评论时间">
            {{ formatTime(currentComment.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatTime(currentComment.updateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentComment.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="danger">已删除</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="currentComment.status === 1" 
            type="danger" 
            @click="handleDeleteInDialog"
          >
            删除评论
          </el-button>
          <el-button 
            v-else 
            type="success" 
            @click="handleRestoreInDialog"
          >
            恢复评论
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import adminApi, {getCommentDetail} from '../api/admin'

// 评论列表数据
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const searchStatus = ref('')

// 当前选中的评论
const currentComment = ref(null)
const detailDialogVisible = ref(false)

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '未知'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (e) {
    return timeStr
  }
}

// 加载评论列表
const loadComments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchQuery.value,
      status: searchStatus.value
    }

    const res = await getCommentDetail()
    console.log(res.data)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loadComments()
}

// 处理页面大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadComments()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadComments()
}

// 查看评论详情
const handleDetail = (row) => {
  currentComment.value = row
  detailDialogVisible.value = true
}

// 删除评论
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 实际使用时需要替换为真实的API调用
      // await adminApi.deleteComment(row.id)
      
      // 模拟API调用
      ElMessage.success('删除评论成功')
      // 更新本地数据
      const index = comments.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        comments.value[index].status = 0
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败，请稍后重试')
    }
  }).catch(() => {})
}

// 恢复评论
const handleRestore = (row) => {
  ElMessageBox.confirm('确定要恢复该评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 实际使用时需要替换为真实的API调用
      // await adminApi.restoreComment(row.id)
      
      // 模拟API调用
      ElMessage.success('恢复评论成功')
      // 更新本地数据
      const index = comments.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        comments.value[index].status = 1
      }
    } catch (error) {
      console.error('恢复评论失败:', error)
      ElMessage.error('恢复评论失败，请稍后重试')
    }
  }).catch(() => {})
}

// 在对话框中删除评论
const handleDeleteInDialog = () => {
  if (!currentComment.value) return
  
  handleDelete(currentComment.value)
  detailDialogVisible.value = false
}

// 在对话框中恢复评论
const handleRestoreInDialog = () => {
  if (!currentComment.value) return
  
  handleRestore(currentComment.value)
  detailDialogVisible.value = false
}

// 查看关联视频
const viewVideo = (videoId) => {
  // 跳转到视频详情页面
  window.open(`/videos/detail/${videoId}`, '_blank')
}

// 表格行点击
const rowClick = (row) => {
  handleDetail(row)
}

// 组件挂载时加载数据
onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comments-container {
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.filter-container {
  display: flex;
  gap: 15px;
}

.search-input {
  width: 300px;
}

.comments-list {
  margin-bottom: 20px;
}

.loading-container, .empty-container {
  padding: 40px 0;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.comment-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 