import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import {createLayer} from '../utils/db';
import SelectDropdown from 'react-native-select-dropdown';
import tw from 'twrnc';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/AntDesign';

export default function CreateLayer({route, navigation}) {
  const {projectId, refresh} = route.params;
  const [namaLayer, setNamaLayer] = useState('');
  const [namaLayerState, setNamaLayerState] = useState('');
  const [daftarProject, setDaftarProject] = useState([]);
  const [tipeGeom, setTipeGeom] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('');

  // useEffect(() => {

  //   var nama = namaLayerState + '.geojson';
  // }, [namaProject]);

  var buatProject = async filename => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
    } catch (err) {
      console.warn(err);
    }

    const readGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    const writeGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    if (!readGranted || !writeGranted) {
      console.log('Read and write permissions have not been granted');
      return;
    }

    var properties = {};
    fields.map(e => {
      if (e.tipe != 'image') {
        return (properties[e.nama] = '');
      } else {
        properties[e.nama] = {};
      }
    });
    var koordinat;
    if (tipeGeom == 'Point') {
      koordinat = [0, 0];
    } else if (tipeGeom == 'Polygon') {
      koordinat = [[[[0, 0]]]];
    }

    var data = {
      type: 'FeatureCollection',
      name: namaLayer,
      crs: {type: 'name', properties: {name: 'urn:ogc:def:crs:OGC:1.3:CRS84'}},
      features: [
        {
          type: 'Feature',
          properties: properties,
          geometry: {type: tipeGeom, coordinates: koordinat},
        },
      ],
    };

    const dirPath = `${RNFS.DocumentDirectoryPath}/project`;
    const filePath = `${dirPath}/${filename}.geojson`;

    try {
      // Pastikan folder ada
      const exists = await RNFS.exists(dirPath);
      if (!exists) {
        await RNFS.mkdir(dirPath);
      }

      // Tulis file
      await RNFS.writeFile(filePath, JSON.stringify(data), 'utf8');
      console.log('SUCCESS: File created at', filePath);

      navigation.navigate('Peta', {path: filePath});
    } catch (err) {
      console.log('Gagal membuat project:', err.message);
    }
  };
  const addField = () => {
    if (!fieldName || !fieldType) return;
    setFields([...fields, {nama: fieldName, tipe: fieldType}]);
    setFieldName('');
    setFieldType('');
  };
  const buatLayer = async () => {
    try {
      console.log('🆕 Creating layer:', namaLayer, tipeGeom);
      var nama = `${namaLayer}_${projectId}_${Date.now()}`;
      console.log('nama file :', namaLayer, projectId, Date.now());
      setNamaLayerState(nama);
      await createLayer(projectId, namaLayer, nama, tipeGeom); // ⬅️ pakai await
      buatProject(nama);
      if (refresh) refresh(); // panggil refresh list di page sebelumnya
      navigation.goBack();
    } catch (err) {
      console.error('❌ Failed to create layer:', err);
    }
  };

  return (
    <ScrollView style={tw`flex-1 p-4`}>
      <Text style={tw`font-bold text-lg`}>Buat Layer</Text>

      <TextInput
        placeholder="Nama Layer"
        value={namaLayer}
        onChangeText={setNamaLayer}
        style={tw`bg-gray-200 p-2 mt-3 rounded`}
      />

      <Text style={tw`mt-3`}>Tipe Geometry</Text>
      <SelectDropdown
        data={['Point', 'Polygon']}
        onSelect={selectedItem => setTipeGeom(selectedItem)}
        buttonStyle={tw`bg-gray-200 w-full mt-2`}
      />

      <Text style={tw`mt-3`}>Tambahkan Kolom</Text>
      <View style={tw`flex-row mt-2`}>
        <TextInput
          placeholder="Nama kolom"
          value={fieldName}
          onChangeText={setFieldName}
          style={tw`bg-gray-200 flex-1 p-2 mr-2 rounded`}
        />
        <SelectDropdown
          data={['TEXT', 'INTEGER', 'REAL', 'Image']}
          onSelect={selectedItem => setFieldType(selectedItem)}
          defaultButtonText="Tipe"
          buttonStyle={tw`bg-gray-200`}
        />
        <Pressable onPress={addField} style={tw`ml-2 bg-sky-500 p-2 rounded`}>
          <Icon name="plus" size={20} color="white" />
        </Pressable>
      </View>

      {fields.map((f, i) => (
        <View
          key={i}
          style={tw`flex-row justify-between mt-2 bg-gray-100 p-2 rounded`}>
          <Text>
            {f.nama} ({f.tipe})
          </Text>
        </View>
      ))}

      <Pressable onPress={buatLayer} style={tw`bg-sky-600 p-3 mt-5 rounded`}>
        <Text style={tw`text-center text-white`}>Buat Layer</Text>
      </Pressable>
    </ScrollView>
  );
}
