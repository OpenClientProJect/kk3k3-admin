import request from "@/utils/request.js";

//获取全部评论
export function getComments() {
  return request.get("/admin/comment");
}


//更新评论
export function deleteComment(id, status) {
  return request.delete(`/admin/comment/${id}?status=${status}`);
}
