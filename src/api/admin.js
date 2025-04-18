import { get, post } from '../utils/request'

const adminApi = {
  /**
   * 管理员登录
   * @param {Object} data 登录参数 {username, password}
   * @returns {Promise} Promise对象
   */
  login(data) {
    return post('/admin/login', data)
  },

  /**
   * 获取当前管理员信息
   * @returns {Promise} Promise对象
   */
  getInfo() {
    return get('/admin/info')
  },

  /**
   * 退出登录
   * @returns {Promise} Promise对象
   */
  logout() {
    return post('/admin/logout')
  },

  /**
   * 获取统计数据
   * @returns {Promise} Promise对象
   */
  getStats() {
    return get('/admin/stats')
  },

  /**
   * 获取登录日志列表
   * @param {Object} params 查询参数
   * @returns {Promise} Promise对象
   */
  getLoginLogs(params) {
    return get('/admin/loginLogs', params)
  }
}

export default adminApi 