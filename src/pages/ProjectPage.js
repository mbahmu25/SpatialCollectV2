import {
  View,
  Text,
  Pressable,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/AntDesign';
// import SweetAlert from 'react-native-sweet-alert';
import * as ScopedStorage from 'react-native-scoped-storage';
import RNFS from 'react-native-fs';
import {getDBConnection, getProjects, exportProject} from '../utils/db';

// Aktifkan animasi untuk Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProjectPage = ({navigation}) => {
  const [daftarProject, setDaftarProject] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const db = await getDBConnection();
      const projects = await getProjects(db);
      setDaftarProject(projects);
    } catch (err) {
      console.log('Error load projects:', err);
      setDaftarProject([]);
    }
  };

  const toggleExpand = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const bukaProject = project => {
    navigation.navigate('Peta', {
      projectId: project.id,
      projectName: project.nama,
    });
  };

  const bukaProjectLayer = project => {
    navigation.navigate('LayerList', {
      projectId: project.id,
      projectName: project.nama,
    });
  };

  const hapusProject = project => {
    Alert.alert(
      'Hapus Project',
      `Yakin mau hapus project "${project.nama}"? Semua layer akan ikut terhapus.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDBConnection();
              await db.executeSql('DELETE FROM layers WHERE id_project = ?;', [
                project.id,
              ]);
              await db.executeSql('DELETE FROM project WHERE id = ?;', [
                project.id,
              ]);
              loadProjects();
            } catch (err) {
              console.log('Gagal hapus project:', err);
            }
          },
        },
      ],
    );
  };
  var ExportProject = async () => {
    var dir = await ScopedStorage.openDocumentTree(true);
    var dataProject;
    await RNFS.readFile(option['uri'], 'ascii')
      .then(res => {
        dataProject = res;
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
    var nama = option['uri'].split('/').pop();
    await ScopedStorage.writeFile(
      dir.uri,
      dataProject,
      nama,
      'application/json',
    )
      .then(success => {
        // SweetAlert.showAlertWithOptions({
        //   title: 'Project berhasil diexport',
        //   subTitle: 'Tekan tombol Ok untuk menutup',
        //   style: 'success',
        //   cancellable: true,
        // });
        console.log('sukses');
      })
      .catch(err => {
        console.log('gagal');
      });
  };
  return (
    <View style={tw`h-full bg-gray-100`}>
      {/* HEADER */}
      <View style={tw`flex-row items-center px-4 py-3 bg-sky-700`}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Icon name="arrowleft" size={25} color="white" />
        </Pressable>
        <Text style={tw`text-white ml-2 text-lg font-medium`}>
          Daftar Project
        </Text>
      </View>

      {/* LIST PROJECT */}
      <View style={tw`flex-1 px-3 mt-3`}>
        {daftarProject.length > 0 ? (
          daftarProject.map(project => {
            const expanded = expandedId === project.id;
            return (
              <View
                key={project.id}
                style={tw`bg-white rounded-2xl p-4 mb-3 shadow`}>
                {/* Row utama */}
                <View style={tw`flex-row justify-between items-center`}>
                  <Pressable
                    onPress={() => bukaProjectLayer(project)}
                    style={tw`flex-1`}>
                    <Text style={tw`text-lg font-bold text-black`}>
                      {project.nama}
                    </Text>
                  </Pressable>

                  <View style={tw`flex-row gap-2 items-center`}>
                    {/* <Pressable onPress={() => bukaProjectLayer(project)}>
                      <Icon
                        name={expanded ? 'up' : 'layers'}
                        size={22}
                        color="black"
                      />
                    </Pressable> */}
                    <Pressable onPress={() => toggleExpand(project.id)}>
                      <Icon
                        name={expanded ? 'up' : 'infocirlceo'}
                        size={22}
                        color="black"
                      />
                    </Pressable>

                    <Pressable
                      style={tw`px-2`}
                      onPress={async () => {
                        try {
                          const filePath = await exportProject(project.id);
                          if (filePath) {
                            Alert.alert(
                              'Berhasil diexport',
                              `File disimpan di:\n${filePath}`,
                            );
                          }
                        } catch (e) {
                          Alert.alert('Gagal export', e.message);
                        }
                      }}>
                      <Icon name="export" size={20} color="gray" />
                    </Pressable>

                    <Pressable
                      style={tw`px-2`}
                      onPress={() => hapusProject(project)}>
                      <Icon name="delete" size={20} color="red" />
                    </Pressable>
                  </View>
                </View>

                {/* Dropdown detail */}
                {expanded && (
                  <View style={tw`mt-3 border-t border-gray-200 pt-3`}>
                    <Text style={tw`text-gray-700`}>
                      👤 Author: {project.author || 'N/A'}
                    </Text>
                    <Text style={tw`text-gray-700`}>
                      🗓 Dibuat: {project.date_created}
                    </Text>
                    <Text style={tw`text-gray-700`}>
                      📄 Deskripsi: {project.desc || 'Tidak ada deskripsi'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={tw`mt-4`}>
            <Text style={tw`text-gray-500 text-center`}>
              Belum ada project. Klik tombol + untuk membuat project baru.
            </Text>
          </View>
        )}
      </View>

      {/* FLOATING BUTTON */}
      <View style={tw`absolute bottom-4 right-4`}>
        <Pressable onPress={() => navigation.navigate('CreateProject')}>
          <View
            style={tw`bg-blue-500 w-14 h-14 rounded-full flex justify-center items-center shadow-lg`}>
            <Icon name="plus" size={25} color="white" />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default ProjectPage;
