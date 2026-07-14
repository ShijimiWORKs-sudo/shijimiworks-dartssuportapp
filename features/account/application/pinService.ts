import * as SecureStore from 'expo-secure-store';

import { validatePin } from './accountService';

export function getPinSecureStoreKey(accountId: string) {
  return `darts_support_account_pin_v1:${accountId}`;
}

export async function setAccountPin(accountId: string, pin: string) {
  if (!validatePin(pin)) {
    throw new Error('PINは4〜8桁の数字で入力してください。');
  }

  await SecureStore.setItemAsync(getPinSecureStoreKey(accountId), pin, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyAccountPin(accountId: string, pin: string) {
  if (!validatePin(pin)) {
    return false;
  }

  const storedPin = await SecureStore.getItemAsync(getPinSecureStoreKey(accountId));
  return storedPin === pin;
}

export async function deleteAccountPin(accountId: string) {
  await SecureStore.deleteItemAsync(getPinSecureStoreKey(accountId));
}
