export function shouldSeedImageBeCover({ imageIndex, existingCoverImageId, seedImageId }) {
  if (imageIndex !== 0) {
    return false;
  }

  return !existingCoverImageId || existingCoverImageId === seedImageId;
}
