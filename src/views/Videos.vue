<template>
  <div class="videos-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <el-button type="success" @click="showUploadDialog = true">
            <el-icon>
              <Plus/>
            </el-icon>
            发布新视频
          </el-button>
          <div class="right">
            <el-button @click="fetchVideos" type="primary" size="default" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="videos" style="width: 100%" border>
        <el-table-column type="index" label="#" width="60" align="center"/>
        <el-table-column prop="id" label="ID" width="80" align="center"/>
        <el-table-column label="封面" width="120" align="center">
          <template #default="scope">
            <el-image
                :src="scope.row.cover_url"
                :preview-src-list="[scope.row.coverUrl]"
                class="video-cover"
                fit="cover"
                lazy
            >
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <Picture/>
                  </el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip/>
        <el-table-column prop="category" label="分类" width="100" align="center"/>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-dropdown @command="(cmd) => handleCommand(cmd, scope.row)" trigger="click">
              <el-button size="small" type="primary" text :icon="ArrowDown">
                更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                      divided
                      command="delete"
                      style="color: #F56C6C"
                  >
                    删除视频
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            v-model:page-size="query.size"
            v-model:current-page="query.page"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

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

    <el-dialog
        v-model="showUploadDialog"
        title="发布新视频"
        width="650px"
        :destroy-on-close="true"
        :close-on-click-modal="false"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="请输入视频标题"/>
        </el-form-item>

        <el-form-item label="视频描述" prop="description">
          <el-input v-model="uploadForm.description" type="textarea" :rows="4" placeholder="请输入视频描述"/>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面图片" prop="coverUrl">
              <el-upload
                  class="cover-uploader"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleCoverChange">
                <img v-if="coverPreview" :src="coverPreview" class="cover-preview"/>
                <el-icon v-else class="cover-uploader-icon">
                  <Plus/>
                </el-icon>
              </el-upload>
              <div class="el-upload__tip">
                点击上传封面图片，支持jpg、png格式
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="视频文件" prop="videoFile">
              <el-upload
                  class="video-uploader"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="true"
                  :limit="1"
                  :on-change="handleVideoChange"
                  :on-exceed="handleExceed"
                  :before-remove="handleBeforeRemove">
                <el-button type="primary">选择视频文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持mp4、avi、mov等常见视频格式
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签" prop="tags">
          <el-tag
              v-for="tag in uploadForm.tags"
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
              class="tag-item">
            {{ tag }}
          </el-tag>
          <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInput"
              class="tag-input"
              size="small"
              @keyup.enter="handleAddTag"
              @blur="handleAddTag"
          />
          <el-button v-else class="button-new-tag" size="small" @click="showTagInput">
            + 新标签
          </el-button>
          <div class="el-upload__tip">最多添加5个标签</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading">发布视频</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Refresh, VideoPlay, Search, Picture, ArrowDown, Plus} from '@element-plus/icons-vue'
import videoApi from '../api/video'
import {saveVideo, uploadCover, uploadVideo} from "@/api/uploadVideo.js";

const showUploadDialog = ref(false)
const router = useRouter()

// 视频相关变量
const uploadFormRef = ref(null)
const tagInputRef = ref(null)
const uploading = ref(false)
const tagInputVisible = ref(false)
const tagInput = ref('')
const coverPreview = ref('')
const myVideoList = ref([])
const myVideoTotal = ref(0)

// 表单验证规则
const uploadRules = {
  title: [
    {required: true, message: '请输入视频标题', trigger: 'blur'},
    {min: 2, max: 50, message: '标题长度在2到50个字符之间', trigger: 'blur'}
  ],
  description: [
    {required: true, message: '请输入视频描述', trigger: 'blur'},
    {min: 5, max: 2000, message: '描述长度在5到2000个字符之间', trigger: 'blur'}
  ]
}

// 发布视频表单
const uploadForm = reactive({
  title: '',
  description: '',
  cover_url: '',
  videoFile: null,
  category: '',
  tags: []
})
// 加载状态
const loading = ref(false)

// 视频列表
const videos = ref([])

// 总数
const total = ref(0)

// 移除标签
const handleRemoveTag = (tag) => {
  uploadForm.tags = uploadForm.tags.filter(item => item !== tag)
}

// 处理文件数量超出限制
const handleExceed = () => {
  ElMessage.warning('只能上传一个视频文件')
}

// 处理文件移除前的确认
const handleBeforeRemove = () => {
  return ElMessageBox.confirm('确定移除已选择的视频文件?')
}

// 显示标签输入框
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}
// 添加标签
const handleAddTag = () => {
  const value = tagInput.value.trim()
  if (value) {
    if (uploadForm.tags.length >= 5) {
      ElMessage.warning('最多添加5个标签')
    } else if (uploadForm.tags.includes(value)) {
      ElMessage.warning('标签已存在')
    } else {
      uploadForm.tags.push(value)
    }
  }
  tagInputVisible.value = false
  tagInput.value = ''
}
// 处理封面图片上传
const handleCoverChange = (file) => {
  const isImage = file.raw.type.indexOf('image/') !== -1

  if (!isImage) {
    ElMessage.error('封面图片只能是图片格式!')
    return false
  }
  // 显示预览
  uploadForm.coverFile = file.raw
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    coverPreview.value = reader.result
  }
}

// 处理视频文件上传
const handleVideoChange = (file) => {

  uploadForm.videoFile = file.raw
}

// 重置上传表单
const resetUploadForm = () => {
  uploadFormRef.value && uploadFormRef.value.resetFields()
  uploadForm.title = ''
  uploadForm.description = ''
  uploadForm.coverUrl = ''
  uploadForm.videoFile = null
  uploadForm.category = ''
  uploadForm.tags = []
  coverPreview.value = ''
}
// 上传视频
const handleUpload = async () => {
  if (!uploadForm.videoFile) {
    ElMessage.error('请选择视频文件')
    return
  }

  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return

    uploading.value = true

    // 1. 上传视频文件
    const videoResponse = await uploadVideo(uploadForm.videoFile)

    if (!videoResponse.success) {
      ElMessage.error('视频上传失败: ' + videoResponse.message)
      uploading.value = false
      return
    }

    // 2. 上传封面图片
    let coverResponse = null
    if (uploadForm.coverFile) {
      coverResponse = await uploadCover(uploadForm.coverFile)

      if (!coverResponse.success) {
        ElMessage.error('封面上传失败: ' + coverResponse.message)
        uploading.value = false
        return
      }
    }

    // 3. 保存视频信息
    const videoData = {
      title: uploadForm.title,
      description: uploadForm.description,
      category: uploadForm.category,
      videoPath: videoResponse.data.relativePath,
      videoUrl: videoResponse.data.videoUrl,
      coverPath: coverResponse ? coverResponse.data.relativePath : null,
      coverUrl: coverResponse ? coverResponse.data.coverUrl : null,
      tags: uploadForm.tags.join(',')
    }

    const saveResponse = await saveVideo(videoData)

    if (!saveResponse.success) {
      ElMessage.error('视频信息保存失败: ' + saveResponse.message)
      uploading.value = false
      return
    }

    ElMessage.success('视频发布成功')
    showUploadDialog.value = false
    resetUploadForm()

    // 加载我的视频列表
    await loadMyVideos()
    uploading.value = false
    uploading.value = false
  })
}

// 查询参数
const query = reactive({
  page: 1,
  size: 10,
  keyword: '',
  status: ''
})

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectSubmitting = ref(false)
const rejectForm = reactive({
  id: null,
  reason: ''
})

// 获取视频列表
const fetchVideos = async () => {
  loading.value = true
  try {
    const response = await videoApi.getAllVideos({})
    videos.value = response.data.videos
    total.value = response.data.total
  } catch (error) {
    console.error('获取视频列表失败', error)
    ElMessage.error('获取视频列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  query.page = 1
  fetchVideos()
}

// 预览视频
const handlePreview = (id) => {
  router.push(`/video-detail/${id}`)
}

// 命令处理
const handleCommand = (command, row) => {
  switch (command) {
    case 'approve':
      handleApprove(row.id)
      break
    case 'reject':
      handleReject(row.id)
      break
    case 'enable':
      handleUpdateStatus(row.id, 1)
      break
    case 'disable':
      handleUpdateStatus(row.id, 3)
      break
    case 'delete':
      handleDelete(row.id)
      break
  }
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
    fetchVideos()
  } catch (error) {
    console.error('拒绝审核失败', error)
    ElMessage.error('拒绝审核失败')
  } finally {
    rejectSubmitting.value = false
  }
}


// 删除视频
const handleDelete = async (id) => {
  ElMessageBox.confirm('确认删除该视频? 删除后不可恢复!', '警告', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(async () => {
    try {
      await videoApi.deleteVideo(id)
      ElMessage.success('删除成功')
      await fetchVideos()
    } catch (error) {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 分页处理
const handleSizeChange = (size) => {
  query.size = size
  fetchVideos()
}

const handleCurrentChange = (page) => {
  query.page = page
  fetchVideos()
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


// 组件挂载后获取视频列表
onMounted(() => {
  fetchVideos()
})
</script>

<style scoped>
.videos-container {
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

.search-input {
  width: 250px;
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

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header .right {
    margin-top: 10px;
    flex-wrap: wrap;
  }
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.button-new-tag {
  margin-bottom: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.tag-input {
  width: 100px;
  margin-right: 10px;
  vertical-align: bottom;
}

.cover-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style> 