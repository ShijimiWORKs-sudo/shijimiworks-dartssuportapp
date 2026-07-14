import type {
  CommonOutboxEventType,
  CommonOutboxItem,
  LocalAccount,
  SyncStatus,
} from '../../../types';

export type RegisterLocalAccountInput = {
  userName: string;
  displayName: string;
  email?: string;
  pinEnabled: boolean;
  now?: string;
};

export type UpdateLocalAccountInput = {
  userName?: string;
  displayName?: string;
  email?: string | null;
  authMode?: LocalAccount['authMode'];
  now?: string;
};

export type AccountValidationResult = {
  isValid: boolean;
  errors: string[];
};

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const userNamePattern = /^[A-Za-z0-9_-]{3,32}$/;

export function createLocalAccount(
  input: RegisterLocalAccountInput,
  existingAccounts: LocalAccount[],
) {
  const normalized = normalizeAccountInput(input);
  const validation = validateAccountInput(normalized, existingAccounts);

  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'));
  }

  const now = input.now ?? new Date().toISOString();

  return {
    schemaVersion: 1,
    accountId: createUuidV4(),
    userName: normalized.userName,
    displayName: normalized.displayName,
    email: normalized.email,
    accountStatus: 'local_active',
    authMode: input.pinEnabled ? 'local_pin' : 'local_no_auth',
    cloudAuthSubject: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies LocalAccount;
}

export function updateLocalAccount(
  account: LocalAccount,
  input: UpdateLocalAccountInput,
  existingAccounts: LocalAccount[],
) {
  const normalizedUserName =
    input.userName === undefined ? account.userName : normalizeUserName(input.userName);
  const normalizedDisplayName =
    input.displayName === undefined ? account.displayName : input.displayName.trim();
  const normalizedEmail =
    input.email === undefined ? account.email : normalizeOptionalEmail(input.email);
  const validation = validateAccountInput(
    {
      userName: normalizedUserName,
      displayName: normalizedDisplayName,
      email: normalizedEmail,
    },
    existingAccounts.filter((item) => item.accountId !== account.accountId),
  );

  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'));
  }

  return {
    ...account,
    userName: normalizedUserName,
    displayName: normalizedDisplayName,
    email: normalizedEmail,
    authMode: input.authMode ?? account.authMode,
    updatedAt: input.now ?? new Date().toISOString(),
  } satisfies LocalAccount;
}

export function deleteLocalAccount(account: LocalAccount, now = new Date().toISOString()) {
  return {
    ...account,
    accountStatus: 'deleted',
    deletedAt: now,
    updatedAt: now,
  } satisfies LocalAccount;
}

export function validateAccountInput(
  input: Pick<RegisterLocalAccountInput, 'userName' | 'displayName'> & {
    email?: string | null;
  },
  existingAccounts: LocalAccount[],
): AccountValidationResult {
  const errors: string[] = [];
  const userName = normalizeUserName(input.userName);
  const displayName = input.displayName.trim();

  if (!userNamePattern.test(userName)) {
    errors.push('userNameは3〜32文字の英数字、_、-で入力してください。');
  }

  if (displayName.length < 1 || displayName.length > 40) {
    errors.push('displayNameは1〜40文字で入力してください。');
  }

  if (
    existingAccounts.some(
      (account) =>
        account.deletedAt === null && account.userName.toLowerCase() === userName.toLowerCase(),
    )
  ) {
    errors.push('同じuserNameのAccountが既にあります。');
  }

  const email = normalizeOptionalEmail(input.email);

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('emailの形式を確認してください。');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePin(pin: string) {
  return /^\d{4,8}$/.test(pin);
}

export function normalizeUserName(userName: string) {
  return userName.trim();
}

export function normalizeOptionalEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function isUuidV4(value: string) {
  return uuidV4Pattern.test(value);
}

export function createCommonOutboxItem(input: {
  eventType: CommonOutboxEventType;
  accountId: string;
  sourceRecordId?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: string;
  createdAt?: string;
  syncStatus?: SyncStatus;
}): CommonOutboxItem {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    outboxId: createUuidV4(),
    eventType: input.eventType,
    eventVersion: 1,
    accountId: input.accountId,
    sourceRecordId: input.sourceRecordId ?? null,
    occurredAt: input.occurredAt ?? createdAt,
    createdAt,
    syncStatus: input.syncStatus ?? 'local_only',
    payload: input.payload ?? {},
  };
}

export function createUuidV4() {
  const cryptoLike = globalThis.crypto as Crypto | undefined;

  if (cryptoLike?.randomUUID) {
    return cryptoLike.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeAccountInput(input: RegisterLocalAccountInput) {
  return {
    userName: normalizeUserName(input.userName),
    displayName: input.displayName.trim(),
    email: normalizeOptionalEmail(input.email),
  };
}
