import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const seedPath = join(repoRoot, 'src', 'data', 'content-seed.json');
const publishMode = process.argv.includes('--publish');

function patternFromCodePoints(codePoints, flags = '') {
  return new RegExp(String.fromCodePoint(...codePoints), flags);
}

const forbiddenPatterns = [
  patternFromCodePoints([0x46, 0x44, 0x45], 'i'),
  patternFromCodePoints([0x50, 0x61, 0x6c, 0x61, 0x6e, 0x74, 0x69, 0x72], 'i'),
  patternFromCodePoints([0xd314, 0xb780, 0xd2f0, 0xc5b4]),
  patternFromCodePoints([0xc0ac, 0xb0b4, 0x20, 0xc5c5, 0xbb34]),
  patternFromCodePoints([0xd68c, 0xc0ac, 0x20, 0xb0b4, 0xbd80]),
  patternFromCodePoints([0x41, 0x49, 0x20, 0x41, 0x67, 0x65, 0x6e, 0x74, 0x20, 0xac1c, 0xbc1c, 0xd300]),
  patternFromCodePoints([0x41, 0x67, 0x65, 0x6e, 0x74, 0x20, 0x44, 0x65, 0x76, 0x65, 0x6c, 0x6f, 0x70, 0x65, 0x72]),
  patternFromCodePoints([0xb0b4, 0xbd80, 0x20, 0xd504, 0xb808, 0xc784, 0xc6cc, 0xd06c]),
  patternFromCodePoints([0x55, 0x43, 0x75, 0x62, 0x65], 'i'),
  patternFromCodePoints([0x77, 0x61, 0x66, 0x66, 0x75, 0x6c], 'i'),
  patternFromCodePoints([0x62, 0x73, 0x73, 0x2d, 0x63, 0x6f, 0x6e, 0x74, 0x72, 0x61, 0x63, 0x74, 0x2d, 0x71, 0x75, 0x65, 0x72, 0x79], 'i'),
  patternFromCodePoints([0x52, 0x65, 0x73, 0x75, 0x6d, 0x65], 'i'),
  patternFromCodePoints([0xacf5, 0xac1c, 0x20, 0xc774, 0xb825, 0xc11c]),
  patternFromCodePoints([0xacbd, 0xb825, 0x20, 0xc694, 0xc57d])
];

function asArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }
  return value;
}

function requireField(object, field, path, errors) {
  if (!(field in object)) {
    errors.push(`${path}.${field} is required`);
  }
}

function collectStrings(value, path = '$', output = []) {
  if (typeof value === 'string') {
    output.push([path, value]);
    try {
      const decoded = decodeURIComponent(value);
      if (decoded !== value) output.push([`${path} decoded`, decoded]);
    } catch {
      // Non-URI strings are fine; they are checked as-is.
    }
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => collectStrings(item, `${path}.${key}`, output));
  }
  return output;
}

function validateReviewStatus(collectionName, items, errors) {
  items.forEach((item, index) => {
    if (!['needs-review', 'approved', 'redacted'].includes(item.publicReviewStatus)) {
      errors.push(`${collectionName}[${index}].publicReviewStatus must be needs-review, approved, or redacted`);
    }
  });
}

const raw = await readFile(seedPath, 'utf8');
const seed = JSON.parse(raw);
const errors = [];
const warnings = [];

const publicProfile = seed.publicProfile ?? {};
const notes = asArray(seed.notes, 'notes', errors);
const repositories = asArray(seed.repositories, 'repositories', errors);
const careerCaseStudies = asArray(seed.careerCaseStudies, 'careerCaseStudies', errors);
const careerTimeline = asArray(seed.careerTimeline, 'careerTimeline', errors);
const writing = asArray(seed.writing, 'writing', errors);
const publishGate = seed.publishGate ?? {};

for (const field of ['name', 'headline', 'shortBio', 'philosophy', 'focus', 'publicLinks', 'sensitiveOmissions', 'publicReviewStatus']) {
  requireField(publicProfile, field, 'publicProfile', errors);
}

validateReviewStatus('publicProfile', [publicProfile], errors);
validateReviewStatus('notes', notes, errors);
validateReviewStatus('repositories', repositories, errors);
validateReviewStatus('careerCaseStudies', careerCaseStudies, errors);
validateReviewStatus('careerTimeline', careerTimeline, errors);
validateReviewStatus('writing', writing, errors);

const repositoryNames = new Set(repositories.map((repo) => repo.name));
const caseStudySlugs = new Set(careerCaseStudies.map((study) => study.slug));
const validEvidenceRefs = new Set([...repositoryNames, ...caseStudySlugs]);

notes.forEach((note, index) => {
  for (const field of ['slug', 'title', 'kind', 'status', 'summary', 'tags', 'linkedEvidence']) {
    requireField(note, field, `notes[${index}]`, errors);
  }
  if (note.status === 'published' && !note.url) {
    errors.push(`notes[${index}] is published but has no url`);
  }
  asArray(note.linkedEvidence ?? [], `notes[${index}].linkedEvidence`, errors).forEach((ref) => {
    if (!validEvidenceRefs.has(ref)) {
      errors.push(`notes[${index}].linkedEvidence references missing target: ${ref}`);
    }
  });
});

repositories.forEach((repo, index) => {
  for (const field of ['name', 'url', 'visibility', 'language', 'updatedAt', 'role', 'summary', 'tags', 'displayPriority']) {
    requireField(repo, field, `repositories[${index}]`, errors);
  }
  if (repo.visibility !== 'public') {
    errors.push(`repositories[${index}].visibility must be public`);
  }
});

careerCaseStudies.forEach((study, index) => {
  for (const field of ['slug', 'title', 'organization', 'period', 'summary', 'proof', 'tags', 'source']) {
    requireField(study, field, `careerCaseStudies[${index}]`, errors);
  }
});

careerTimeline.forEach((item, index) => {
  for (const field of ['period', 'organization', 'role', 'summary', 'tags']) {
    requireField(item, field, `careerTimeline[${index}]`, errors);
  }
});

writing.forEach((item, index) => {
  for (const field of ['title', 'kind', 'summary', 'tags', 'linkedCaseStudy']) {
    requireField(item, field, `writing[${index}]`, errors);
  }
  if (item.kind === 'external' && !item.url) {
    errors.push(`writing[${index}] is external but has no url`);
  }
  if (!caseStudySlugs.has(item.linkedCaseStudy)) {
    errors.push(`writing[${index}].linkedCaseStudy references missing target: ${item.linkedCaseStudy}`);
  }
});

for (const field of ['status', 'needsHumanReview', 'blockingReasons', 'requiredApprovals', 'excluded']) {
  requireField(publishGate, field, 'publishGate', errors);
}

if (!['blocked', 'approved'].includes(publishGate.status)) {
  errors.push('publishGate.status must be blocked or approved');
}

for (const [path, value] of collectStrings(seed)) {
  for (const [patternIndex, pattern] of forbiddenPatterns.entries()) {
    if (pattern.test(value)) {
      errors.push(`forbidden public content matched at ${path}: pattern #${patternIndex + 1}`);
    }
  }
}

const gateBlocked =
  publishGate.status !== 'approved' ||
  publishGate.needsHumanReview ||
  (publishGate.blockingReasons?.length ?? 0) > 0 ||
  (publishGate.requiredApprovals?.length ?? 0) > 0;

if (gateBlocked) {
  const reason = `publish gate is blocked: status=${publishGate.status}, needsHumanReview=${publishGate.needsHumanReview}, blockingReasons=${publishGate.blockingReasons?.length ?? 0}, requiredApprovals=${publishGate.requiredApprovals?.length ?? 0}`;
  if (publishMode) {
    errors.push(reason);
  } else {
    warnings.push(reason);
  }
}

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `[content warning] ${warning}`).join('\n'));
}

if (errors.length > 0) {
  console.error(errors.map((error) => `[content error] ${error}`).join('\n'));
  process.exit(1);
}

console.log(`content validation passed${publishMode ? ' for publish' : ''}`);
