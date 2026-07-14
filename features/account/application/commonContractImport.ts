import type { LocalAccount, PracticeRecord, UserProfile } from '../../../types';
import { isUuidV4 } from './accountService';
import { validateCommonImportEnvelope } from './commonContractMapper';

export type CommonImportPreview = {
  accountId: string;
  accountDisplayName: string;
  practiceRecordCount: number;
  consultHistoryCount: number;
  formPhotoAdviceResultCount: number;
  isDifferentAccount: boolean;
};

export type CommonImportApplyResult = {
  accountAdded: boolean;
  recordAddedCount: number;
  skippedRecordCount: number;
  conflictRecordCount: number;
};

export function parseCommonImportJson(jsonText: string, currentAccountId: string | null) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(jsonText);
  } catch {
    return {
      isValid: false,
      errors: ['JSONを読み取れませんでした。'],
      envelope: null,
      preview: null,
    };
  }

  const validation = validateCommonImportEnvelope(parsedValue);

  if (!validation.isValid || !validation.envelope) {
    return { isValid: false, errors: validation.errors, envelope: null, preview: null };
  }

  const envelope = validation.envelope as Record<string, unknown>;
  const payload = envelope.payload as Record<string, unknown>;
  const account = payload.account as Record<string, unknown>;
  const accountId = String(envelope.accountId ?? envelope.account_id);

  return {
    isValid: true,
    errors: [],
    envelope,
    preview: {
      accountId,
      accountDisplayName: String(account.display_name ?? ''),
      practiceRecordCount: Array.isArray(payload.practice_records)
        ? payload.practice_records.length
        : 0,
      consultHistoryCount: Array.isArray(payload.consult_histories)
        ? payload.consult_histories.length
        : 0,
      formPhotoAdviceResultCount: Array.isArray(payload.form_photo_advice_results)
        ? payload.form_photo_advice_results.length
        : 0,
      isDifferentAccount: Boolean(currentAccountId && currentAccountId !== accountId),
    } satisfies CommonImportPreview,
  };
}

export function mapCommonImportAccount(envelope: Record<string, unknown>): LocalAccount {
  const payload = envelope.payload as Record<string, unknown>;
  const account = payload.account as Record<string, unknown>;
  const accountId = String(account.account_id ?? envelope.accountId ?? envelope.account_id);

  if (!isUuidV4(accountId)) {
    throw new Error('account_idがUUID v4形式ではありません。');
  }

  return {
    schemaVersion: 1,
    accountId,
    userName: String(account.user_name ?? ''),
    displayName: String(account.display_name ?? ''),
    email: typeof account.email === 'string' ? account.email : null,
    accountStatus: account.account_status === 'deleted' ? 'deleted' : 'local_active',
    authMode: 'local_no_auth',
    cloudAuthSubject: null,
    createdAt: String(account.created_at ?? new Date().toISOString()),
    updatedAt: String(account.updated_at ?? new Date().toISOString()),
    deletedAt: typeof account.deleted_at === 'string' ? account.deleted_at : null,
  };
}

export function mapCommonImportProfile(
  envelope: Record<string, unknown>,
  fallbackProfile: UserProfile | null,
): UserProfile | null {
  const payload = envelope.payload as Record<string, unknown>;
  const profile = payload.profile as Record<string, unknown> | null;

  if (!profile) {
    return fallbackProfile;
  }

  return {
    accountId: String(profile.account_id),
    rating:
      typeof profile.self_reported_rating === 'number'
        ? profile.self_reported_rating
        : (fallbackProfile?.rating ?? 1),
    level: fallbackProfile?.level ?? 'beginner',
    machineType:
      profile.main_machine === 'DARTSLIVE' ||
      profile.main_machine === 'PHOENIX' ||
      profile.main_machine === 'BOTH'
        ? profile.main_machine
        : (fallbackProfile?.machineType ?? 'DARTSLIVE'),
    mainProblems: fallbackProfile?.mainProblems ?? [],
  };
}

export function mapCommonImportPracticeRecords(
  envelope: Record<string, unknown>,
): PracticeRecord[] {
  const payload = envelope.payload as Record<string, unknown>;
  const records = Array.isArray(payload.practice_records) ? payload.practice_records : [];

  return records
    .filter((value): value is Record<string, unknown> =>
      Boolean(value && typeof value === 'object'),
    )
    .map((record) => ({
      id: String(record.source_record_id ?? record.record_id),
      accountId: String(record.account_id),
      date: String(record.played_at ?? new Date().toISOString()),
      practiceMenuId: 'imported-common-record',
      practiceMenuName: String(record.memo ?? 'Imported practice'),
      machineType: record.machine_type === 'PHOENIX' ? 'PHOENIX' : 'DARTSLIVE',
      gameType:
        record.game_type === 'COUNT_UP'
          ? 'COUNT-UP'
          : record.game_type === 'CRICKET'
            ? 'CRICKET'
            : record.game_type === '01'
              ? '01'
              : 'OTHER',
      score: typeof record.score === 'number' ? record.score : 0,
      bullCount: typeof record.bull_count === 'number' ? record.bull_count : 0,
      cricketMarks: typeof record.cricket_marks === 'number' ? record.cricket_marks : 0,
      condition:
        record.condition === 'good' || record.condition === 'bad' ? record.condition : 'normal',
      memo: String(record.memo ?? ''),
    }));
}

export function mergeImportedPracticeRecords(
  currentRecords: PracticeRecord[],
  importedRecords: PracticeRecord[],
) {
  const nextRecords = [...currentRecords];
  let recordAddedCount = 0;
  let skippedRecordCount = 0;
  let conflictRecordCount = 0;

  for (const importedRecord of importedRecords) {
    const currentRecord = currentRecords.find((record) => record.id === importedRecord.id);

    if (!currentRecord) {
      nextRecords.push(importedRecord);
      recordAddedCount += 1;
      continue;
    }

    if (JSON.stringify(currentRecord) === JSON.stringify(importedRecord)) {
      skippedRecordCount += 1;
      continue;
    }

    conflictRecordCount += 1;
  }

  return {
    records: nextRecords,
    result: {
      recordAddedCount,
      skippedRecordCount,
      conflictRecordCount,
    },
  };
}
