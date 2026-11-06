export const versionParts = (version) => {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/.test(version) ||
    version.split('.').some(part => Number(part) > 65535) || version.split('.').every(part => Number(part) === 0)) {
    throw new Error('Manifest version must have 1–4 numeric components (0–65535), no leading zeros, and not be all zero.')
  }
  return [...version.split('.').map(Number), 0, 0, 0].slice(0, 4)
}

export const compareVersions = (left, right) => {
  const a = versionParts(left)
  const b = versionParts(right)
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) return Math.sign(a[i] - b[i])
  }
  return 0
}
