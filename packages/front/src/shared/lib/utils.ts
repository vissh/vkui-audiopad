export const batched = <T>(arr: T[], size: number, limit?: number): T[][] => {
  let [start, end, counter] = [0, size, 0]
  const result: T[][] = []

  while (true) {
    const slice = arr.slice(start, end)

    if (slice.length === 0) {
      break
    }

    result.push(slice)

    counter++

    if ((limit != null) && counter === limit) {
      break
    }

    start = end
    end = start + size
  }

  return result
}
