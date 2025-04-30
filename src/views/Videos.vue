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
        <el-table-column label="操作" width="270" align="center">
          <template #default="scope">
            <el-button size="small" type="success" @click="handleAddEpisode(scope.row)">添加剧集</el-button>
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
        
        <!-- 上传进度条 -->
        <el-form-item v-if="uploading && uploadProgress > 0" label="上传进度">
          <el-progress :percentage="uploadProgress" :format="percentFormat" />
          <div class="upload-status">{{ uploadedChunks.value }}/{{ totalChunks.value }} 分片已上传</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading">发布视频</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
        v-model="showEpisodeDialog"
        title="添加剧集"
        width="650px"
        :destroy-on-close="true"
        :close-on-click-modal="false"
    >
      <el-form ref="episodeFormRef" :model="episodeForm" :rules="episodeRules" label-width="100px">
        <el-form-item label="剧集标题" prop="episodesTitle">
          <el-input v-model="episodeForm.episodesTitle" placeholder="请输入剧集标题"/>
        </el-form-item>

        <el-form-item label="剧集图片" prop="episodesImage">
          <el-upload
              class="cover-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleEpisodeImageChange">
            <img v-if="episodeImagePreview" :src="episodeImagePreview" class="cover-preview"/>
            <el-icon v-else class="cover-uploader-icon">
              <Plus/>
            </el-icon>
          </el-upload>
          <div class="el-upload__tip">
            点击上传剧集图片，支持jpg、png格式
          </div>
        </el-form-item>

        <el-form-item label="剧集视频" prop="episodesVideo">
          <el-upload
              class="video-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              :on-change="handleEpisodeVideoChange"
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
        
        <!-- 上传进度条 -->
        <el-form-item v-if="episodeUploading && uploadProgress > 0" label="上传进度">
          <el-progress :percentage="uploadProgress" :format="percentFormat" />
          <div class="upload-status">{{ uploadedChunks.value }}/{{ totalChunks.value }} 视频已上传</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEpisodeDialog = false">取消</el-button>
          <el-button type="primary" @click="handleEpisodeUpload" :loading="episodeUploading">添加剧集</el-button>
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
import {saveVideo, uploadCover, uploadVideo, initChunkUpload, uploadChunk, mergeChunks} from "@/api/uploadVideo.js";

const showUploadDialog = ref(false)
const showEpisodeDialog = ref(false)
const router = useRouter()

// 剧集相关变量
const episodeForm = reactive({
  videoId: null,
  episodesTitle: '',
  episodesImage: '',
  episodesVideo: '',
  episodeFile: null,
  imageFile: null
})
const episodeFormRef = ref(null)
const episodeImagePreview = ref('')
const episodeUploading = ref(false)

// 视频相关变量
const uploadFormRef = ref(null)
const tagInputRef = ref(null)
const uploading = ref(false)
const tagInputVisible = ref(false)
const tagInput = ref('')
const coverPreview = ref('')
const myVideoList = ref([])
const myVideoTotal = ref(0)
const uploadProgress = ref(0)
const chunkSize = 5 * 1024 * 1024 // 5MB 分片大小
const totalChunks = ref(0)
const uploadedChunks = ref(0)

// 格式化上传进度百分比
const percentFormat = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

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

// 剧集表单验证规则
const episodeRules = {
  episodesTitle: [
    {required: true, message: '请输入剧集标题', trigger: 'blur'},
    {min: 2, max: 50, message: '剧集标题长度在2到50个字符之间', trigger: 'blur'}
  ],
  episodesVideo: [
    {required: true, message: '请上传剧集视频', trigger: 'change'}
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
  const isLt2M = file.raw.size / 1024 / 1024 < 20

  if (!isImage) {
    ElMessage.error('封面图片只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 20MB!')
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
  const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(file.name)
  const isLtLimit = file.raw.size / 1024 / 1024 < 1000 // 限制最大1GB

  if (!isVideo) {
    ElMessage.error('请上传正确的视频格式!')
    return false
  }
  if (!isLtLimit) {
    ElMessage.error('视频大小不能超过 1GB!')
    return false
  }

  uploadForm.videoFile = file.raw
  // 计算所需的分片数量
  totalChunks.value = Math.ceil(file.raw.size / chunkSize)
}

// 上传单个分片
const uploadSingleChunk = async (chunk, index, uploadId, fileName) => {
  const formData = {
    chunk: chunk,
    index: index,
    uploadId: uploadId,
    fileName: fileName
  }
  
  try {
    await uploadChunk(formData, (progressEvent) => {
      // 单个分片的上传进度处理
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      console.log(`分片 ${index + 1}/${totalChunks.value} 上传进度: ${percentCompleted}%`)
    })
    
    uploadedChunks.value++
    uploadProgress.value = Math.floor((uploadedChunks.value / totalChunks.value) * 100)
    
    return true
  } catch (error) {
    console.error(`分片 ${index} 上传失败:`, error)
    return false
  }
}

// 上传视频（分片处理）
const uploadVideoWithChunks = async (file) => {
  if (!file) return null
  
  // 判断是否需要分片上传
  if (file.size <= 50 * 1024 * 1024) {
    // 小于50MB，使用普通上传
    return await uploadVideo(file)
  }
  
  try {
    // 初始化分片上传
    const initResponse = await initChunkUpload({
      fileName: file.name,
      fileSize: file.size,
      chunkSize: chunkSize,
      totalChunks: totalChunks.value
    })
    
    if (!initResponse.success) {
      ElMessage.error('初始化分片上传失败: ' + initResponse.message)
      return null
    }
    
    const uploadId = initResponse.data.uploadId
    uploadedChunks.value = 0
    uploadProgress.value = 0
    
    // 创建分片并上传
    const chunks = []
    for (let i = 0; i < totalChunks.value; i++) {
      const start = i * chunkSize
      const end = Math.min(file.size, start + chunkSize)
      chunks.push(file.slice(start, end))
    }
    
    // 并发上传分片，限制并发数为3
    const concurrencyLimit = 3
    const results = []
    
    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const chunkPromises = chunks
        .slice(i, i + concurrencyLimit)
        .map((chunk, index) => uploadSingleChunk(chunk, i + index, uploadId, file.name))
      
      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
      
      // 如果有分片上传失败，中断上传
      if (chunkResults.includes(false)) {
        ElMessage.error('视频上传失败，请重试')
        return null
      }
    }
    
    // 合并分片
    const mergeResponse = await mergeChunks({
      uploadId: uploadId,
      fileName: file.name,
      totalChunks: totalChunks.value
    })
    
    if (!mergeResponse.success) {
      ElMessage.error('合并视频分片失败: ' + mergeResponse.message)
      return null
    }
    
    uploadProgress.value = 100
    return mergeResponse
    
  } catch (error) {
    console.error('分片上传失败:', error)
    ElMessage.error('视频上传失败，请稍后重试')
    return null
  }
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
// 上传内容
const handleUpload = async () => {
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      uploading.value = true
      uploadProgress.value = 0

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

      // 3. 上传视频文件（如果有）
      let videoResponse = null
      if (uploadForm.videoFile) {
        // 使用分片上传处理大文件
        videoResponse = await uploadVideoWithChunks(uploadForm.videoFile)

        if (!videoResponse || !videoResponse.success) {
          ElMessage.error('视频上传失败')
          uploading.value = false
          return
        }
      }

      // 4. 保存视频信息
      const videoData = {
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        coverPath: coverResponse ? coverResponse.data.relativePath : null,
        coverUrl: coverResponse ? coverResponse.data.coverUrl : null,
        videoPath: videoResponse ? videoResponse.data.relativePath : null,
        videoUrl: videoResponse ? videoResponse.data.videoUrl : null,
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

      // 刷新视频列表
      fetchVideos()
      
    } catch (error) {
      console.error('视频上传失败:', error)
      ElMessage.error('视频上传失败，请稍后重试')
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
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
    const response = await videoApi.getAllVideos({
      page: query.page,
      size: query.size,
      keyword: query.keyword,
      status: query.status
    })
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
    case 'delete':
      handleDelete(row.id)
      break
  }
}

// 打开添加剧集对话框
const handleAddEpisode = (row) => {
  episodeForm.videoId = row.id
  showEpisodeDialog.value = true
}

// 处理剧集图片上传
const handleEpisodeImageChange = (file) => {
  const isImage = file.raw.type.indexOf('image/') !== -1
  const isLt2M = file.raw.size / 1024 / 1024 < 20

  if (!isImage) {
    ElMessage.error('剧集图片只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('剧集图片大小不能超过 20MB!')
    return false
  }

  // 显示预览
  episodeForm.imageFile = file.raw
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    episodeImagePreview.value = reader.result
  }
}

// 处理剧集视频上传
const handleEpisodeVideoChange = (file) => {
  const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(file.name)
  const isLtLimit = file.raw.size / 1024 / 1024 < 1000 // 限制最大1GB

  if (!isVideo) {
    ElMessage.error('请上传正确的视频格式!')
    return false
  }
  if (!isLtLimit) {
    ElMessage.error('视频大小不能超过 1GB!')
    return false
  }

  episodeForm.episodeFile = file.raw
  episodeForm.episodesVideo = file.name
  // 计算所需的分片数量
  totalChunks.value = Math.ceil(file.raw.size / chunkSize)
}

// 上传剧集
const handleEpisodeUpload = async () => {
  await episodeFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      episodeUploading.value = true
      uploadProgress.value = 0

      // 上传剧集图片
      let imageResponse = null
      if (episodeForm.imageFile) {
        imageResponse = await uploadCover(episodeForm.imageFile)

        if (!imageResponse.success) {
          ElMessage.error('图片上传失败: ' + imageResponse.message)
          episodeUploading.value = false
          return
        }
      }

      // 上传剧集视频（使用分片上传）
      const videoResponse = await uploadVideoWithChunks(episodeForm.episodeFile)

      if (!videoResponse || !videoResponse.success) {
        ElMessage.error('视频上传失败')
        episodeUploading.value = false
        return
      }

      // 保存剧集信息
      const episodeData = {
        videoId: episodeForm.videoId,
        episodesTitle: episodeForm.episodesTitle,
        episodesImage: imageResponse ? imageResponse.data.coverUrl : null,
        episodesVideo: videoResponse.data.videoUrl
      }

      // 调用API保存剧集信息
      const saveResponse = await videoApi.addEpisode(episodeData)

      if (!saveResponse.success) {
        ElMessage.error('剧集信息保存失败: ' + saveResponse.message)
        episodeUploading.value = false
        return
      }

      ElMessage.success('剧集添加成功')
      showEpisodeDialog.value = false
      resetEpisodeForm()
      
    } catch (error) {
      console.error('剧集上传失败:', error)
      ElMessage.error('剧集上传失败，请稍后重试')
    } finally {
      episodeUploading.value = false
      uploadProgress.value = 0
    }
  })
}

// 重置剧集表单
const resetEpisodeForm = () => {
  episodeFormRef.value && episodeFormRef.value.resetFields()
  episodeForm.episodesTitle = ''
  episodeForm.episodesImage = ''
  episodeForm.episodesVideo = ''
  episodeForm.episodeFile = null
  episodeForm.imageFile = null
  episodeImagePreview.value = ''
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