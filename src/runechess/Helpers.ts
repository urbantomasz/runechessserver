export function rotateMatrix90(matrix: any[][]): any {
  return matrix[0].map((val, index) =>
    matrix.map((row) => row[index]).reverse()
  );
}

export function create2DArray(
  rows: number,
  columns: number,
  initialValue: any
): any[][] {
  const array = [];
  for (let i = 0; i < rows; i++) {
    array.push(new Array(columns).fill(initialValue));
  }
  return array;
}

// export const mapToObject = <K extends string, V>(map: Map<K, V>): Record<K, V> => {
//   return Object.fromEntries(map.entries());
// }
