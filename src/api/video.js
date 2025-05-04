import request from '../utils/request'

/**
 * 获取所有视频
 * @param {Object} params - 查询参数
 * @returns {Promise} 响应结果
 */
function getAllVideos(params) {
    return request({
        url: '/admin/video/list',
        method: 'get',
        params
    })
}

/**
 * 获取视频详情
 * @param {Number} id - 视频ID
 * @returns {Promise} 响应结果
 */
function getVideoDetail(id) {
    return request({
        url: `/admin/video/detail/${id}`,
        method: 'get'
    })
}

/**
 * 删除视频
 * @param {Number} id - 视频ID
 * @returns {Promise} 响应结果
 */
function deleteVideo(id) {
    return request({
        url: `/admin/video/${id}`,
        method: 'delete'
    })
}

/**
 * 添加剧集
 * @param {Object} data - 剧集数据
 * @returns {Promise} 响应结果
 */
function addEpisode(data) {
    return request({
        url: '/admin/video/episode/add',
        method: 'post',
        data
    })
}

export default {
    getAllVideos,
    getVideoDetail,
    deleteVideo,
    addEpisode
} 