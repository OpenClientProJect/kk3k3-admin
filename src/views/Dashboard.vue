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
    
    <!-- 新增图表组件 -->
    <el-row :gutter="18" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>最近一周视频上传</h3>
          </div>
          <div class="chart-container" ref="videosChartRef"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>最近一周用户注册</h3>
          </div>
          <div class="chart-container" ref="usersChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, VideoCamera, Timer, User, View, Picture } from '@element-plus/icons-vue'
import adminApi from '../api/admin'
import * as echarts from 'echarts'

const router = useRouter()
const videosChartRef = ref(null)
const usersChartRef = ref(null)
let videosChart = null
let usersChart = null


// 统计数据
const stats = reactive({
  totalVideos: 0,
  totalUsers: 0,
  lastWeekVideos: [],
  lastWeekUsers: []
})

// 刷新数据
const refreshData = () => {
  fetchStats()
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await adminApi.getStats()
    Object.assign(stats, response.data)
    // 渲染图表
    initCharts()
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

// 初始化图表
const initCharts = () => {
  if (videosChartRef.value && stats.lastWeekVideos?.length) {
    // 创建视频图表
    if (!videosChart) {
      videosChart = echarts.init(videosChartRef.value)
    }
    
    const dates = stats.lastWeekVideos.map(item => item.date)
    const counts = stats.lastWeekVideos.map(item => item.count)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#909399'
          }
        },
        axisLabel: {
          color: '#606266'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#606266'
        },
        splitLine: {
          lineStyle: {
            color: '#EBEEF5'
          }
        }
      },
      series: [
        {
          data: counts,
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: {
            color: '#409EFF'
          },
          lineStyle: {
            width: 3,
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(64, 158, 255, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(64, 158, 255, 0.1)'
                }
              ]
            }
          }
        }
      ]
    }
    
    videosChart.setOption(option)
  }
  
  if (usersChartRef.value && stats.lastWeekUsers?.length) {
    // 创建用户图表
    if (!usersChart) {
      usersChart = echarts.init(usersChartRef.value)
    }
    
    const dates = stats.lastWeekUsers.map(item => item.date)
    const counts = stats.lastWeekUsers.map(item => item.count)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#909399'
          }
        },
        axisLabel: {
          color: '#606266'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#606266'
        },
        splitLine: {
          lineStyle: {
            color: '#EBEEF5'
          }
        }
      },
      series: [
        {
          data: counts,
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: {
            color: '#67C23A'
          },
          lineStyle: {
            width: 3,
            color: '#67C23A'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(103, 194, 58, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(103, 194, 58, 0.1)'
                }
              ]
            }
          }
        }
      ]
    }
    
    usersChart.setOption(option)
  }
}

// 窗口大小改变时重置图表大小
const handleResize = () => {
  if (videosChart) {
    videosChart.resize()
  }
  if (usersChart) {
    usersChart.resize()
  }
}

// 组件挂载后获取数据
onMounted(() => {
  fetchStats()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (videosChart) {
    videosChart.dispose()
  }
  if (usersChart) {
    usersChart.dispose()
  }
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

/* 图表样式 */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-card .card-header {
  margin-bottom: 15px;
}

.chart-card .card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
}

@media (max-width: 768px) {
  .stats-row .el-col {
    margin-bottom: 15px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style> 