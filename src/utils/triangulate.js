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

function latLonAltToMercator(latDeg, lonDeg, alt = 0) {
  const R = 6378137.0; // radius bumi WGS84 dalam meter
  const a = 6378137.0; // semi-major axis
  const f = 1 / 298.257223563; // flattening
  const e2 = 2 * f - f * f; // eccentricity squared

  // Konversi ke radian
  const lat = (latDeg * Math.PI) / 180.0;
  const lon = (lonDeg * Math.PI) / 180.0;

  // Radius kurvatur di prime vertical
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);

  const RN = a / Math.sqrt(1 - e2 * sinLat * sinLat);

  // Rumus transformasi
  const x = (RN + alt) * cosLat * cosLon;
  const y = (RN + alt) * cosLat * sinLon;
  const z = ((1 - e2) * RN + alt) * sinLat;
  return [x, y, z];
}

function cartesianToLatLonAlt(x, y, z) {
  const a = 6378137.0; // semi-major axis WGS84
  const f = 1 / 298.257223563; // flattening
  const e2 = 2 * f - f * f; // eccentricity squared
  const b = a * (1 - f); // semi-minor axis

  const lon = Math.atan2(y, x);

  const p = Math.sqrt(x * x + y * y);
  let lat = Math.atan2(z, p * (1 - e2)); // initial guess
  let N, alt;

  // Iteratif sampai konvergen
  for (let i = 0; i < 50; i++) {
    const sinLat = Math.sin(lat);
    N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    alt = p / Math.cos(lat) - N;
    const newLat = Math.atan2(z + e2 * N * sinLat, p);
    if (Math.abs(newLat - lat) < 1e-12) {
      lat = newLat;
      break;
    }
    lat = newLat;
  }

  // Ubah ke derajat
  const latDeg = (lat * 180.0) / Math.PI;
  const lonDeg = (lon * 180.0) / Math.PI;

  return [lonDeg, latDeg, alt];
}

// Jika menggunakan Node.js
const numeric = require('numeric');

export function triangulateNumeric(coordInput, r, options = {}) {
  var coord = coordInput;
  console.log(coord);
  const maxIter = options.maxIter ?? 100;
  const tol = options.tol ?? 1e-8;
  const lambda = options.lambda ?? 1e-3; // Damping parameter (optional)

  // if (coord.length !== 4 || r.length !== 4) {
  //   throw new Error('Input harus memiliki 3 titik dan 3 jarak.');
  // }

  // Tebakan awal: rata-rata dari koordinat
  var X0 = numeric.div(numeric.add.apply(null, coord), r.length);

  // X0 = [227, 340, 209];
  X0[2] -= r[0] * 1.75; // dengan asumsi kemiringan antara 0-45
  console.log(X0);
  coord = coordInput.map((e, i) => latLonAltToMercator(e[1], e[0], e[2]));

  let X = X0.slice(); // Salin array agar tidak berubah

  for (let iter = 0; iter < maxIter; iter++) {
    const A = [];
    const D = [];

    for (let i = 0; i < coord.length; i++) {
      const dx = X[0] - coord[i][0];
      const dy = X[1] - coord[i][1];
      const dz = X[2] - coord[i][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      A.push([dx / dist, dy / dist, dz / dist]);
      D.push([r[i] - dist]);
    }

    // Hitung bMat = (A^T * A)^(-1) * A^T * D
    let bMat;
    try {
      const At = numeric.transpose(A);
      const JtJ = numeric.dot(At, A);
      const JtD = numeric.dot(At, D);
      const JtJ_damped = numeric.add(
        JtJ,
        numeric.mul(lambda, numeric.identity(3)),
      );

      const JtJ_inv = numeric.inv(JtJ_damped);
      bMat = numeric.dot(JtJ_inv, JtD);
    } catch (e) {
      console.warn('Inversi matriks gagal. Mengembalikan tebakan awal.');
      return X0;
    }

    const b = bMat.map(row => row[0]);
    if (numeric.norm2(b) < tol) {
      break;
    }
    // console.log(b, numeric.add(X, b));
    // Perbarui X = X + b

    X = numeric.add(X, b);
  }
  return cartesianToLatLonAlt(X[0], X[1], X[2]);
}

export function triangulateNumericExtreme(coordInput, r, options = {}) {
  var coord = coordInput.map((e, i) => latLonAltToMercator(e[1], e[0], e[2]));
  // console.log(coord);
  const maxIter = options.maxIter ?? 100;
  const tol = options.tol ?? 1e-8;
  const lambda = options.lambda ?? 1e-3; // Damping parameter (optional)

  // Tebakan awal: rata-rata dari koordinat
  var X0 = numeric.div(numeric.add.apply(null, coord), r.length);

  // coord = coordInput.map((e, i) => latLonAltToMercator(e[1], e[0], e[2]));
  let X = X0.slice(); // Salin array agar tidak berubah

  for (let iter = 0; iter < maxIter; iter++) {
    const A = [];
    const D = [];

    for (let i = 0; i < coord.length; i++) {
      const dx = X[0] - coord[i][0];
      const dy = X[1] - coord[i][1];
      const dz = X[2] - coord[i][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      A.push([dx / dist, dy / dist, dz / dist]);
      D.push([r[i] - dist]);
    }

    // Hitung bMat = (A^T * A)^(-1) * A^T * D
    let bMat;
    try {
      const At = numeric.transpose(A);
      const JtJ = numeric.dot(At, A);
      const JtD = numeric.dot(At, D);
      const JtJ_damped = numeric.add(
        JtJ,
        numeric.mul(lambda, numeric.identity(3)),
      );

      const JtJ_inv = numeric.inv(JtJ_damped);
      bMat = numeric.dot(JtJ_inv, JtD);
    } catch (e) {
      console.warn('Inversi matriks gagal. Mengembalikan tebakan awal.');
      return X0;
    }

    const b = bMat.map(row => row[0]);
    if (numeric.norm2(b) < tol) {
      break;
    }
    X = numeric.add(X, b);
  }
  return cartesianToLatLonAlt(X[0], X[1], X[2]);
}
