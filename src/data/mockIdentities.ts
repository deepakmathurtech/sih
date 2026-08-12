// ============================================================
// RIDTP Mock Identities — Synthetic Demo Data
// NOTICE: All identities are SYNTHETIC. No real personal data.
// ============================================================

import type { RootIdentity } from '../types';
import { sha256Sync } from '../crypto';

function makeRID(seed: string): string {
  return `urn:ridtp:root:sha256:${sha256Sync(seed)}`;
}

function makePubKey(seed: string): string {
  return sha256Sync(seed + ':pubkey') + sha256Sync(seed + ':pubkey2');
}

export const MOCK_IDENTITIES: Record<string, RootIdentity> = {
  shardaUniversity: {
    rid: makeRID('Sharda_University_SIH_Demo'),
    publicKeyHex: makePubKey('Sharda_University_SIH_Demo'),
    entityType: 'ORGANIZATION',
    entityLabel: 'Sharda University',
    status: 'ACTIVE',
    registeredAt: Date.now() - 365 * 24 * 3600 * 1000,
  },

  student: {
    rid: makeRID('Student_Deepak_Sharma_SIH_Demo'),
    publicKeyHex: makePubKey('Student_Deepak_Sharma_SIH_Demo'),
    entityType: 'INDIVIDUAL',
    entityLabel: 'Deepak Sharma (Student)',
    status: 'ACTIVE',
    registeredAt: Date.now() - 180 * 24 * 3600 * 1000,
  },

  employer: {
    rid: makeRID('TechCorp_Employer_SIH_Demo'),
    publicKeyHex: makePubKey('TechCorp_Employer_SIH_Demo'),
    entityType: 'ORGANIZATION',
    entityLabel: 'TechCorp India Pvt. Ltd.',
    status: 'ACTIVE',
    registeredAt: Date.now() - 200 * 24 * 3600 * 1000,
  },

  government: {
    rid: makeRID('DigiLocker_Government_SIH_Demo'),
    publicKeyHex: makePubKey('DigiLocker_Government_SIH_Demo'),
    entityType: 'ORGANIZATION',
    entityLabel: 'DigiLocker (Government Service)',
    status: 'ACTIVE',
    registeredAt: Date.now() - 500 * 24 * 3600 * 1000,
  },

  registrar: {
    rid: makeRID('Registrar_Office_SIH_Demo'),
    publicKeyHex: makePubKey('Registrar_Office_SIH_Demo'),
    entityType: 'ORGANIZATION',
    entityLabel: 'Sharda University Registrar',
    status: 'ACTIVE',
    registeredAt: Date.now() - 360 * 24 * 3600 * 1000,
  },

  verificationOfficer: {
    rid: makeRID('Verification_Officer_SIH_Demo'),
    publicKeyHex: makePubKey('Verification_Officer_SIH_Demo'),
    entityType: 'INDIVIDUAL',
    entityLabel: 'Verification Officer',
    status: 'ACTIVE',
    registeredAt: Date.now() - 90 * 24 * 3600 * 1000,
  },
};
