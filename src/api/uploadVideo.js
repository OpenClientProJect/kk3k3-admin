import request from '../utils/request'
/**
 * 保存视频信息
 * @param {Object} data - 视频信息，包含标题、描述、路径等
 * @returns {Promise} 响应结果
 */
export function saveVideo(data) {
    return request({
        url: '/api/admin/video/save',
        method: 'post',
        data
    })
}

/**
 * 上传视频封面
 * @param {File} file - 封面图片文件
 * @returns {Promise} 响应结果
 */
export function uploadCover(file) {
    const formData = new FormData()
    formData.append('file', file)

    return request({
        url: '/api/admin/video/cover',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        data: formData
    })
}

/**
 * 上传视频文件
 * @param {File} file - 视频文件
 * @returns {Promise} 响应结果
 */
export function uploadVideo(file) {
    const formData = new FormData()
    formData.append('file', file)

    return request({
        url: '/api/admin/video/upload',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        data: formData
    })
}
