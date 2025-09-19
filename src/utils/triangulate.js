function ZeroMat(n, m) {
  const res = [];
  for (let i = 0; i < n; i++) res.push(Array(m).fill(0));
  return res;
}

function Transpose(mat) {
  return mat[0].map((_, i) => mat.map(row => row[i]));
}

function Mult(mat1, mat2) {
  if (mat1[0].length !== mat2.length) {
    throw new Error('Matrix dimensions do not match for multiplication.');
  }
  const res = ZeroMat(mat1.length, mat2[0].length);
  for (let i = 0; i < mat1.length; i++) {
    for (let j = 0; j < mat2[0].length; j++) {
      for (let k = 0; k < mat1[0].length; k++) {
        res[i][j] += mat1[i][k] * mat2[k][j];
      }
    }
  }
  return res;
}

function Add(mat1, mat2) {
  // Support vector + vector or matrix + matrix
  if (!Array.isArray(mat1[0])) {
    // vector case
    return mat1.map(
      (v, i) => v + (Array.isArray(mat2[i]) ? mat2[i][0] : mat2[i]),
    );
  }
  const res = ZeroMat(mat1.length, mat1[0].length);
  for (let i = 0; i < res.length; i++) {
    for (let j = 0; j < res[i].length; j++) {
      res[i][j] = mat1[i][j] + mat2[i][j];
    }
  }
  return res;
}

function Determinant(matrix) {
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('Matrix must be square');
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  const getMinor = (m, row, col) =>
    m.filter((_, i) => i !== row).map(r => r.filter((_, j) => j !== col));

  let det = 0;
  for (let col = 0; col < n; col++) {
    const sign = col % 2 === 0 ? 1 : -1;
    det += sign * matrix[0][col] * Determinant(getMinor(matrix, 0, col));
  }
  return det;
}

function Adjoint(matrix) {
  const n = matrix.length;
  const adj = Array.from({length: n}, () => Array(n).fill(0));

  const getMinor = (m, row, col) =>
    m.filter((_, i) => i !== row).map(r => r.filter((_, j) => j !== col));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      adj[j][i] = sign * Determinant(getMinor(matrix, i, j)); // transpose here
    }
  }
  return adj;
}

function Inverse(matrix) {
  if (matrix.length !== 3 || matrix.some(r => r.length !== 3)) {
    throw new Error('Matrix must be 3x3');
  }
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (det === 0) throw new Error('Matrix is singular');

  const adj = [
    [e * i - f * h, -(b * i - c * h), b * f - c * e],
    [-(d * i - f * g), a * i - c * g, -(a * f - c * d)],
    [d * h - e * g, -(a * h - b * g), a * e - b * d],
  ];
  return adj.map(row => row.map(v => v / det));
}

function Mean(mat) {
  const res = Array(mat[0].length).fill(0);
  for (let i = 0; i < mat.length; i++) {
    for (let j = 0; j < mat[0].length; j++) {
      res[j] += mat[i][j];
    }
  }
  return res.map(v => v / mat.length);
}

function norm(vec) {
  return Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
}

function latLonAltToMercator(lat, lon, alt = 0) {
  const R = 6378137.0; // radius bumi WGS84 dalam meter

  // konversi derajat ke radian
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;

  // hitung koordinat mercator
  const x = R * λ;
  const y = R * Math.log(Math.tan(Math.PI / 4 + φ / 2));
  const z = alt; // langsung dipakai

  return [x, y, z];
}

export function Triangulate(coord, h) {
  var data = coord.map(e => latLonAltToMercator(e[0], e[1], e[2]));
  console.log(data, h);
  if (data.length === 3) {
    let X = Mean(data);
    const maxIter = 100;
    const tol = 1e-6;

    for (let iter = 0; iter < maxIter; iter++) {
      const A = [];
      for (let i = 0; i < data.length; i++) {
        const dx = X[0] - data[i][0];
        const dy = X[1] - data[i][1];
        const dz = X[2] - data[i][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        A.push([dx / dist, dy / dist, dz / dist]);
      }

      const D = data.map(e => [
        Math.sqrt(h) -
          Math.sqrt(
            (X[0] - e[0]) ** 2 + (X[1] - e[1]) ** 2 + (X[2] - e[2]) ** 2,
          ),
      ]);
      var bMat = [];
      try {
        bMat = Mult(Inverse(Mult(Transpose(A), A)), Mult(Transpose(A), D));
      } catch (error) {
        return Mean(coord);
      }

      const b = bMat.map(row => row[0]);

      if (norm(b) < tol) {
        break;
      }

      X = Add(X, b);
    }
    return X;
  } else {
    throw console.error('titik harus 3');
    return null;
  }
}
