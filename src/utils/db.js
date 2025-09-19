import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import {PermissionsAndroid} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wkx from 'wkx';
import {Polygon} from 'react-native-maps';
SQLite.enablePromise(true);

export async function getDBConnection() {
  try {
    const firstRun = await AsyncStorage.getItem('db_initialisasi');

    const db = await SQLite.openDatabase({
      name: 'utama3.db',
      location: 'default',
    });

    if (!firstRun) {
      console.log('📦 Creating tables...');
      await new Promise((resolve, reject) => {
        db.transaction(
          tx => {
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS project (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama TEXT NOT NULL,
                author TEXT,
                date_created DATE DEFAULT CURRENT_DATE,
                date_modified DATE,
                desc TEXT
              );`,
            );

            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS layers (
                id_layer INTEGER PRIMARY KEY AUTOINCREMENT,
                id_project INTEGER,
                nama TEXT,
                tipe INTEGER, -- 0 for Point, 1 for Polygon, etc.
                table_ref TEXT,
                FOREIGN KEY (id_project) REFERENCES project(id) ON DELETE CASCADE
              );`,
            );

            // Debug for checking tables
            tx.executeSql(
              "SELECT name FROM sqlite_master WHERE type='table'",
              [],
              (_, results) => {
                console.log('📋 Tables found:', results.rows.raw());
              },
            );
          },
          error => {
            console.error('❌ Transaction error:', error);
            reject(error);
          },
          () => {
            console.log('✅ Tables created successfully!');
            resolve();
          },
        );
      });

      await AsyncStorage.setItem('db_initialisasi', 'true');
    } else {
      console.log('✅ Database already exists, skipping init.');
      await new Promise((resolve, reject) => {
        db.transaction(
          tx => {
            tx.executeSql('SELECT * FROM layers;', [], (_, results) => {});
          },
          error => {
            console.error('❌ Error reading from layers table:', error);
            reject(error);
          },
          () => {
            console.log('✅ Reading from layers table successful!');
            resolve();
          },
        );
      });
    }

    return db;
  } catch (error) {
    console.error('❌ Database init failed:', error);
    throw error;
  }
}

// Create Project
export async function createProject(db, name, author, description, callback) {
  if (!db) throw new Error('DB not initialized');

  try {
    const createdAt = new Date().toISOString();
    await db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO project (nama, author, desc, date_created) VALUES (?, ?, ?, ?);`,
        [name, author, description, createdAt],
        (_, result) => {
          console.log('✅ Project inserted:', result);
          if (callback) callback(result.insertId); // result.insertId = new project id
        },
        (_, error) => {
          console.error('❌ Error inserting project:', error);
          return true; // Indicate an error occurred
        },
      );
    });
  } catch (error) {
    console.error('❌ createProject failed:', error);
    throw error;
  }
}

// Get Projects
export const getProjects = async () => {
  const db = await getDBConnection();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM project`,
        [],
        (_, {rows}) => resolve(rows.raw()), // .raw() for direct array
        (_, error) => reject(error),
      );
    });
  });
};

/**
 * Creates a new layer and its dynamic table.
 */
export const createLayer = async (idProject, nama, tableRef, tipe) => {
  const db = await getDBConnection();
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO layers (id_project, nama, tipe, table_ref) VALUES (?, ?, ?, ?)`,
          [idProject, nama, tipe, tableRef],
          (_, result) => resolve({id: result.insertId, tableRef}),
          (_, error) => reject(error),
        );
      },
      error => reject(error),
    );
  });
};

/**
 * Reads layers by project.
 */
export const getLayersByProject = async idProject => {
  const db = await getDBConnection();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM layers WHERE id_project = ?`,
        [idProject],
        (_, {rows}) => {
          const result = rows.raw(); // Easier to work with than rows._array
          resolve(result);
        },
        (_, error) => {
          console.error('❌ Query failed:', error);
          reject(error);
          return false;
        },
      );
    });
  });
};

/**
 * Deletes a project (and its layers).
 */
export const deleteProject = async id => {
  const db = await getDBConnection();
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(`DELETE FROM layers WHERE id_project = ?`, [id]);
        tx.executeSql(`DELETE FROM project WHERE id = ?`, [id], () =>
          resolve(true),
        );
      },
      error => reject(error),
    );
  });
};

export async function exportProject(projectId) {
  try {
    const db = await getDBConnection();

    // 1. Get project data
    const projectData = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM project WHERE id = ?`,
          [projectId],
          (_, {rows}) => resolve(rows._array[0]),
          (_, error) => reject(error),
        );
      });
    });

    // 2. Get all layers for this project
    const layers = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM layers WHERE id_project = ?`,
          [projectId],
          (_, {rows}) => resolve(rows._array),
          (_, error) => reject(error),
        );
      });
    });

    const dataExport = {
      project: projectData,
      layers,
    };

    // 3. Ask user to pick a folder
    const dir = await DocumentPicker.pickDirectory();
    if (!dir) {
      console.log('❌ User cancelled folder selection');
      return;
    }

    // 4. Determine export file name
    const fileName = `${projectData.nama.replace(/\s+/g, '_')}.json`;
    const fileUri = `${dir.uri}/${fileName}`;

    // 5. Write the file
    await RNFS.writeFile(fileUri, JSON.stringify(dataExport, null, 2), 'utf8');

    console.log('✅ Export successful:', fileUri);
    return fileUri;
  } catch (err) {
    console.error('❌ Export failed:', err);
    throw err;
  }
}

// --- NEW FUNCTIONS ADDED ---

/**
 * Fetches all data from a specific layer table.
 * @param {string} tableName - The name of the table to fetch data from.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of data objects.
 */
export const getDataByLayer = async tableName => {
  const db = await getDBConnection();
  console.log(tableName);
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Select all columns, including 'id' and 'geom'
      tx.executeSql(
        `SELECT id, geom, * FROM ${tableName}`, // Using * to get all columns
        [],
        (_, {rows}) => {
          const data = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            const properties = {};
            console.log('asdfasdf');
            console.log(row.geom);
            console.log('asdfasdf');
            // Extract properties, excluding id and geom
            for (const key in row) {
              if (key !== 'id' && key !== 'geom') {
                properties[key] = row[key];
              }
            }
            data.push({
              id: row.id,
              // Decode WKB geometry to coordinates
              geometry: row.geom ? WKBToCoords(row.geom) : null,
              properties: properties,
            });
          }
          resolve(data);
        },
        (_, error) => {
          console.error(`❌ Failed to get data from ${tableName}:`, error);
          reject(error);
          return false;
        },
      );
    });
  });
};

/**
 * Inserts new data into a layer table.
 * @param {string} tableName - The name of the table to insert data into.
 * @param {number} tipeGeometry - The type of geometry (e.g., 0 for Point, 1 for Polygon).
 * @param {Array<Array<number>> | Array<number>} koordinat - The coordinates of the geometry.
 * @param {Object} dataAttribute - An object containing attribute data.
 * @returns {Promise<void>} A promise that resolves when the data is inserted.
 */
export const insertData = async (tableName, koordinat, dataAttribute) => {
  const db = await getDBConnection();

  // Convert coordinates to WKB format

  // Prepare SQL statement and values for attributes
  const attributeKeys = Object.keys(dataAttribute);
  const attributeValues = Object.values(dataAttribute);

  // Construct the INSERT statement dynamically
  const columns = ['geom', ...attributeKeys];
  const placeholders = Array(columns.length).fill('?').join(', ');
  const query = `INSERT INTO ${tableName} (${columns.join(
    ', ',
  )}) VALUES (${placeholders})`;

  try {
    await db.transaction(tx => {
      tx.executeSql(
        query,
        [koordinat, ...attributeValues],
        (_, result) => {
          console.log('✅ Data inserted successfully:', result.insertId);
        },
        (_, error) => {
          console.error('❌ Error inserting data:', error);
          return true; // Indicate an error occurred
        },
      );
    });
  } catch (error) {
    console.error('❌ insertData failed:', error);
    throw error;
  }
};

/**
 * Updates existing data in a layer table.
 * @param {string} tableName - The name of the table to update.
 * @param {number} id - The ID of the record to update.
 * @param {Array<Array<number>> | Array<number>} koordinat - The new coordinates for the geometry.
 * @param {Object} dataAttribute - An object containing the updated attribute data.
 * @returns {Promise<void>} A promise that resolves when the data is updated.
 */
export const updateData = async (tableName, id, koordinat, dataAttribute) => {
  const db = await getDBConnection();

  // Convert coordinates to WKB format
  let wkbGeometry;
  try {
    // Assuming tipeGeometry can be inferred or passed.
    // For now, let's assume it's a Point or Polygon based on usage in Peta.js
    // You might need to refine this part if your layers have different geometry types.
    // For simplicity, let's try to infer from the koordinat structure.
    let tipeGeometry;
    if (Array.isArray(koordinat) && koordinat.length > 0) {
      if (Array.isArray(koordinat[0]) && Array.isArray(koordinat[0][0])) {
        // Polygon-like structure
        tipeGeometry = 1; // Polygon
      } else {
        // Point-like structure or a single point in an array
        tipeGeometry = 0; // Point
      }
    } else {
      throw new Error('Invalid coordinates provided for update.');
    }

    if (
      tipeGeometry === 0 &&
      Array.isArray(koordinat) &&
      koordinat.length === 2
    ) {
      wkbGeometry = coordsToWKB(koordinat, tipeGeometry);
    } else if (
      tipeGeometry === 1 &&
      Array.isArray(koordinat) &&
      koordinat.length >= 3
    ) {
      wkbGeometry = coordsToWKB([koordinat], tipeGeometry);
    } else {
      throw new Error(
        'Invalid coordinates format for geometry type during update.',
      );
    }
  } catch (error) {
    console.error('❌ Error converting coordinates to WKB for update:', error);
    throw error;
  }

  // Prepare attributes for the UPDATE statement
  const attributeUpdates = Object.entries(dataAttribute)
    .map(([key, value]) => `${key} = ?`)
    .join(', ');
  const attributeValues = Object.values(dataAttribute);

  // Construct the UPDATE statement
  // We update geom and all attributes
  const query = `UPDATE ${tableName} SET geom = ?, ${attributeUpdates} WHERE id = ?`;
  const values = [wkbGeometry, ...attributeValues, id];

  try {
    await db.transaction(tx => {
      tx.executeSql(
        query,
        values,
        (_, result) => {
          console.log('✅ Data updated successfully:', result.rowsAffected);
        },
        (_, error) => {
          console.error('❌ Error updating data:', error);
          return true; // Indicate an error occurred
        },
      );
    });
  } catch (error) {
    console.error('❌ updateData failed:', error);
    throw error;
  }
};

/**
 * Deletes a record from a layer table.
 * @param {string} tableName - The name of the table to delete from.
 * @param {number} id - The ID of the record to delete.
 * @returns {Promise<void>} A promise that resolves when the record is deleted.
 */
export const deleteData = async (tableName, id) => {
  const db = await getDBConnection();
  try {
    await db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id],
        (_, result) => {
          console.log('✅ Data deleted successfully:', result.rowsAffected);
        },
        (_, error) => {
          console.error('❌ Error deleting data:', error);
          return true; // Indicate an error occurred
        },
      );
    });
  } catch (error) {
    console.error('❌ deleteData failed:', error);
    throw error;
  }
};

// --- Existing functions ---

export function coordsToWKB(coords, type) {
  let geometry;

  // Ensure 'coords' is in the format expected by wkx
  // For Point: [lng, lat]
  // For Polygon: [[lng, lat], [lng, lat], ...] for the outer ring
  if (type === 'Point') {
    // Point
    console.log(coords);
    if (Array.isArray(coords) && coords.length === 2) {
      geometry = new wkx.Point(coords[0], coords[1]);
    } else {
      throw new Error(
        'Invalid coordinates format for Point. Expected [lng, lat].',
      );
    }
  } else if (type === 'Polygon') {
    // Polygon
    var koordinat = [...coords[0], coords[0].slice(0, 1)].map(
      (e, i) => new wkx.Point(e[0], e[1]),
    );
    console.log(koordinat);
    // console.log(
    //   // koordinat.map(e => ),
    //   // coords[0],
    //   koordinat.slice(0),
    //   Array.isArray(koordinat),
    //   koordinat.length,
    // );
    // console.log(koordinat.map((e, i) => new wkx.Point(e[i][0], e[i][1])));
    if (Array.isArray(koordinat) && koordinat.length >= 3) {
      // wkx.Polygon expects an array of rings, where each ring is an array of points.
      // For a simple polygon, it's usually [[outer_ring], [hole1_ring], ...].
      // Assuming `koordinat` here is already the outer ring: [[lng,lat], ...]
      geometry = new wkx.Polygon(koordinat);
    } else {
      throw new Error(
        'Invalid coordinates format for Polygon. Expected an array of at least 3 points.',
      );
    }
  } else {
    throw new Error('Unsupported geometry type: ' + type);
  }

  return geometry.toWkb(); // Returns a Buffer
}

export function WKBToCoords(wkb) {
  let buffer;

  if (Buffer.isBuffer(wkb)) {
    buffer = wkb;
  } else if (wkb instanceof Uint8Array) {
    buffer = Buffer.from(wkb);
  } else if (typeof wkb === 'string') {
    buffer = Buffer.from(wkb, 'hex');
  } else {
    throw new Error('Unsupported WKB input type');
  }
  console.log(1, wkb.toString('utf-8'));
  const geometry = wkx.Geometry.parse(buffer);
  const geojson = geometry.toGeoJSON();

  if (geojson.type === 'Point') {
    return geojson.coordinates; // [lng, lat]
  } else if (geojson.type === 'Polygon') {
    // For polygons, geojson.coordinates is [[[outer_ring]], [[hole1_ring]], ...]
    // We typically want the outer ring's coordinates.
    return geojson.coordinates[0]; // Returns [[lng, lat], ...] for the outer ring
  } else {
    throw new Error('Geometry type not supported: ' + geojson.type);
  }
}

export const getTableColumns = async tableName => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(`PRAGMA table_info(${tableName});`);

  const columns = [];
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    columns.push({
      name: row.name,
      type: row.type,
      notnull: row.notnull,
      pk: row.pk,
    });
  }
  return columns;
};

// Kept existing functions for completeness
export const getFeaturesByLayer = async tableRef => {
  const db = await getDBConnection();
  const results = await db.executeSql(`SELECT * FROM ${tableRef};`);
  // console.log('123123', await getTableColumns(tableRef));
  const rows = results[0].rows.raw();
  // console.log(rows);
  // const data = [];
  // for (let i = 0; i < rows.length; i++) {
  //   const row = rows.item(i);
  //   data.push({
  //     id_feature: row.id_feature,
  //     id_layer: row.id_layer,
  //     geometry: row.geometry, // this is still BLOB
  //     atribut: row.atribut ? JSON.parse(row.atribut) : {},
  //   });
  // }
  return rows;
};
