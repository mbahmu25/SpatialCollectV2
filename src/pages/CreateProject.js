import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, Button, Alert} from 'react-native';
import {getDBConnection, createProject} from '../utils/db';

export default function CreateProject({navigation}) {
  const [nama, setNama] = useState('');
  const [author, setAuthor] = useState('');
  const [desc, setDesc] = useState('');
  const [db, setDb] = useState(null);

  useEffect(() => {
    getDBConnection().then(setDb);
  }, []);

  const handleSave = async () => {
    if (!db) {
      Alert.alert('Database belum siap');
      return;
    }
    if (!nama.trim()) {
      Alert.alert('Nama project wajib diisi');
      return;
    }

    await createProject(db, nama, author, desc, id => {
      Alert.alert('Berhasil', `Project "${nama}" berhasil dibuat!`);
      navigation.navigate('Project', {projectId: id});
    });
  };

  return (
    <View style={{padding: 20, gap: 12}}>
      <Text>Nama Project</Text>
      <TextInput
        value={nama}
        onChangeText={setNama}
        placeholder="Masukkan nama project"
        style={{borderBottomWidth: 1, marginBottom: 8}}
      />

      <Text>Author</Text>
      <TextInput
        value={author}
        onChangeText={setAuthor}
        placeholder="Masukkan nama pembuat"
        style={{borderBottomWidth: 1, marginBottom: 8}}
      />

      <Text>Deskripsi</Text>
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="Opsional"
        style={{borderBottomWidth: 1, marginBottom: 8}}
      />

      <Button title="💾 Simpan Project" onPress={handleSave} />
    </View>
  );
}
