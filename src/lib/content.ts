import seed from '../data/content-seed.json';

export const content = seed;

export const publicProfile = content.publicProfile;
export const publishGate = content.publishGate;

export const notes = [...content.notes];
export const approvedNotes = notes.filter((note) => note.publicReviewStatus === 'approved');
export const bridgeNotes = notes.filter((note) => note.publicReviewStatus !== 'approved');
export const repositories = [...content.repositories].sort(
  (left, right) => left.displayPriority - right.displayPriority
);
export const approvedRepositories = repositories.filter(
  (repo) => repo.publicReviewStatus === 'approved'
);
export const careerCaseStudies = [...content.careerCaseStudies];
export const approvedCareerCaseStudies = careerCaseStudies.filter(
  (study) => study.publicReviewStatus === 'approved'
);
export const careerTimeline = [...content.careerTimeline];
export const approvedCareerTimeline = careerTimeline.filter(
  (item) => item.publicReviewStatus === 'approved'
);
export const writing = [...content.writing];
export const approvedWriting = writing.filter((item) => item.publicReviewStatus === 'approved');

export const hasPublishBlockers =
  publishGate.status !== 'approved' ||
  publishGate.needsHumanReview ||
  publishGate.blockingReasons.length > 0 ||
  publishGate.requiredApprovals.length > 0;

export function getEvidenceLabels(refs: string[]) {
  const repoNames = new Set(approvedRepositories.map((repo) => repo.name));
  return refs.map((ref) => {
    if (repoNames.has(ref)) return ref;
    return approvedCareerCaseStudies.find((study) => study.slug === ref)?.title ?? ref;
  });
}

export function getEvidenceTargets(refs: string[]) {
  return refs.map((ref) => {
    const repository = approvedRepositories.find((repo) => repo.name === ref);
    if (repository) {
      return {
        label: repository.name,
        href: `/projects/${repository.name}/`,
        kind: 'repository'
      };
    }

    const caseStudy = approvedCareerCaseStudies.find((study) => study.slug === ref);
    return {
      label: caseStudy?.title ?? ref,
      href: '/career/',
      kind: 'career'
    };
  });
}

export function getNotePath(slug: string) {
  return `/notes/${slug}/`;
}

export function getProjectPath(name: string) {
  return `/projects/${name}/`;
}
