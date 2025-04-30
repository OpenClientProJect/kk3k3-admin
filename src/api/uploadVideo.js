import request from '../utils/request'
/**
 * 保存视频信息
 * @param {Object} data - 视频信息，包含标题、描述、路径等
 * @returns {Promise} 响应结果
 */
export function saveVideo(data) {
    return request({
        url: '/admin/video/save',
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
        url: '/admin/video/cover',
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
        url: '/admin/video/upload',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        data: formData
    })
}

/**
 * 初始化分片上传
 * @param {Object} data - 初始化信息，包含文件名、文件大小、分片大小等
 * @returns {Promise} 响应结果
 */
export function initChunkUpload(data) {
    return request({
        url: '/admin/video/upload/init',
        method: 'post',
        data
    })
}

/**
 * 上传视频分片
 * @param {Object} data - 分片数据，包含分片索引、分片文件等
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise} 响应结果
 */
export function uploadChunk(data, onProgress) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
        formData.append(key, data[key])
    })

    return request({
        url: '/admin/video/upload/chunk',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        data: formData,
        onUploadProgress: onProgress
    })
}

/**
 * 合并视频分片
 * @param {Object} data - 合并信息，包含上传ID、文件名等
 * @returns {Promise} 响应结果
 */
export function mergeChunks(data) {
    return request({
        url: '/admin/video/upload/merge',
        method: 'post',
        data
    })
}

