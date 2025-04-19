import { get, post, put, del } from '../utils/request'

const videoApi = {

  /**
   * 获取所有视频列表
   * @returns {Promise} Promise对象
   */
  getAllVideos() {
    return get('/admin/video/list')
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