/**
 * 用户申请加群
 * 机器人是群管理员时，用户申请加群会触发此事件
 */
export type GROUP_JOIN_REQUEST_TYPE = {
  /**
   * 群 OpenID
   */
  group_openid: string;
  /**
   * 申请 ID，审批接口需要回传
   */
  join_request_id: string;
  /**
   * 安全提示语；可疑消息返回 warning_tips，普通消息命中安全规则时返回 top_tips
   */
  risk_tips?: string;
  /**
   * 用户在应用或开放平台下的统一标识，如有
   */
  union_openid?: string;
  /**
   * 申请人的 openid
   */
  member_openid: string;
  /**
   * 申请人昵称
   */
  username: string;
  /**
   * 申请时间戳，RFC3339 格式
   */
  apply_at: string;
  /**
   * self_apply 主动申请，invited 被邀请
   */
  apply_source: string;
  /**
   * 邀请人的 openid，仅 apply_source=invited 时生效
   */
  invited_by?: string;
  /**
   * 是否为机器人账号
   */
  bot: boolean;
  /**
   * 用户入群验证信息
   */
  verify_info?: {
    /**
     * 验证方式：verify_message 或 admin_review_qa
     */
    method: string;
    /**
     * 验证消息内容，仅 method=verify_message 时可能携带
     */
    verify_message?: string;
    /**
     * 管理员问答列表，仅 method=admin_review_qa 时可能携带
     */
    review_qa_list?: {
      /**
       * 管理员设置的问题
       */
      question: string;
      /**
       * 申请人填写的答案
       */
      answer: string;
    }[];
  };
  /**
   * 自动审批通过的扩展信息，仅自动通过事件携带
   */
  auto_approved?: {
    /**
     * 自动审批通过所命中的策略 ID
     */
    strategy_id: string;
  };
};
