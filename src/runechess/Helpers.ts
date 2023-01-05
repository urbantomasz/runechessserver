export function rotateMatrix90(matrix: any[][]): any{
    return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
}

export function create2DArray(rows: number, columns: number, initialValue: any): any[][] {
    const array = [];
    for (let i = 0; i < rows; i++) {
      array.push(new Array(columns).fill(initialValue));
    }
    return array;
  }