import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import {getLayersByProject} from '../utils/db';
import tw from 'twrnc';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/AntDesign';

export default function LayerList({route, navigation}) {
  const {projectId} = route.params;
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    if (projectId) {
      loadLayers();
    }
  }, [projectId]);

  const loadLayers = async () => {
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
    console.log(await RNFS.readDir(RNFS.DocumentDirectoryPath + '/project/'));
    try {
      console.log('🔍 Loading layers for project:', projectId);
      const data = await getLayersByProject(projectId); // ⬅️ PAKAI await
      console.log('✅ Layers loaded:', data);
      setLayers(data);
    } catch (err) {
      console.error('❌ Failed to load layers:', err);
    }
  };
  console.log('data', layers);
  const bukaProject = project => {
    console.log(`${RNFS.DocumentDirectoryPath}/project/${project}.geojson`);
    navigation.navigate('Peta', {
      path: `${RNFS.DocumentDirectoryPath}/project/${project}.geojson`,
    });
  };
  return (
    <View style={tw`flex-1`}>
      <View style={tw`flex-row justify-between items-center px-4 py-3`}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon name="arrowleft" size={24} />
        </Pressable>
        <Text style={tw`text-lg font-bold`}>Daftar Layer</Text>
        <Pressable
          onPress={() =>
            navigation.navigate('CreateLayer', {projectId, refresh: loadLayers})
          }>
          <Icon name="pluscircle" size={24} color="skyblue" />
        </Pressable>
      </View>

      <FlatList
        data={layers}
        keyExtractor={item => item.id_layer.toString()}
        renderItem={({item}) => (
          <Pressable
            style={tw`px-4 py-3 border-b border-gray-300`}
            onPress={() => bukaProject(item.table_ref)}>
            <Text style={tw`text-black font-semibold`}>{item.nama}</Text>
            <Text style={tw`text-xs text-gray-500`}>
              Table: {item.table_ref}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
