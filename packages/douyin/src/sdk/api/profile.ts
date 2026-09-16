// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { desktopFingerprintParams } from '../im/index.js';
import type { DouyinHttp } from '../http/index.js';

export interface UserProfile {
  nickname?: string;
  avatar?: string;
}

/** secUid → 资料（IM user/info 接口结果） */
const profileCaches = new WeakMap<DouyinHttp, Map<string, UserProfile>>();

function getProfileCache(http: DouyinHttp): Map<string, UserProfile> {
  let cache = profileCaches.get(http);

  if (!cache) {
    cache = new Map();
    profileCaches.set(http, cache);
  }

  return cache;
}
/** uid → secUid 映射（群成员/历史消息/陌生人列表填充） */
const secUidCache = new Map<string, string>();
/** uid → 昵称/头像（资料查询回填） */
const nickCache = new Map<string, string>();
const avatarCache = new Map<string, string>();

/** 批量按 secUid 拉取资料（desktop IM user/info，对齐 douyin-im ImUserDirectory.resolve） */
export async function fetchUserProfiles(http: DouyinHttp, secUids: string[]): Promise<Map<string, UserProfile>> {
  const profileCache = getProfileCache(http);
  const result = new Map<string, UserProfile>();

  for (const id of new Set(secUids.filter(Boolean))) {
    const cached = profileCache.get(id);

    if (cached) {
      result.set(id, { ...cached });
    }
  }
  const missing = [...new Set(secUids.filter(Boolean))].filter(uid => !profileCache.has(uid));

  for (let offset = 0; offset < missing.length; offset += 50) {
    const batch = missing.slice(offset, offset + 50);

    try {
      const form = new FormData();

      form.append('sec_user_ids', JSON.stringify(batch));
      const params = desktopFingerprintParams(http.deviceId, http.guid);

      params.set('iid', http.installId);
      const res = await http.requestJson<{ status_code?: number; data?: unknown }>(`https://imdesktop.douyin.com/aweme/v1/web/im/user/info/?${params}`, {
        method: 'POST',
        body: form,
        headers: { Referer: 'https://imdesktop.douyin.com' }
      });

      if (Number(res.data?.status_code ?? -1) !== 0 || !Array.isArray(res.data?.data)) {
        continue;
      }
      for (const raw of res.data.data as Record<string, unknown>[]) {
        const secUid = typeof raw['sec_uid'] === 'string' ? raw['sec_uid'] : '';

        if (!secUid || !batch.includes(secUid)) {
          continue;
        }
        const nickname = typeof raw['nickname'] === 'string' ? raw['nickname'] : '';
        const thumb = raw['avatar_thumb'] as { url_list?: unknown } | undefined;
        const avatar = Array.isArray(thumb?.url_list) ? thumb.url_list.find((u): u is string => typeof u === 'string' && u !== '') : undefined;

        if (!nickname && !avatar) {
          continue;
        }
        const profile: UserProfile = { ...(nickname ? { nickname } : {}), ...(avatar ? { avatar } : {}) };

        profileCache.set(secUid, profile);
        result.set(secUid, profile);
      }
    } catch {
      /* 单批失败不缓存，避免污染其他 ID */
    }
  }

  return result;
}

/** 单个 secUid 资料（批量接口包装） */
export async function fetchUserProfile(http: DouyinHttp, secUid: string): Promise<UserProfile> {
  const profileCache = getProfileCache(http);
  const cached = profileCache.get(secUid);

  if (cached) {
    return cached;
  }
  const profiles = await fetchUserProfiles(http, [secUid]);

  return profiles.get(secUid) ?? {};
}

export function cacheSecUid(uid: string, secUid: string): void {
  if (uid && uid !== '0' && secUid) {
    secUidCache.set(uid, secUid);
  }
}

export function cachedSecUid(uid: string): string {
  return secUidCache.get(uid) ?? '';
}

export function cacheUserProfile(uid: string, profile: UserProfile): void {
  if (!uid || uid === '0') {
    return;
  }
  if (profile.nickname) {
    nickCache.set(uid, profile.nickname);
  }
  if (profile.avatar) {
    avatarCache.set(uid, profile.avatar);
  }
}

export function cachedNickname(uid: string): string {
  return nickCache.get(uid) ?? '';
}

export function cachedAvatar(uid: string): string {
  return avatarCache.get(uid) ?? '';
}
