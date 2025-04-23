import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://154.40.44.245:8080/api', // 基础URL
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('adminToken')
    if (token) {
      // 设置请求头Authorization
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 判断返回状态码
    if (res.code !== 200) {
      // 显示错误消息
      ElMessage.error(res.message || '系统错误')
      
      // 401: 未授权
      if (res.code === 401) {
        // 清除token
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminInfo')
        
        // 重定向到登录页
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '系统错误'))
    }
    return res
  },
  error => {
    console.error('响应错误:', error)
    
    // 处理HTTP状态码错误
    if (error.response) {
      const { status } = error.response
      let message = ''
      
      switch (status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除token
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminInfo')
          // 重定向到登录页
          router.push('/login')
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `连接错误 ${status}`
      }
      
      ElMessage.error(message)
    } else if (error.request) {
      // 请求已发送但未收到响应
      ElMessage.error('网络异常，服务器未响应')
    } else {
      // 请求配置错误
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

/**
 * 封装的GET请求
 * @param {string} url 请求URL
 * @param {object} params 请求参数
 * @param {object} config 额外配置
 * @returns {Promise} Promise对象
 */
export function get(url, params = {}, config = {}) {
  return service.get(url, {
    params,
    ...config
  })
}

/**
 * 封装的POST请求
 * @param {string} url 请求URL
 * @param {object} data 请求数据
 * @param {object} config 额外配置
 * @returns {Promise} Promise对象
 */
export function post(url, data = {}, config = {}) {
  return service.post(url, data, config)
}

/**
 * 封装的PUT请求
 * @param {string} url 请求URL
 * @param {object} data 请求数据
 * @param {object} config 额外配置
 * @returns {Promise} Promise对象
 */
export function put(url, data = {}, config = {}) {
  return service.put(url, data, config)
}

/**
 * 封装的DELETE请求
 * @param {string} url 请求URL
 * @param {object} params 请求参数
 * @param {object} config 额外配置
 * @returns {Promise} Promise对象
 */
export function del(url, params = {}, config = {}) {
  return service.delete(url, {
    params,
    ...config
  })
}

// 默认导出service
export default service 