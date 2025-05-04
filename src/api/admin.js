import { get, post } from '../utils/request'
import {request} from "axios";

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

}

// 评论管理相关API
export function getCommentList(params) {
  return request({
    url: '/api/admin/comments',
    method: 'get',
    params
  })
}

export function deleteComment(commentId) {
  return request({
    url: `/api/admin/comments/${commentId}`,
    method: 'delete'
  })
}

export function restoreComment(commentId) {
  return request({
    url: `/api/admin/comments/${commentId}/restore`,
    method: 'put'
  })
}

export function getCommentDetail(commentId) {
  return request({
    url: `/api/admin//comment/list`,
    method: 'get'
  })
}

export default adminApi 