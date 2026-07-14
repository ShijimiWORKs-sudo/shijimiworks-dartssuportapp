import type {
  CommonContractEnvelope,
  CommonOutboxItem,
  ConsultHistory,
  FormPhotoAdviceResult,
  LocalAccount,
  PracticeFilterState,
  PracticeRecord,
  UserProfile,
} from '../../../types';
import { createUuidV4, isUuidV4 } from './accountService';

export type CommonExportPayload = {
  account: CommonAccountJson;
  profile: CommonProfileJson | null;
  practice_records: CommonPracticeRecordJson[];
  consult_histories: unknown[];
  form_photo_advice_results: unknown[];
  favorite_practice_menu_ids: string[];
  practice_filter_state: PracticeFilterState;
  common_outbox: CommonOutboxJson[];
};

export type CommonAccountJson = {
  schema_version: 1;
  account_id: string;
  user_name: string;
  display_name: string;
  email: string | null;
  account_status: LocalAccount['accountStatus'];
  auth_mode: LocalAccount['authMode'];
  cloud_auth_subject: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CommonProfileJson = {
  schema_version: 1;
  profile_id: string;
  account_id: string;
  player_type: 'owner';
  display_name: string;
  throwing_hand: 'right';
  main_machine: UserProfile['machineType'];
  rating_system_preference: 'dartsapp';
  self_reported_rating: number;
  avatar_uri: null;
  created_at: string;
  updated_at: string;
};

export type CommonPracticeRecordJson = {
  record_id: string;
  account_id: string;
  record_type: 'practice';
  game_type: string;
  machine_type: PracticeRecord['machineType'];
  played_at: string;
  score: number;
  bull_count: number;
  double_count: number;
  triple_count: number;
  cricket_marks: number;
  condition: PracticeRecord['condition'];
  memo: string;
  source_app: 'darts_support_app';
  source_record_id: string;
  created_at: string;
  updated_at: string;
};

export type CommonOutboxJson = {
  event_id: string;
  event_type: CommonOutboxItem['eventType'];
  event_version: 1;
  account_id: string;
  source_app: 'darts_support_app';
  source_record_id: string | null;
  occurred_at: string;
  created_at: string;
  sync_status: CommonOutboxItem['syncStatus'];
  payload: Record<string, unknown>;
};

export function toCommonAccountJson(account: LocalAccount): CommonAccountJson {
  return {
    schema_version: 1,
    account_id: account.accountId,
    user_name: account.userName,
    display_name: account.displayName,
    email: account.email,
    account_status: account.accountStatus,
    auth_mode: account.authMode,
    cloud_auth_subject: account.cloudAuthSubject,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
    deleted_at: account.deletedAt,
  };
}

export function toCommonProfileJson(
  profile: UserProfile | null,
  accountId: string,
  account: LocalAccount,
): CommonProfileJson | null {
  if (!profile) {
    return null;
  }

  return {
    schema_version: 1,
    profile_id: `${accountId}:owner`,
    account_id: accountId,
    player_type: 'owner',
    display_name: account.displayName,
    throwing_hand: 'right',
    main_machine: profile.machineType,
    rating_system_preference: 'dartsapp',
    self_reported_rating: profile.rating,
    avatar_uri: null,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

export function toCommonPracticeRecordJson(
  record: PracticeRecord,
  fallbackAccountId: string,
): CommonPracticeRecordJson {
  return {
    record_id: record.id,
    account_id: record.accountId ?? fallbackAccountId,
    record_type: 'practice',
    game_type: record.gameType === 'COUNT-UP' ? 'COUNT_UP' : record.gameType,
    machine_type: record.machineType,
    played_at: record.date,
    score: record.score,
    bull_count: record.bullCount,
    double_count: record.photoScore?.doubleCount ?? 0,
    triple_count: record.photoScore?.tripleCount ?? 0,
    cricket_marks: record.cricketMarks,
    condition: record.condition,
    memo: record.memo,
    source_app: 'darts_support_app',
    source_record_id: record.id,
    created_at: record.date,
    updated_at: record.date,
  };
}

export function toCommonOutboxJson(item: CommonOutboxItem): CommonOutboxJson {
  return {
    event_id: item.outboxId,
    event_type: item.eventType,
    event_version: item.eventVersion,
    account_id: item.accountId,
    source_app: 'darts_support_app',
    source_record_id: item.sourceRecordId,
    occurred_at: item.occurredAt,
    created_at: item.createdAt,
    sync_status: item.syncStatus,
    payload: sanitizeExportValue(item.payload) as Record<string, unknown>,
  };
}

export function createCommonExportEnvelope(input: {
  account: LocalAccount;
  profile: UserProfile | null;
  records: PracticeRecord[];
  consultHistories: ConsultHistory[];
  formPhotoAdviceResults: FormPhotoAdviceResult[];
  favoritePracticeMenuIds: string[];
  practiceFilterState: PracticeFilterState;
  commonOutbox: CommonOutboxItem[];
  appVersion: string;
}): CommonContractEnvelope<CommonExportPayload> {
  const payload: CommonExportPayload = {
    account: toCommonAccountJson(input.account),
    profile: toCommonProfileJson(input.profile, input.account.accountId, input.account),
    practice_records: input.records.map((record) =>
      toCommonPracticeRecordJson(record, input.account.accountId),
    ),
    consult_histories: sanitizeExportValue(input.consultHistories) as unknown[],
    form_photo_advice_results: sanitizeExportValue(input.formPhotoAdviceResults) as unknown[],
    favorite_practice_menu_ids: input.favoritePracticeMenuIds,
    practice_filter_state: input.practiceFilterState,
    common_outbox: input.commonOutbox.map(toCommonOutboxJson),
  };

  return {
    contractName: 'darts_common_data',
    contractVersion: 1,
    exportId: createUuidV4(),
    exportedAt: new Date().toISOString(),
    sourceApp: 'darts_support_app',
    sourceAppVersion: input.appVersion,
    accountId: input.account.accountId,
    payload,
  };
}

export function validateCommonImportEnvelope(value: unknown) {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { isValid: false, errors: ['JSONの形式が不正です。'], envelope: null };
  }

  if (value.contractName !== 'darts_common_data' && value.contract_name !== 'darts_common_data') {
    errors.push('contract_nameがdarts_common_dataではありません。');
  }

  const contractVersion = value.contractVersion ?? value.contract_version;

  if (contractVersion !== 1) {
    errors.push('未対応のcontract_versionです。');
  }

  const accountId = value.accountId ?? value.account_id;

  if (typeof accountId !== 'string' || !isUuidV4(accountId)) {
    errors.push('account_idがUUID v4形式ではありません。');
  }

  if (!isRecord(value.payload)) {
    errors.push('payloadがありません。');
  }

  if (isRecord(value.payload)) {
    if (!isRecord(value.payload.account)) {
      errors.push('payload.accountがありません。');
    }

    if (!Array.isArray(value.payload.practice_records)) {
      errors.push('payload.practice_recordsが配列ではありません。');
    }
  }

  const secretHits = findSecretKeys(value);

  if (secretHits.length > 0) {
    errors.push(`秘密情報を含む可能性があります: ${secretHits.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    envelope: errors.length === 0 ? value : null,
  };
}

export function sanitizeExportValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeExportValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isExcludedExportKey(key))
      .map(([key, item]) => [key, sanitizeExportValue(item)]),
  );
}

function findSecretKeys(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSecretKeys(item, `${path}[${index}]`));
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, item]) => {
    const currentPath = path ? `${path}.${key}` : key;
    return isSecretKey(key) ? [currentPath] : findSecretKeys(item, currentPath);
  });
}

function isExcludedExportKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === 'imageuri' ||
    normalized === 'image_uri' ||
    normalized.includes('pin') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('securestore') ||
    normalized.includes('hash')
  );
}

function isSecretKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized.includes('pin') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('securestore') ||
    normalized.includes('hash')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
