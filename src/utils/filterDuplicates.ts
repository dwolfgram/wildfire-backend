export function filterDuplicates<T>(array: T[], key: keyof T) {
  if (!array) return []
  const seen = new Set()
  return array.filter((obj) => {
    const duplicate = seen.has(obj[key])
    seen.add(obj[key])
    return !duplicate
  })
}
