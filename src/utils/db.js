import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import {PermissionsAndroid} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScopedStorage from 'react-native-scoped-storage';
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

export async function exportProject(projectId, projectName) {
  try {
    const layers = await getLayersByProject(projectId);

    const dir = await ScopedStorage.openDocumentTree(true); // pilih folder
    if (!dir) {
      console.log('❌ User batal pilih folder');
      return;
    }

    // Buat folder project di dalam folder yang dipilih
    const projectFolder = await ScopedStorage.createDirectory(
      dir.uri,
      projectName.replace(/\s+/g, '_'),
    );

    for (const layer of layers) {
      const fileName = `${String(layer.table_ref)}.geojson`;
      const sourcePath = `${RNFS.DocumentDirectoryPath}/project/${fileName}`;

      try {
        const fileContent = await RNFS.readFile(sourcePath, 'utf8');
        await ScopedStorage.writeFile(
          projectFolder.uri,
          fileContent,
          fileName,
          'application/json',
        );
        console.log(`✅ Copied layer: ${fileName}`);
      } catch (err) {
        console.error(`❌ Gagal copy ${fileName}:`, err);
      }
    }

    console.log('🎉 Export selesai ke folder:', projectFolder.uri);
    return projectFolder.uri;
  } catch (err) {
    console.error('❌ Export failed:', err);
    throw err;
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
