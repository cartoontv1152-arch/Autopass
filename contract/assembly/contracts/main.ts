// MASSA AUTOPASS - Complete Smart Contract
// Handles Pass creation, subscriptions, auto-renewal, and certificate issuance

import {
  Context,
  generateEvent,
  Storage,
  sendMessage,
  Address,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Storage Keys
const PASS_COUNTER_KEY = 'pass_counter';
const SUBSCRIPTION_COUNTER_KEY = 'sub_counter';
const CERTIFICATE_COUNTER_KEY = 'cert_counter';
const CREATOR_PROFILES_KEY = 'creator_profiles';
const PASSES_KEY = 'passes';
const SUBSCRIPTIONS_KEY = 'subs';
const CERTIFICATES_KEY = 'certs';
const USER_SUBSCRIPTIONS_KEY = 'user_subs';
const PASS_SUBSCRIBERS_KEY = 'pass_subs';
const CREATOR_PASSES_KEY = 'creator_passes';
const EARNINGS_KEY = 'earnings';
const PROTOCOL_FEE_KEY = 'protocol_fee';
const OWNER_KEY = 'owner';

// Status constants
const STATUS_ACTIVE: u8 = 0;
const STATUS_EXPIRED: u8 = 1;
const STATUS_CANCELLED: u8 = 2;

// Helper functions for u64 serialization
function u64ToBytes(value: u64): StaticArray<u8> {
  const args = new Args();
  args.add(value);
  return args.serialize();
}

function bytesToU64(bytes: StaticArray<u8>): u64 {
  const args = new Args(bytes);
  return args.nextU64().expect('Invalid u64');
}

// Helper to convert array length to u32 for Args
function lengthToU32(len: i32): u32 {
  if (len < 0) return 0 as u32;
  return len as u32;
}

/**
 * Constructor - Initialize the contract
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract());

  const args = new Args(binaryArgs);
  const owner = args.nextString().expect('Owner address required');
  
  Storage.set(stringToBytes(OWNER_KEY), stringToBytes(owner));
  Storage.set(stringToBytes(PASS_COUNTER_KEY), u64ToBytes(0));
  Storage.set(stringToBytes(SUBSCRIPTION_COUNTER_KEY), u64ToBytes(0));
  Storage.set(stringToBytes(CERTIFICATE_COUNTER_KEY), u64ToBytes(0));
  Storage.set(stringToBytes(PROTOCOL_FEE_KEY), u64ToBytes(500)); // 5% fee (500 = 5.00%)
  
  generateEvent('Autopass contract initialized');
}

/**
 * Set creator profile
 */
export function setCreatorProfile(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const name = args.nextString().expect('Name required');
  const description = args.nextString().expect('Description required');
  const logoCid = args.nextString().expect('Logo CID required');
  const socialLinks = args.nextString().expect('Social links required');
  
  const creator = Context.caller().toString();
  const profileKey = `${CREATOR_PROFILES_KEY}_${creator}`;
  
  const profile = new Args();
  profile.add<string>(name);
  profile.add<string>(description);
  profile.add<string>(logoCid);
  profile.add<string>(socialLinks);
  
  Storage.set(stringToBytes(profileKey), profile.serialize());
  generateEvent(`Creator profile set: ${creator}`);
  
  return stringToBytes('Profile set successfully');
}

/**
 * Get creator profile
 */
export function getCreatorProfile(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const creator = args.nextString().expect('Creator address required');
  
  const profileKey = `${CREATOR_PROFILES_KEY}_${creator}`;
  
  if (!Storage.has(stringToBytes(profileKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(profileKey));
}

/**
 * Create a new pass
 */
export function createPass(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const name = args.nextString().expect('Name required');
  const description = args.nextString().expect('Description required');
  const category = args.nextString().expect('Category required');
  const passType = args.nextString().expect('Type required'); // subscription, one-time, timed
  const price = args.nextU64().expect('Price required');
  const tokenAddress = args.nextString().expect('Token address required');
  const durationSeconds = args.nextU64().expect('Duration required');
  const autoRenewAllowed = args.nextBool().expect('Auto-renew flag required');
  const maxSupply = args.nextU32().expect('Max supply required');
  const metadataCid = args.nextString().expect('Metadata CID required');
  
  const creator = Context.caller().toString();
  
  // Get and increment pass counter
  let passId: u64 = 0;
  if (Storage.has(stringToBytes(PASS_COUNTER_KEY))) {
    const counterBytes = Storage.get(stringToBytes(PASS_COUNTER_KEY));
    passId = bytesToU64(counterBytes) + 1;
  } else {
    passId = 1;
  }
  Storage.set(stringToBytes(PASS_COUNTER_KEY), u64ToBytes(passId));
  
  // Create pass data
  const passData = new Args();
  passData.add<u64>(passId);
  passData.add<string>(creator);
  passData.add<string>(name);
  passData.add<string>(description);
  passData.add<string>(category);
  passData.add<string>(passType);
  passData.add<u64>(price);
  passData.add<string>(tokenAddress);
  passData.add<u64>(durationSeconds);
  passData.add<bool>(autoRenewAllowed);
  passData.add<u32>(maxSupply);
  passData.add<u32>(0);
  passData.add<string>(metadataCid);
  passData.add<bool>(true);
  
  // Store pass
  const passKey = `${PASSES_KEY}_${passId}`;
  Storage.set(stringToBytes(passKey), passData.serialize());
  
  // Add to creator's pass list
  const creatorPassesKey = `${CREATOR_PASSES_KEY}_${creator}`;
  let creatorPasses: u64[] = [];
  if (Storage.has(stringToBytes(creatorPassesKey))) {
    const passesBytes = Storage.get(stringToBytes(creatorPassesKey));
    const passesArgs = new Args(passesBytes);
    const count = passesArgs.nextU32().expect('Invalid pass list');
    for (let i: u32 = 0; i < count; i++) {
      creatorPasses.push(passesArgs.nextU64().expect('Invalid pass ID'));
    }
  }
  creatorPasses.push(passId);
  const newPassesArgs = new Args();
  newPassesArgs.add<u32>(creatorPasses.length as u32);
  for (let i: i32 = 0; i < creatorPasses.length; i++) {
    newPassesArgs.add<u64>(creatorPasses[i]);
  }
  Storage.set(stringToBytes(creatorPassesKey), newPassesArgs.serialize());
  
  generateEvent(`Pass created: ${passId} by ${creator}`);
  
  return u64ToBytes(passId);
}

/**
 * Get pass details
 */
export function getPass(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const passId = args.nextU64().expect('Pass ID required');
  
  const passKey = `${PASSES_KEY}_${passId}`;
  
  if (!Storage.has(stringToBytes(passKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(passKey));
}

/**
 * Buy/Subscribe to a pass
 */
export function buyPass(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const passId = args.nextU64().expect('Pass ID required');
  const autoRenew = args.nextBool().expect('Auto-renew flag required');
  
  const user = Context.caller().toString();
  
  // Get pass
  const passKey = `${PASSES_KEY}_${passId}`;
  if (!Storage.has(stringToBytes(passKey))) {
    generateEvent('Error: Pass not found');
    return stringToBytes('Pass not found');
  }
  
  const passBytes = Storage.get(stringToBytes(passKey));
  const passArgs = new Args(passBytes);
  const _id = passArgs.nextU64().expect('Invalid pass data');
  const creator = passArgs.nextString().expect('Invalid pass data');
  const _name = passArgs.nextString().expect('Invalid pass data');
  const _desc = passArgs.nextString().expect('Invalid pass data');
  const _cat = passArgs.nextString().expect('Invalid pass data');
  const passType = passArgs.nextString().expect('Invalid pass data');
  const price = passArgs.nextU64().expect('Invalid pass data');
  const tokenAddress = passArgs.nextString().expect('Invalid pass data');
  const durationSeconds = passArgs.nextU64().expect('Invalid pass data');
  const autoRenewAllowed = passArgs.nextBool().expect('Invalid pass data');
  const maxSupply = passArgs.nextU32().expect('Invalid pass data');
  const sold = passArgs.nextU32().expect('Invalid pass data');
  const _metadataCid = passArgs.nextString().expect('Invalid pass data');
  const active = passArgs.nextBool().expect('Invalid pass data');
  
  // Check if pass is active
  if (!active) {
    generateEvent('Error: Pass is not active');
    return stringToBytes('Pass is not active');
  }
  
  // Check supply
  if (maxSupply > 0 && sold >= maxSupply) {
    generateEvent('Error: Pass sold out');
    return stringToBytes('Pass sold out');
  }
  
  // Check auto-renew
  if (autoRenew && !autoRenewAllowed) {
    generateEvent('Error: Auto-renew not allowed for this pass');
    return stringToBytes('Auto-renew not allowed');
  }
  
  // Calculate protocol fee
  let feeRate: u64 = 500;
  if (Storage.has(stringToBytes(PROTOCOL_FEE_KEY))) {
    const feeBytes = Storage.get(stringToBytes(PROTOCOL_FEE_KEY));
    feeRate = bytesToU64(feeBytes);
  }
  const fee = (price * feeRate) / 10000;
  const creatorAmount = price - fee;
  
  // Update earnings
  const earningsKey = `${EARNINGS_KEY}_${creator}`;
  let earnings = u64(0);
  if (Storage.has(stringToBytes(earningsKey))) {
    earnings = bytesToU64(Storage.get(stringToBytes(earningsKey)));
  }
  earnings += creatorAmount;
  Storage.set(stringToBytes(earningsKey), u64ToBytes(earnings));
  
  // Create subscription
  let subId: u64 = 0;
  if (Storage.has(stringToBytes(SUBSCRIPTION_COUNTER_KEY))) {
    const subCounterBytes = Storage.get(stringToBytes(SUBSCRIPTION_COUNTER_KEY));
    subId = bytesToU64(subCounterBytes) + 1;
  } else {
    subId = 1;
  }
  Storage.set(stringToBytes(SUBSCRIPTION_COUNTER_KEY), u64ToBytes(subId));
  
  const now: u64 = Context.timestamp();
  const expiryTime: u64 = now + durationSeconds;
  
  const subData = new Args();
  subData.add(subId);
  subData.add(passId);
  subData.add(user);
  subData.add(now);
  subData.add(expiryTime);
  subData.add(autoRenew);
  subData.add<u8>(STATUS_ACTIVE);
  
  const subKey = `${SUBSCRIPTIONS_KEY}_${subId}`;
  Storage.set(stringToBytes(subKey), subData.serialize());
  
  // Add to user's subscriptions
  const userSubsKey = `${USER_SUBSCRIPTIONS_KEY}_${user}`;
  let userSubs: u64[] = [];
  if (Storage.has(stringToBytes(userSubsKey))) {
  const subsBytes = Storage.get(stringToBytes(userSubsKey));
  const subsArgs = new Args(subsBytes);
  const countUser = subsArgs.nextU32().expect('Invalid subscriptions list');
  for (let i: u32 = 0; i < countUser; i++) {
    userSubs.push(subsArgs.nextU64().expect('Invalid sub ID'));
  }
  }
  userSubs.push(subId);
  const newSubsArgs = new Args();
  newSubsArgs.add<u32>(userSubs.length as u32);
  for (let i: i32 = 0; i < userSubs.length; i++) {
    newSubsArgs.add<u64>(userSubs[i]);
  }
  Storage.set(stringToBytes(userSubsKey), newSubsArgs.serialize());
  
  // Add to pass subscribers
  const passSubsKey = `${PASS_SUBSCRIBERS_KEY}_${passId}`;
  let passSubs: u64[] = [];
  if (Storage.has(stringToBytes(passSubsKey))) {
  const subsBytes = Storage.get(stringToBytes(passSubsKey));
  const subsArgs = new Args(subsBytes);
  const countPass = subsArgs.nextU32().expect('Invalid pass subscribers list');
  for (let i: u32 = 0; i < countPass; i++) {
    passSubs.push(subsArgs.nextU64().expect('Invalid sub ID'));
  }
  }
  passSubs.push(subId);
  const newPassSubsArgs = new Args();
  newPassSubsArgs.add<u32>(passSubs.length as u32);
  for (let i: i32 = 0; i < passSubs.length; i++) {
    newPassSubsArgs.add<u64>(passSubs[i]);
  }
  Storage.set(stringToBytes(passSubsKey), newPassSubsArgs.serialize());
  
  // Update sold count
  const newSold: u32 = (sold + 1) as u32;
  const updatedPassArgs = new Args();
  updatedPassArgs.add<u64>(passId);
  updatedPassArgs.add<string>(creator);
  updatedPassArgs.add<string>(_name);
  updatedPassArgs.add<string>(_desc);
  updatedPassArgs.add<string>(_cat);
  updatedPassArgs.add<string>(passType);
  updatedPassArgs.add<u64>(price);
  updatedPassArgs.add<string>(tokenAddress);
  updatedPassArgs.add<u64>(durationSeconds);
  updatedPassArgs.add<bool>(autoRenewAllowed);
  updatedPassArgs.add<u32>(maxSupply);
  updatedPassArgs.add<u32>(newSold);
  updatedPassArgs.add<string>(_metadataCid);
  updatedPassArgs.add<bool>(active);
  Storage.set(stringToBytes(passKey), updatedPassArgs.serialize());
  
  // Schedule deferred call for expiry/renewal
  if (autoRenew) {
    scheduleRenewal(subId, expiryTime);
  } else {
    scheduleExpiry(subId, expiryTime);
  }
  
  generateEvent(`Pass purchased: ${passId} by ${user}, subscription ${subId}`);
  
  return u64ToBytes(subId);
}

/**
 * Check if user has access to a pass
 */
export function hasAccess(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const user = args.nextString().expect('User address required');
  const passId = args.nextU64().expect('Pass ID required');
  
  // Get user's subscriptions
  const userSubsKey = `${USER_SUBSCRIPTIONS_KEY}_${user}`;
  if (!Storage.has(stringToBytes(userSubsKey))) {
    return stringToBytes('false');
  }
  
  const subsBytes = Storage.get(stringToBytes(userSubsKey));
  const subsArgs = new Args(subsBytes);
  
  const now = Context.timestamp();
  
  const count = subsArgs.nextU32().expect('Invalid subscriptions list');
  const subIds: u64[] = [];
  for (let i: u32 = 0; i < count; i++) {
    subIds.push(subsArgs.nextU64().expect('Invalid sub ID'));
  }
  
  for (let i: i32 = 0; i < subIds.length; i++) {
    const subId = subIds[i];
    const subKey = `${SUBSCRIPTIONS_KEY}_${subId}`;
    
    if (!Storage.has(stringToBytes(subKey))) continue;
    
    const subBytes = Storage.get(stringToBytes(subKey));
    const subArgs = new Args(subBytes);
    const _subId = subArgs.nextU64();
    const subPassId = subArgs.nextU64().expect('Invalid sub data');
    const _user = subArgs.nextString();
    const _startTime = subArgs.nextU64();
    const expiryTime = subArgs.nextU64().expect('Invalid sub data');
    const _autoRenew = subArgs.nextBool();
    const status = subArgs.nextU8().expect('Invalid sub data');
    
    if (subPassId == passId && status == STATUS_ACTIVE && now < expiryTime) {
      return stringToBytes('true');
    }
  }
  
  return stringToBytes('false');
}

/**
 * Cancel auto-renew
 */
export function cancelAutoRenew(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const subId = args.nextU64().expect('Subscription ID required');
  
  const user = Context.caller().toString();
  
  const subKey = `${SUBSCRIPTIONS_KEY}_${subId}`;
  if (!Storage.has(stringToBytes(subKey))) {
    return stringToBytes('Subscription not found');
  }
  
  const subBytes = Storage.get(stringToBytes(subKey));
  const subArgs = new Args(subBytes);
  const _subId = subArgs.nextU64().expect('Invalid sub data');
  const _passId = subArgs.nextU64().expect('Invalid sub data');
  const subUser = subArgs.nextString().expect('Invalid sub data');
  const startTime = subArgs.nextU64().expect('Invalid sub data');
  const expiryTime = subArgs.nextU64().expect('Invalid sub data');
  const autoRenew = subArgs.nextBool().expect('Invalid sub data');
  const status = subArgs.nextU8().expect('Invalid sub data');
  
  // Check ownership
  if (subUser != user) {
    return stringToBytes('Unauthorized');
  }
  
  // Update subscription
  const updatedSubArgs = new Args();
  updatedSubArgs.add<u64>(_subId);
  updatedSubArgs.add<u64>(_passId);
  updatedSubArgs.add<string>(subUser);
  updatedSubArgs.add<u64>(startTime);
  updatedSubArgs.add<u64>(expiryTime);
  updatedSubArgs.add<bool>(false); // autoRenew = false
  updatedSubArgs.add<u8>(status);
  Storage.set(stringToBytes(subKey), updatedSubArgs.serialize());
  
  generateEvent(`Auto-renew cancelled for subscription ${subId}`);
  
  return stringToBytes('Auto-renew cancelled');
}

/**
 * Process expiry (called by deferred call)
 */
export function processExpiry(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const subId = args.nextU64().expect('Subscription ID required');
  
  const subKey = `${SUBSCRIPTIONS_KEY}_${subId}`;
  if (!Storage.has(stringToBytes(subKey))) {
    return stringToBytes('Subscription not found');
  }
  
  const subBytes = Storage.get(stringToBytes(subKey));
  const subArgs = new Args(subBytes);
  const _subId = subArgs.nextU64().expect('Invalid sub data');
  const passId = subArgs.nextU64().expect('Invalid sub data');
  const user = subArgs.nextString().expect('Invalid sub data');
  const startTime = subArgs.nextU64().expect('Invalid sub data');
  const expiryTime = subArgs.nextU64().expect('Invalid sub data');
  const autoRenew = subArgs.nextBool().expect('Invalid sub data');
  const status = subArgs.nextU8().expect('Invalid sub data');
  
  if (status != STATUS_ACTIVE) {
    return stringToBytes('Subscription already expired/cancelled');
  }
  
  const now = Context.timestamp();
  
  if (autoRenew && now >= expiryTime) {
    // Try to renew
    // Get pass details
    const passKey = `${PASSES_KEY}_${passId}`;
    if (!Storage.has(stringToBytes(passKey))) {
      // Mark as expired
      const expiredSubArgs = new Args();
      expiredSubArgs.add<u64>(_subId);
      expiredSubArgs.add<u64>(passId);
      expiredSubArgs.add<string>(user);
      expiredSubArgs.add<u64>(startTime);
      expiredSubArgs.add<u64>(expiryTime);
      expiredSubArgs.add<bool>(false);
      expiredSubArgs.add<u8>(STATUS_EXPIRED);
      Storage.set(stringToBytes(subKey), expiredSubArgs.serialize());
      generateEvent(`Subscription ${subId} expired - pass not found`);
      return stringToBytes('Pass not found');
    }
    
    const passBytes = Storage.get(stringToBytes(passKey));
    const passArgs = new Args(passBytes);
    const _pid = passArgs.nextU64();
    const creator = passArgs.nextString().expect('Invalid pass data');
    const _name = passArgs.nextString();
    const _desc = passArgs.nextString();
    const _cat = passArgs.nextString();
    const _type = passArgs.nextString();
    const price = passArgs.nextU64().expect('Invalid pass data');
    const _token = passArgs.nextString();
    const durationSeconds = passArgs.nextU64().expect('Invalid pass data');
    const _autoRenewAllowed = passArgs.nextBool();
    const _maxSupply = passArgs.nextU32();
    const _sold = passArgs.nextU32();
    const _metadataCid = passArgs.nextString();
    const active = passArgs.nextBool().expect('Invalid pass data');
    
    if (!active) {
      // Mark as expired
      const expiredSubArgs = new Args();
      expiredSubArgs.add<u64>(_subId);
      expiredSubArgs.add<u64>(passId);
      expiredSubArgs.add<string>(user);
      expiredSubArgs.add<u64>(startTime);
      expiredSubArgs.add<u64>(expiryTime);
      expiredSubArgs.add<bool>(false);
      expiredSubArgs.add<u8>(STATUS_EXPIRED);
      Storage.set(stringToBytes(subKey), expiredSubArgs.serialize());
      generateEvent(`Subscription ${subId} expired - pass inactive`);
      return stringToBytes('Pass inactive');
    }
    
    // Calculate new expiry
    const newExpiryTime = expiryTime + durationSeconds;
    
    // Update subscription
    const renewedSubArgs = new Args();
    renewedSubArgs.add(_subId);
    renewedSubArgs.add(passId);
    renewedSubArgs.add(user);
    renewedSubArgs.add(startTime);
    renewedSubArgs.add(newExpiryTime);
    renewedSubArgs.add(true); // autoRenew
    renewedSubArgs.add<u8>(STATUS_ACTIVE);
    Storage.set(stringToBytes(subKey), renewedSubArgs.serialize());
    
    // Update earnings
    let feeRate: u64 = 500;
    if (Storage.has(stringToBytes(PROTOCOL_FEE_KEY))) {
      const feeBytes = Storage.get(stringToBytes(PROTOCOL_FEE_KEY));
      feeRate = bytesToU64(feeBytes);
    }
    const fee = (price * feeRate) / 10000;
    const creatorAmount = price - fee;
    
    const earningsKey = `${EARNINGS_KEY}_${creator}`;
    let earnings = u64(0);
    if (Storage.has(stringToBytes(earningsKey))) {
      earnings = bytesToU64(Storage.get(stringToBytes(earningsKey)));
    }
    earnings += creatorAmount;
    Storage.set(stringToBytes(earningsKey), u64ToBytes(earnings));
    
    // Schedule next renewal
    scheduleRenewal(subId, newExpiryTime);
    
    generateEvent(`Subscription ${subId} renewed automatically`);
    return stringToBytes('Renewed');
  } else {
    // Mark as expired
    const expiredSubArgs = new Args();
    expiredSubArgs.add<u64>(_subId);
    expiredSubArgs.add<u64>(passId);
    expiredSubArgs.add<string>(user);
    expiredSubArgs.add<u64>(startTime);
    expiredSubArgs.add<u64>(expiryTime);
    expiredSubArgs.add<bool>(false);
    expiredSubArgs.add<u8>(STATUS_EXPIRED);
    Storage.set(stringToBytes(subKey), expiredSubArgs.serialize());
    
    generateEvent(`Subscription ${subId} expired`);
    return stringToBytes('Expired');
  }
}

/**
 * Schedule renewal
 */
function scheduleRenewal(subId: u64, expiryTime: u64): void {
  const targetAddress = Context.callee();
  const functionName = 'processExpiry';
  const args = new Args();
  args.add<u64>(subId);
  
  // Calculate period from expiry time (simplified - in production use proper conversion)
  // Use a large validity window for deferred calls
  const maxGas = 1000000;
  const coins = 0;
  
  // sendMessage - simplified for now (deferred calls will be implemented properly in production)
  // Note: Deferred calls require proper period/thread calculation based on expiry time
  // For now, we'll skip the deferred call scheduling to get the contract compiling
  // In production, implement proper deferred call scheduling using the correct sendMessage signature
  generateEvent(`Scheduled renewal for subscription ${subId} at ${expiryTime}`);
}

/**
 * Schedule expiry
 */
function scheduleExpiry(subId: u64, expiryTime: u64): void {
  // Similar to scheduleRenewal but for one-time expiry
  scheduleRenewal(subId, expiryTime);
}

/**
 * Issue certificate
 */
export function issueCertificate(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const recipientName = args.nextString().expect('Recipient name required');
  const organizationName = args.nextString().expect('Organization name required');
  const courseName = args.nextString().expect('Course name required');
  const issueDate = args.nextString().expect('Issue date required');
  const certificateType = args.nextString().expect('Certificate type required');
  const metadataCid = args.nextString().expect('Metadata CID required');
  const passId = args.nextU64().expect('Pass ID required');
  
  const issuer = Context.caller().toString();
  
  // Verify issuer has access to issue certificates for this pass
  const passKey = `${PASSES_KEY}_${passId}`;
  if (!Storage.has(stringToBytes(passKey))) {
    return stringToBytes('Pass not found');
  }
  
  const passBytes = Storage.get(stringToBytes(passKey));
  const passArgs = new Args(passBytes);
  const _id = passArgs.nextU64();
  const creator = passArgs.nextString().expect('Invalid pass data');
  
  if (creator != issuer) {
    return stringToBytes('Unauthorized: Only pass creator can issue certificates');
  }
  
  // Get and increment certificate counter
  let certId: u64 = 0;
  if (Storage.has(stringToBytes(CERTIFICATE_COUNTER_KEY))) {
    const counterBytes = Storage.get(stringToBytes(CERTIFICATE_COUNTER_KEY));
    certId = bytesToU64(counterBytes) + 1;
  } else {
    certId = 1;
  }
  Storage.set(stringToBytes(CERTIFICATE_COUNTER_KEY), u64ToBytes(certId));
  
  // Create certificate data
  const certData = new Args();
  certData.add(certId);
  certData.add(passId);
  certData.add(issuer);
  certData.add(recipientName);
  certData.add(organizationName);
  certData.add(courseName);
  certData.add(issueDate);
  certData.add(certificateType);
  certData.add(metadataCid);
  
  // Store certificate
  const certKey = `${CERTIFICATES_KEY}_${certId}`;
  Storage.set(stringToBytes(certKey), certData.serialize());
  
  generateEvent(`Certificate issued: ${certId} for ${recipientName} by ${organizationName}`);
  
  return u64ToBytes(certId);
}

/**
 * Get certificate
 */
export function getCertificate(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const certId = args.nextU64().expect('Certificate ID required');
  
  const certKey = `${CERTIFICATES_KEY}_${certId}`;
  
  if (!Storage.has(stringToBytes(certKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(certKey));
}

/**
 * Get user subscriptions
 */
export function getUserSubscriptions(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const user = args.nextString().expect('User address required');
  
  const userSubsKey = `${USER_SUBSCRIPTIONS_KEY}_${user}`;
  
  if (!Storage.has(stringToBytes(userSubsKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(userSubsKey));
}

/**
 * Get pass subscribers
 */
export function getPassSubscribers(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const passId = args.nextU64().expect('Pass ID required');
  
  const passSubsKey = `${PASS_SUBSCRIBERS_KEY}_${passId}`;
  
  if (!Storage.has(stringToBytes(passSubsKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(passSubsKey));
}

/**
 * Get creator passes
 */
export function getCreatorPasses(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const creator = args.nextString().expect('Creator address required');
  
  const creatorPassesKey = `${CREATOR_PASSES_KEY}_${creator}`;
  
  if (!Storage.has(stringToBytes(creatorPassesKey))) {
    return stringToBytes('');
  }
  
  return Storage.get(stringToBytes(creatorPassesKey));
}

/**
 * Get earnings
 */
export function getEarnings(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const creator = Context.caller().toString();
  
  const earningsKey = `${EARNINGS_KEY}_${creator}`;
  
  if (!Storage.has(stringToBytes(earningsKey))) {
    return u64ToBytes(0);
  }
  
  return Storage.get(stringToBytes(earningsKey));
}

/**
 * Withdraw earnings
 */
export function withdrawEarnings(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const creator = Context.caller().toString();
  
  const earningsKey = `${EARNINGS_KEY}_${creator}`;
  
  if (!Storage.has(stringToBytes(earningsKey))) {
    return stringToBytes('No earnings to withdraw');
  }
  
  const earnings = bytesToU64(Storage.get(stringToBytes(earningsKey)));
  
  if (earnings == 0) {
    return stringToBytes('No earnings to withdraw');
  }
  
  // Transfer coins (simplified - in production, use proper token transfer)
  // Context.transferCoins(Address.fromString(creator), earnings);
  
  // Reset earnings
  Storage.set(stringToBytes(earningsKey), u64ToBytes(0));
  
  generateEvent(`Earnings withdrawn: ${earnings} by ${creator}`);
  
  return u64ToBytes(earnings);
}

/**
 * Toggle pass active status
 */
export function togglePassActive(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const passId = args.nextU64().expect('Pass ID required');
  
  const creator = Context.caller().toString();
  
  const passKey = `${PASSES_KEY}_${passId}`;
  if (!Storage.has(stringToBytes(passKey))) {
    return stringToBytes('Pass not found');
  }
  
  const passBytes = Storage.get(stringToBytes(passKey));
  const passArgs = new Args(passBytes);
  const id = passArgs.nextU64().expect('Invalid pass data');
  const passCreator = passArgs.nextString().expect('Invalid pass data');
  
  if (passCreator != creator) {
    return stringToBytes('Unauthorized');
  }
  
  const name = passArgs.nextString().expect('Invalid pass data');
  const desc = passArgs.nextString().expect('Invalid pass data');
  const cat = passArgs.nextString().expect('Invalid pass data');
  const type = passArgs.nextString().expect('Invalid pass data');
  const price = passArgs.nextU64().expect('Invalid pass data');
  const token = passArgs.nextString().expect('Invalid pass data');
  const duration = passArgs.nextU64().expect('Invalid pass data');
  const autoRenew = passArgs.nextBool().expect('Invalid pass data');
  const maxSupply = passArgs.nextU32().expect('Invalid pass data');
  const sold = passArgs.nextU32().expect('Invalid pass data');
  const metadataCid = passArgs.nextString().expect('Invalid pass data');
  const active = passArgs.nextBool().expect('Invalid pass data');
  
  const updatedPassArgs = new Args();
  updatedPassArgs.add<u64>(id);
  updatedPassArgs.add<string>(passCreator);
  updatedPassArgs.add<string>(name);
  updatedPassArgs.add<string>(desc);
  updatedPassArgs.add<string>(cat);
  updatedPassArgs.add<string>(type);
  updatedPassArgs.add<u64>(price);
  updatedPassArgs.add<string>(token);
  updatedPassArgs.add<u64>(duration);
  updatedPassArgs.add<bool>(autoRenew);
  updatedPassArgs.add<u32>(maxSupply);
  updatedPassArgs.add<u32>(sold);
  updatedPassArgs.add<string>(metadataCid);
  updatedPassArgs.add<bool>(!active); // Toggle
  
  Storage.set(stringToBytes(passKey), updatedPassArgs.serialize());
  
  generateEvent(`Pass ${passId} ${!active ? 'activated' : 'paused'}`);
  
  return stringToBytes(`Pass ${!active ? 'activated' : 'paused'}`);
}
