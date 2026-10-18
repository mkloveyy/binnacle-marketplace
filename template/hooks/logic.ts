/** Pure parts, tested without binnacle (claude plugin test loads no dependency: tests/binnacle-mock.tsx stands in). */
export const greeting = (presses: number, loud: boolean): string => {
  const text = presses === 1 ? 'hello, once' : `hello, ${presses} times`
  return loud ? text.toUpperCase() : text
}
