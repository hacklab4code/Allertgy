import { Alert, Linking, Platform, Share } from 'react-native';
import * as Contacts from 'expo-contacts';
import { api } from '../api/client';
import type { AppContactMatch, RecentAppContact } from '../types';

export type ShareDuration = '24h' | 'permanent';

export type ShareContactRow = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  appUserId?: number;
  emailHint?: string;
  source: 'phone' | 'app_recent';
};

export function buildShareLink(token: string) {
  return `allertgy://shared-profile/${token}`;
}

export function buildShareMessage(label: string, duration: ShareDuration, token: string, isIt: boolean) {
  const link = buildShareLink(token);
  const expiry = duration === '24h'
    ? (isIt ? 'valido per 24 ore' : 'valid for 24 hours')
    : (isIt ? 'valido finché non lo revochi' : 'valid until revoked');
  return isIt
    ? `Profilo allergie AllerTgy di ${label} (${expiry}): ${link}`
    : `AllerTgy allergy profile for ${label} (${expiry}): ${link}`;
}

export async function sendShareSms(phone: string, message: string) {
  const normalized = phone.replace(/\s/g, '');
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${normalized}${separator}body=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

export async function openGenericShare(label: string, duration: ShareDuration, token: string, isIt: boolean) {
  const link = buildShareLink(token);
  const message = buildShareMessage(label, duration, token, isIt);
  await Share.share({ message, url: link });
}

type CreateShareOptions = {
  profileId: number | null;
  duration: ShareDuration;
  label?: string;
  recipientUserId?: number;
  recipientEmail?: string;
};

export async function createAndDeliverShare(options: CreateShareOptions) {
  return api.createProfileShare(
    options.profileId,
    options.duration,
    options.label,
    options.recipientUserId,
    options.recipientEmail,
  );
}

function normalizePhone(contact: Contacts.Contact): string | undefined {
  const phone = contact.phoneNumbers?.find((p) => p.number)?.number;
  return phone?.trim() || undefined;
}

function normalizeEmail(contact: Contacts.Contact): string | undefined {
  const email = contact.emails?.find((e) => e.email)?.email;
  return email?.trim().toLowerCase() || undefined;
}

export async function loadShareContacts(): Promise<{
  phoneContacts: ShareContactRow[];
  recentAppContacts: ShareContactRow[];
}> {
  const recentRaw = await api.getRecentAppContacts().catch(() => [] as RecentAppContact[]);
  const recentAppContacts: ShareContactRow[] = recentRaw.map((c) => ({
    id: `app-${c.user_id}`,
    name: c.display_name || c.email_hint,
    appUserId: c.user_id,
    emailHint: c.email_hint,
    source: 'app_recent',
  }));

  const permission = await Contacts.requestPermissionsAsync();
  if (!permission.granted) {
    return { phoneContacts: [], recentAppContacts };
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Name],
    sort: Contacts.SortTypes.FirstName,
  });

  const phoneContacts: ShareContactRow[] = [];
  const emailsToLookup = new Set<string>();

  for (const contact of data) {
    if (!contact.id) continue;
    const name = contact.name?.trim() || contact.firstName?.trim() || contact.lastName?.trim();
    if (!name) continue;
    const phone = normalizePhone(contact);
    const email = normalizeEmail(contact);
    if (!phone && !email) continue;
    phoneContacts.push({
      id: `phone-${contact.id}`,
      name,
      phone,
      email,
      source: 'phone',
    });
    if (email) emailsToLookup.add(email);
  }

  if (emailsToLookup.size) {
    const lookup = await api.lookupAppContacts([...emailsToLookup]).catch(() => ({ matches: [] as AppContactMatch[] }));
    const byEmail = new Map(lookup.matches.map((m) => [m.email.toLowerCase(), m]));
    for (const contact of phoneContacts) {
      if (!contact.email) continue;
      const match = byEmail.get(contact.email.toLowerCase());
      if (match) {
        contact.appUserId = match.user_id;
        contact.emailHint = match.email_hint;
      }
    }
  }

  return { phoneContacts, recentAppContacts };
}

export async function shareWithContact(
  contact: ShareContactRow,
  options: Omit<CreateShareOptions, 'recipientUserId' | 'recipientEmail'>,
  isIt: boolean,
) {
  const share = await createAndDeliverShare({
    ...options,
    recipientUserId: contact.appUserId,
    recipientEmail: !contact.appUserId ? contact.email : undefined,
  });

  const message = buildShareMessage(share.label, options.duration, share.token, isIt);

  if (share.delivered_in_app) {
    Alert.alert(
      isIt ? 'Inviato in app' : 'Sent in app',
      isIt
        ? `${contact.name} riceverà una notifica in AllerTgy con il profilo condiviso.`
        : `${contact.name} will receive an in-app notification with the shared profile.`,
    );
    return share;
  }

  if (contact.phone) {
    await sendShareSms(contact.phone, message);
    return share;
  }

  await openGenericShare(share.label, options.duration, share.token, isIt);
  return share;
}

export function showContactsPermissionAlert(isIt: boolean) {
  Alert.alert(
    isIt ? 'Permesso rubrica' : 'Contacts permission',
    isIt
      ? 'Per condividere il profilo con i contatti del telefono, consenti l\'accesso alla rubrica nelle impostazioni.'
      : 'To share your profile with phone contacts, allow access to contacts in settings.',
  );
}
