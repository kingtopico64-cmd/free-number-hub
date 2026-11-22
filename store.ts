
import crypto from 'node:crypto';
import {COUNTRIES} from './botData.ts';
import type {AuthorizedNumberRecord, RegistrationStep, UserSessionState} from './types.ts';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export interface DemoSmsRecord {
  id: string;
  sender: string;
  message: string;
  receivedAt: string;
}

export function validateE164PhoneNumber(
  raw: string,
  expectedCountryCode?: string,
): {valid: boolean; normalized: string; reason?: string} {
  const normalized = raw.replace(/[\s\-().]/g, '').trim();
  if (!E164_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason:
        'Please enter a valid international E.164 number starting with + and country code (e.g., +14155550199).',
    };
  }

  if (expectedCountryCode) {
    const country = COUNTRIES.find((c) => c.code === expectedCountryCode);
    if (country && !normalized.startsWith(country.dialCode)) {
      return {
        valid: false,
        normalized,
        reason: `That number does not match ${country.name} (${country.dialCode}). Expected format like ${country.e164Example}.`,
      };
    }
  }

  return {valid: true, normalized};
}

export class BotAccountStore {
  private readonly sessions = new Map<number, UserSessionState>();
  private readonly demoMessages = new Map<number, DemoSmsRecord[]>();

  getOrCreateSession(userId: number, firstName = 'User', username?: string): UserSessionState {
    const existing = this.sessions.get(userId);
    if (existing) {
      if (firstName && existing.firstName !== firstName) {
        existing.firstName = firstName;
      }
      if (username !== undefined && existing.username !== username) {
        existing.username = username;
      }
      return existing;
    }

    const created: UserSessionState = {
      userId,
      firstName,
      username,
      createdAt: new Date().toISOString(),
      registrationStep: 'idle',
      numbers: [],
    };
    this.sessions.set(userId, created);
    return created;
  }

  addDemoSms(
    userId: number,
    sender: string,
    message: string,
  ): DemoSmsRecord {
    this.getOrCreateSession(userId);

    const record: DemoSmsRecord = {
      id: crypto.randomUUID().slice(0, 8),
      sender: sender.trim().slice(0, 80) || 'Demo Sender',
      message: message.trim().slice(0, 500) || 'Demo notification',
      receivedAt: new Date().toISOString(),
    };

    const history = this.demoMessages.get(userId) ?? [];
    history.unshift(record);
    this.demoMessages.set(userId, history.slice(0, 50));

    return record;
  }

  listDemoSms(userId: number): DemoSmsRecord[] {
    return [...(this.demoMessages.get(userId) ?? [])];
  }

  clearDemoSms(userId: number): void {
    this.demoMessages.delete(userId);
  }

  setRegistrationState(
    userId: number,
    step: RegistrationStep,
    patch?: {
      pendingCountryCode?: string;
      pendingPhoneNumber?: string;
      pendingLabel?: string;
    },
  ): UserSessionState {
    const session = this.getOrCreateSession(userId);
    session.registrationStep = step;
    if (patch?.pendingCountryCode !== undefined) {
      session.pendingCountryCode = patch.pendingCountryCode;
    }
    if (patch?.pendingPhoneNumber !== undefined) {
      session.pendingPhoneNumber = patch.pendingPhoneNumber;
    }
    if (patch?.pendingLabel !== undefined) {
      session.pendingLabel = patch.pendingLabel;
    }
    if (step === 'idle') {
      session.pendingCountryCode = undefined;
      session.pendingPhoneNumber = undefined;
      session.pendingLabel = undefined;
    }
    return session;
  }

  addAuthorizedNumber(
    userId: number,
    countryCode: string,
    phoneNumber: string,
    label: string,
    ownershipAttested: boolean,
  ): {ok: true; record: AuthorizedNumberRecord} | {ok: false; error: string} {
    if (!ownershipAttested) {
      return {
        ok: false,
        error: 'Explicit ownership attestation is required before saving any phone number.',
      };
    }

    const check = validateE164PhoneNumber(phoneNumber, countryCode);
    if (!check.valid) {
      return {ok: false, error: check.reason ?? 'Invalid E.164 phone number.'};
    }

    const session = this.getOrCreateSession(userId);
    const duplicate = session.numbers.some((item) => item.phoneNumber === check.normalized);
    if (duplicate) {
      return {ok: false, error: 'This number is already registered in your account.'};
    }

    if (session.numbers.length >= 10) {
      return {
        ok: false,
        error: 'Account limit reached (10 authorized numbers). Remove an unused number first.',
      };
    }

    const cleanLabel = label.trim().slice(0, 40) || 'My Authorized Line';
    const record: AuthorizedNumberRecord = {
      id: crypto.randomUUID().slice(0, 8),
      userId,
      countryCode,
      phoneNumber: check.normalized,
      label: cleanLabel,
      ownershipAttested: true,
      attestedAt: new Date().toISOString(),
    };

    session.numbers.push(record);
    this.setRegistrationState(userId, 'idle');
    return {ok: true, record};
  }

  listAuthorizedNumbers(userId: number): AuthorizedNumberRecord[] {
    const session = this.getOrCreateSession(userId);
    return session.numbers.filter((item) => item.userId === userId);
  }

  removeAuthorizedNumber(userId: number, recordId: string): boolean {
    const session = this.getOrCreateSession(userId);
    const before = session.numbers.length;
    session.numbers = session.numbers.filter(
      (item) => !(item.id === recordId && item.userId === userId),
    );
    return session.numbers.length < before;
  }

  resetUserSession(userId: number): void {
    this.sessions.delete(userId);
    this.demoMessages.delete(userId);
  }
}
