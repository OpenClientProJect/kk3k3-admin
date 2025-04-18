import { get, post, put, del } from '../utils/request'

const videoApi = {
  /**
   * 获取待审核视频列表
   * @param {Object} params 查询参数 {page, size}
   * @returns {Promise} Promise对象
   */
  getPendingVideos(params) {
    return get('/admin/video/pending', params)
  },

  /**
   * 审核视频
   * @param {Number} id 视频ID
   * @param {Object} data 审核参数 {status, rejectReason}
   * @returns {Promise} Promise对象
   */
  reviewVideo(id, data) {
    return put(`/admin/video/review/${id}`, data)
  },

  /**
   * 获取视频详情
   * @param {Number} id 视频ID
   * @returns {Promise} Promise对象
   */
  getVideoDetail(id) {
    return get(`/admin/video/detail/${id}`)
  },

  /**
   * 获取所有视频列表
   * @param {Object} params 查询参数 {page, size, status, keyword}
   * @returns {Promise} Promise对象
   */
  getAllVideos(params) {
    return get('/admin/video/list', params)
  },

  /**
   * 删除视频
   * @param {Number} id 视频ID
   * @returns {Promise} Promise对象
   */
  deleteVideo(id) {
    return del(`/admin/video/${id}`)
  }
}

export default videoApi 