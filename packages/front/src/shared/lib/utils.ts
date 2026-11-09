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

const parser = new DOMParser()

export const parseFromString = (str: string): Document => {
  // Chrome checks legacy handlers even in detached documents under extension CSP.
  const inert = str.replace(
    /<[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi,
    tag => tag.replace(
      /(\s+)([^\s"'=<>`]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g,
      (attribute: string, space: string, name: string, value: string | undefined) => {
        if (!name.toLowerCase().startsWith('on')) return attribute
        return `${space}data-vkap-inert-${name}${value ?? ''}`
      }
    )
  )
  return parser.parseFromString(inert, 'text/html')
}
