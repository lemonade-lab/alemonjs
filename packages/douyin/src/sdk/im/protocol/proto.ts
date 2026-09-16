// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import protobuf from 'protobufjs';

/**
 * 抖音 IM 协议 schema（等价迁移自 douyin-im src/services/im/proto/im.proto）。
 * tsdown 打包单文件时独立 .proto 不会被携带，因此内联为字符串常量，
 * 用 protobuf.parse（keepCase=false，与 protobuf.load 默认行为一致）解析。
 */
export const IM_PROTO_SOURCE = `
syntax = "proto3";
package im;

message RequestEnvelope {
  int32 cmd = 1;
  int64 sequence_id = 2;
  string sdk_version = 3;
  string token = 4;
  int32 refer = 5;
  int32 inbox_type = 6;
  string build_number = 7;
  RequestPayload body = 8;
  string device_id = 9;
  string channel = 10;
  string device_platform = 11;
  string device_type = 12;
  string os_version = 13;
  string version_code = 14;
  map<string, string> headers = 15;
  int32 config_id = 16;
  TokenInfo token_info = 17;
  int32 auth_type = 18;
  string biz = 21;
  string access = 22;
  string ts_sign = 23;
  string sdk_cert = 24;
  string reuqest_sign = 25;
}

message TokenInfo {
  int32 mark_id = 1;
  int32 type = 2;
  int32 app_id = 3;
  int64 user_id = 4;
  int64 timestamp = 5;
}

message RequestPayload {
  SendMessageRequest send_message = 100;
  InboxRequest inbox = 203;
  ConversationMessagesRequest conversation_messages = 301;
  SendUserActionRequest send_user_action = 410;
  SendInputStatusRequest send_input_status = 411;
  DeleteConversationRequest delete_conversation = 603;
  // Native rawMarkConversationRead uses outer cmd 2002 but keeps body oneof tag 604.
  MarkConversationReadRequest mark_conversation_read = 604;
  ConversationParticipantsListRequest conversation_participants = 605;
  GetConversationInfoV2Request get_conversation_info_v2 = 608;
  CreateConversationV2Request create_conversation_v2 = 609;
  GetConversationInfoListV2Request get_conversation_info_list_v2 = 610;
  DissolveConversationRequest dissolve_conversation = 614;
  ConversationAddParticipantsRequest conversation_add_participants = 650;
  ConversationRemoveParticipantsRequest conversation_remove_participants = 651;
  ConversationLeaveRequest leave_conversation = 652;
  ConversationSetRoleRequest conversation_set_role = 653;
  DeleteMessageRequest delete_message = 701;
  RecallMessageRequest recall_message = 702;
  ModifyMessagePropertyRequest modify_message_property = 705;
  SetConversationCoreInfoRequest set_conversation_core_info = 902;
  GetConversationSettingInfoRequest get_conversation_setting_info = 920;
  SetConversationSettingInfoRequest set_conversation_setting_info = 921;
  ConversationListRequest conversation_list = 2006;
  AckConversationApplyRequest ack_conversation_apply = 2025;
  GetConversationAuditListRequest get_conversation_audit_list = 2027;
  GetFriendReceiveApplyListRequest get_friend_receive_apply_list = 20481;
  ReplyFriendApplyRequest reply_friend_apply = 2049;
  GetRecentStrangerMessageReqBody get_recent_stranger_message = 2047;
}

message GetConversationInfoV2Request {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
}

message GetConversationInfoListV2Request {
  repeated GetConversationInfoV2Request conversation_info_list = 1;
}

message GetConversationInfoV2Response {
  ConversationV2 conversation_info = 1;
}

message GetConversationInfoListV2Response {
  repeated ConversationV2 conversation_info_list = 1;
}

message SendUserActionRequest {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 conversation_short_id = 3;
  int32 action_type = 4;
  map<string, string> extra = 5;
}

message SendInputStatusRequest {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 conversation_short_id = 3;
  int32 status = 4;
  map<string, string> extra = 5;
}

message DissolveConversationRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
}

message ModifyPropertyContent {
  int32 operation = 1;
  string key = 2;
  string value = 3;
  string idempotent_id = 4;
}

message ModifyPropertyBody {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 conversation_short_id = 3;
  int64 server_message_id = 4;
  string client_message_id = 5;
  repeated ModifyPropertyContent modify_property_content = 6;
}

message ModifyMessagePropertyRequest {
  repeated ModifyPropertyBody property_list = 1;
  string ticket = 2;
}

message GetFriendReceiveApplyListRequest {
  int64 cursor = 1;
  int64 limit = 2;
  bool get_total_count = 3;
  int32 status = 4;
}

message ReplyFriendApplyRequest {
  repeated int64 user_id = 1;
  int32 attitude = 2;
  map<string, string> ext = 3;
}

message CreateConversationV2Request {
  int32 conversation_type = 1;
  repeated int64 participants = 2;
  bool persistent = 3;
  string idempotent_id = 4;
  string name = 6;
  string avatar_url = 7;
  string description = 8;
  map<string, string> biz_ext = 11;
}

message ConversationAddress {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
}

message DeleteConversationRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 last_message_index = 4;
  int64 last_message_index_v2 = 5;
  int32 badge_count = 6;
}

message MarkConversationReadRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 read_message_index = 4;
  int64 conv_unread_count = 5;
  int64 total_unread_count = 6;
  int64 read_message_index_v2 = 7;
  int32 read_badge_count = 8;
  string ticket = 9;
  int64 server_message_id = 10;
}

message ConversationAddParticipantsRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  repeated int64 participants = 4;
  map<string, string> biz_ext = 5;
}

message ConversationParticipantsListRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 cursor = 4;
  int32 limit = 5;
}

message ConversationSetRoleRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  map<int64, int32> roles = 4;
}

message ConversationRemoveParticipantsRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  repeated int64 participants = 4;
  map<string, string> biz_ext = 5;
}

message ConversationLeaveRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
}

message DeleteMessageRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 message_id = 4;
}

message SetConversationCoreInfoRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  string name = 4;
  string desc = 5;
  string icon = 6;
  string notice = 7;
  bool is_name_set = 8;
  bool is_desc_set = 9;
  bool is_icon_set = 10;
  bool is_notice_set = 11;
  map<string, string> ext = 12;
}

message SetConversationSettingInfoRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  bool set_stick_on_top = 4;
  bool set_mute = 5;
  bool set_favorite = 6;
}

message GetConversationSettingInfoRequest {
  int64 conversation_short_id = 2;
}

message ConversationListRequest {
  int32 list_type = 1;
  int64 cursor = 2;
  int32 sort_type = 3;
  int32 limit = 4;
}

message AckConversationApplyRequest {
  int64 apply_id = 1;
  int32 apply_status = 2;
  map<string, string> biz_ext = 3;
}

message GetConversationAuditListRequest {
  int64 cursor = 1;
  int32 limit = 2;
  int64 conv_short_id = 3;
  bool no_clear_unread = 4;
}

message RecallMessageRequest {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 server_message_id = 4;
}

message InboxRequest {
  int64 cursor = 1;
  int32 new_user = 2;
  int32 init_sub_type = 3;
  int32 conv_limit = 4;
  int32 msg_limit = 5;
}

message SendMessageRequest {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 conversation_short_id = 3;
  string content = 4;
  map<string, string> ext = 5;
  int32 message_type = 6;
  string ticket = 7;
  string client_message_id = 8;
  repeated int64 mentioned_users = 9;
  ReferencedMessageInfo ref_msg_info = 11;
}

message ReferencedMessageInfo {
  int64 referenced_message_id = 1;
  string hint = 2;
  int64 root_message_id = 3;
  int64 root_message_conv_index = 4;
}

message ConversationMessagesRequest {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 conversation_short_id = 3;
  int32 direction = 4;
  int64 anchor_index = 5;
  int32 limit = 6;
}

message ResponseEnvelope {
  int32 cmd = 1;
  int64 sequence_id = 2;
  int32 status_code = 3;
  string error_desc = 4;
  int32 inbox_type = 5;
  ResponsePayload body = 6;
  string log_id = 7;
  map<string, string> headers = 8;
  int64 start_time_stamp = 9;
  int64 request_arrived_time = 10;
  int64 server_execution_end_time = 11;
  int64 user_id = 13;
}

message Frame {
  uint64 seqid = 1;
  uint64 logid = 2;
  int32 service = 3;
  int32 method = 4;
  repeated FrameHeaderEntry headers = 5;
  string payload_encoding = 6;
  string payload_type = 7;
  bytes payload = 8;
}

message FrameHeaderEntry {
  string key = 1;
  string value = 2;
}

message ResponsePayload {
  SendMessageResponse send_message = 100;
  InboxResponse inbox = 203;
  ConversationMessagesResponse conversation_messages = 301;
  NewMessageNotify has_new_message_notify = 500;
  MarkConversationReadNotify has_mark_read_notify = 501;
  ConversationInfoUpdatedNotify has_conversation_info_updated_notify = 502;
  NewP2PMessageNotify has_new_p2p_message_notify = 504;
  NewFriendMessageNotify new_friend_message_notify = 507;
  ConversationParticipantsListResponse conversation_participants = 605;
  GetConversationInfoV2Response get_conversation_info_v2 = 608;
  CreateConversationV2Response create_conversation_v2 = 609;
  GetConversationInfoListV2Response get_conversation_info_list_v2 = 610;
  EmptyActionResponse dissolve_conversation = 614;
  ConversationAddParticipantsResponse conversation_add_participants = 650;
  ConversationRemoveParticipantsResponse conversation_remove_participants = 651;
  ConversationSetRoleResponse conversation_set_role = 653;
  RecallMessageResponse recall_message = 702;
  ModifyMessagePropertyResponse modify_message_property = 705;
  SetConversationCoreInfoResponse set_conversation_core_info = 902;
  GetConversationSettingInfoResponse get_conversation_setting_info = 920;
  SetConversationSettingInfoResponse set_conversation_setting_info = 921;
  ConversationListResponse conversation_list = 2006;
  AckConversationApplyResponse ack_conversation_apply = 2025;
  GetConversationAuditListResponse get_conversation_audit_list = 2027;
  GetFriendReceiveApplyListResponse get_friend_receive_apply_list = 20481;
  EmptyActionResponse reply_friend_apply = 2049;
  GetRecentStrangerMessageRespBody get_recent_stranger_message = 2047;
}

message GetRecentStrangerMessageReqBody {
  int64 latest_stranger_version = 1;
  int64 earliest_stranger_version = 2;
  string source = 3;
  int32 new_user = 4;
  map<string, string> ext = 5;
  string biz_info = 6;
}

message ConversationRecentMessage {
  int64 conversation_short_id = 1;
  repeated ConversationMessage messages = 2;
  int64 version = 3;
  int32 badge_count = 4;
  string conversation_id = 5;
  repeated ConversationMessage ext_messages = 6;
}

message GetRecentStrangerMessageRespBody {
  int64 next_stranger_version = 1;
  repeated ConversationRecentMessage messages = 2;
  bool has_more = 3;
}

message EmptyActionResponse {}

message ModifyMessagePropertyResponse {
  int32 status = 1;
  int64 version = 2;
}

message Profile {
  string nick_name = 1;
  string protrait = 2;
  string basic_ext_info = 3;
  string detail_ext_info = 4;
  int64 uid = 5;
}

message ApplyUserInfo {
  int64 user_id = 1;
  int64 apply_time_second = 2;
  map<string, string> ext = 3;
  int32 status = 4;
  Profile profile = 5;
}

message GetFriendReceiveApplyListResponse {
  int64 next_cursor = 1;
  bool has_more = 2;
  repeated ApplyUserInfo user_list = 3;
  int64 total_count = 4;
}

message NewFriendMessageNotify {
  int32 message_type = 1;
  int64 from_id = 2;
  int64 to_id = 3;
  string content = 4;
  map<string, string> ext = 5;
}

message CreateConversationV2Response {
  ConversationV2 conversation = 1;
  int64 check_code = 2;
  string check_message = 3;
  string extra_info = 4;
  int32 status = 5;
}

message ConversationApplyInfo {
  int64 user_id = 1;
  int64 conv_short_id = 2;
  int32 conversation_type = 3;
  int32 apply_status = 4;
  int64 apply_id = 5;
  int64 create_time = 6;
  int64 modify_time = 7;
  int64 modify_user = 8;
  string sec_uid = 9;
  int64 invite_user_id = 10;
  string sec_invite_uid = 11;
  map<string, string> ext = 12;
  string apply_reason = 13;
}

message AckConversationApplyResponse {
  ConversationApplyInfo apply_info = 1;
  int32 status = 2;
  int64 check_code = 3;
  string check_message = 4;
}

message GetConversationAuditListResponse {
  repeated ConversationApplyInfo apply_info_list = 1;
  int64 next_cursor = 2;
  bool has_more = 3;
}

message ConversationAddParticipantsResponse {
  repeated int64 success_participants = 1;
  repeated int64 failed_participants = 2;
  int32 status = 3;
  string extra_info = 4;
  int64 check_code = 5;
  string check_message = 6;
  repeated SecUidPair sec_success_participants = 7;
  repeated SecUidPair sec_failed_participants = 8;
}

message SecUidPair {
  int64 uid = 1;
  string sec_uid = 2;
}

message ConversationParticipant {
  int64 user_id = 1;
  int64 sort_order = 2;
  int32 role = 3;
  string alias = 4;
  string sec_uid = 5;
  int32 blocked = 6;
  int64 left_block_time = 7;
  map<string, string> ext = 8;
}

message ConversationParticipantsPage {
  repeated ConversationParticipant participants = 1;
  bool has_more = 2;
  int64 cursor = 3;
}

message ConversationParticipantsListResponse {
  ConversationParticipantsPage participants_page = 1;
}

message ConversationSetRoleResponse {
  repeated int64 success_participants = 1;
  repeated int64 failed_participants = 2;
  int32 status = 3;
  string extra_info = 4;
  int64 check_code = 5;
  string check_message = 6;
}

message ConversationRemoveParticipantsResponse {
  repeated int64 failed_participants = 1;
  int32 status = 2;
  string extra_info = 3;
  int64 check_code = 4;
  string check_message = 5;
}

message SetConversationCoreInfoResponse {
  int32 status = 2;
  string extra_info = 3;
  int64 check_code = 4;
  string check_message = 5;
}

message SetConversationSettingInfoResponse {
  int32 status = 2;
  int64 check_code = 3;
  string check_message = 4;
  string extra_info = 5;
}

message GetConversationSettingInfoResponse {
  ConversationSettingInfo conversation_setting_info = 1;
  int32 status = 2;
  int64 check_code = 3;
  string check_message = 4;
  string extra_info = 5;
}

message ConversationSettingInfo {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int32 mute = 6;
  int32 stick_on_top = 7;
  int32 inbox_type = 8;
  int32 favorite = 11;
}

message ConversationListResponse {
  repeated Conversation conversations = 1;
}

message RecallMessageResponse {
  int32 status = 1;
}

message NewMessageNotify {
  reserved 1;
  string conversation_id = 2;
  int32 conversation_type = 3;
  int32 notify_type = 4;
  ConversationMessage message = 5;
}

message NewP2PMessageNotify {
  reserved 1;
  string conversation_id = 2;
  int32 conversation_type = 3;
  ConversationMessage message = 4;
}

message MarkConversationReadNotify {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 read_message_index = 3;
  int64 read_message_index_v2 = 4;
}

message ConversationInfoUpdatedNotify {
  Conversation conversation = 1;
}

message InboxResponse {
  repeated ConversationMessage messages = 1;
  repeated Conversation conversations = 2;
  int64 next_cursor = 3;
  int32 inbox_unread_count = 4;
  int32 has_more = 5;
  int32 filter_type = 6;
  int32 total_count = 7;
  int64 min_cursor = 8;
  int64 max_cursor = 9;
}

message ConversationV2 {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  string ticket = 4;
  ConversationParticipantsPage first_page_participants = 6;
  int32 participants_count = 7;
  bool is_participant = 8;
  int32 inbox_type = 9;
  int32 badge_count = 10;
  ConversationCoreInfo conversation_core_info = 50;
}

message ConversationCoreInfo {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 info_version = 4;
  string name = 5;
  string desc = 6;
  string icon = 7;
  int32 inbox_type = 8;
  string notice = 9;
  map<string, string> ext = 11;
  int64 owner = 12;
  string sec_owner = 13;
  int64 creator_uid = 17;
  int64 create_time = 18;
}

message Conversation {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  string ticket = 4;
  int32 inbox_type = 5;
  ConversationMembers members = 6;
  int64 min_index = 10;
  int64 max_index = 11;
  int64 unread_count = 15;
  ConversationLastSender last_sender = 20;
  ConversationExtInfo ext_info = 50;
  ConversationUserSetting user_setting = 51;
}

message ConversationMembers {
  repeated ConversationMember members = 1;
}

message ConversationMember {
  int64 uid = 1;
  int32 role = 3;
  string sec_uid = 5;
}

message ConversationLastSender {
  int64 sender_uid = 1;
  int32 status = 3;
  string nickname = 4;
  string sec_uid = 5;
}

message ConversationExtInfo {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 last_active_time = 4;
  string name = 5;
  string avatar = 7;
  int64 owner_uid = 12;
  string owner_sec_uid = 13;
  int64 create_time = 18;
}

message ConversationUserSetting {
  string conversation_id = 1;
  int64 conversation_short_id = 2;
  int32 conversation_type = 3;
  int64 last_msg_time = 10;
}

message SendMessageResponse {
  int64 server_message_id = 1;
  string extra_info = 2;
  int32 status = 3;
  string client_message_id = 4;
  int64 check_code = 5;
  string check_message = 6;
}

message ConversationMessagesResponse {
  repeated ConversationMessage messages = 1;
  int64 next_cursor = 2;
  bool has_more = 3;
}

message ConversationMessage {
  string conversation_id = 1;
  int32 conversation_type = 2;
  int64 server_message_id = 3;
  int64 index_in_conversation = 4;
  int64 conversation_short_id = 5;
  int32 message_type = 6;
  int64 sender = 7;
  string content = 8;
  map<string, string> ext = 9;
  int64 create_time = 10;
  int64 version = 11;
  int32 status = 12;
  int64 order_in_conversation = 13;
  string sec_sender = 14;
  int64 index_in_conversation_v2 = 17;
}
`;

let rootPromise: Promise<any> | undefined;

/** 解析内联 proto（keepCase=false，与参考项目 protobuf.load 行为一致），进程内缓存 */
export function loadRoot(): Promise<any> {
  rootPromise ??= new Promise((resolve, reject) => {
    try {
      resolve(protobuf.parse(IM_PROTO_SOURCE, { keepCase: false }).root);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });

  return rootPromise;
}
