import {
  View,
  Text,
  Pressable,
  Platform,
  PermissionsAndroid,
  ToastAndroid,
  Alert,
  Dimensions,
} from 'react-native';
import React, {useRef, useState, useEffect} from 'react';
import MapView, {Marker, Polygon, WMSTile} from 'react-native-maps';
import tw from 'twrnc';
import Geolocation from 'react-native-geolocation-service';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconMaterial from 'react-native-vector-icons/MaterialIcons';
import {Icon} from 'react-native-vector-icons/AntDesign';
// import {Ionicons} from '@react-native-vector-icons/ionicons';
import Sidebar from '../components/sidebar/Sidebar';
import BottomAttribute from '../components/BottomBar/BottomAttribute';
import RNFS from 'react-native-fs';
// import SweetAlert from 'react-native-sweet-alert';
import BottomMenu from '../components/BottomBar/BottomMenu';
import {TextInput} from 'react-native';
import GpsLocation from '../components/BottomBar/GpsLocation';
// import Triangulate from '../utils/triangulate';
import {
  triangulateNumeric,
  triangulateNumericExtreme,
} from '../utils/triangulate';
const Peta = ({route, navigation}) => {
  const [region, setRegion] = useState({
    latitude: -7.78825,
    longitude: 110.4324,
    latitudeDelta: 0.0012,
    longitudeDelta: 0.0012,
  });
  const [toggleTriangulate, setToggleTriangulate] = useState(false);
  const [triangulateCoord, setTriangulateCoord] = useState([]);

  const [koordinatBidangBaru, setKoordinatBidangBaru] = useState([]);
  const [koordinatBidangEdit, setkoordinatBidangEdit] = useState([]);
  const [selectBidang, setSelectBidang] = useState(false);
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [GpsStatus, setGpsStatus] = useState(true);
  const [posisiGPS, setPosisiGps] = useState(false);
  const [intervalGPS, setIntervalGPS] = useState(false);
  const [namaFile, setNamaFile] = useState('');
  const [tipeGeometry, setTipeGeometry] = useState();
  const [editFeature, setEditFeature] = useState(false);
  const [kolomAttribute, setKolomAttribute] = useState([]);
  const [indexEditBidang, setIndexEditBidang] = useState(false);
  const [dataProject, setDataProject] = useState({features: []});
  const [extremeMode, setExtremeMode] = useState(false);
  const [attributeOpen, setAttributeOpen] = useState({
    mode: 'baru',
    buka: false,
  });
  const [startLocation, setStartLocation] = useState({
    latitude: -5.134054,
    longitude: 119.44451,
  });
  const map = useRef(false);

  useEffect(() => {
    try {
      const {path} = route.params;
      RNFS.readFile(path, 'ascii')
        .then(res => {
          const data = JSON.parse(res);
          var nama = path.split('/').pop();
          setNamaFile(nama);
          setDataProject(data);
          setTipeGeometry(data['features'][0]['geometry']['type']);
          setKolomAttribute(Object.keys(data['features'][0]['properties']));
        })
        .catch(err => {
          console.log(err.message, err.code);
        });
    } catch (err) {
      console.log(err);
    }
  }, []);

  const hasLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Example App',
        message: 'Example App access to your location ',
      },
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  var getLocation = async cb => {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      return;
    }
    Geolocation.getCurrentPosition(
      position => {
        cb(position['coords']);
      },
      error => {
        console.log(error);
      },
      {enableHighAccuracy: true, timeout: 15000},
    );
  };

  useEffect(() => {
    getLocation(cb => {
      setStartLocation({longitude: cb['longitude'], latitude: cb['latitude']});
    });
    setIntervalGPS(
      setInterval(async () => {
        getLocation(cb => setPosisiGps(cb));
      }, 2000),
    );
  }, []);

  const tambahBidang = dataAtribute => {
    setIntervalGPS(
      setInterval(async () => {
        getLocation(cb => setPosisiGps(cb));
      }, 2000),
    );
    var koordinat = [...koordinatBidangBaru];
    var daftarFeature = dataProject['features'];
    var copyData = dataProject;
    if (tipeGeometry == 'Point') {
      koordinat = [koordinat[0], koordinat[1], koordinat[2]];
      var dataBaruGeojson = {
        geometry: {coordinates: koordinat, type: tipeGeometry},
        properties: dataAtribute,
        type: 'Feature',
      };
    } else if (tipeGeometry == 'MultiPolygon' || tipeGeometry == 'Polygon') {
      var dataBaruGeojson = {
        geometry: {coordinates: [[koordinat]], type: tipeGeometry},
        properties: dataAtribute,
        type: 'Feature',
      };
    }
    var gabung = daftarFeature.concat(dataBaruGeojson);
    copyData['features'] = gabung;
    saveData(copyData);
    setDataProject(copyData);
    setAttributeOpen({mode: 'baru', buka: false});
    setKoordinatBidangBaru([]);
  };

  const saveData = async data => {
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
      if (!readGranted || !writeGranted) {
        console.log('Read and write permissions have not been granted');
        return;
      }

      const {path} = route.params;

      RNFS.writeFile(path, JSON.stringify(data), 'utf8')
        .then(success => {
          console.log('SUCCESS');
        })
        .catch(err => {
          console.log(err.message);
        });
    }

    const saveEditGeometry = () => {
      var index = indexEditBidang;
      var copyData = dataProject;
      copyData['features'][index]['geometry']['coordinates'][0][0] =
        koordinatBidangEdit;
      setDataProject(copyData);
      setEditFeature(false);
      setSelectBidang(false);
      setkoordinatBidangEdit([]);
      saveData(copyData);
    };

    const addMarker = (stateKoordinat, setStateKoordinat) => {
      clearInterval(intervalGPS);
      if (GpsStatus) {
        getLocation(cb => {
          if (tipeGeometry == 'Point') {
            setAttributeOpen({mode: 'baru', buka: true});

            setStateKoordinat(
              stateKoordinat.concat([
                cb['longitude'],
                cb['latitude'],
                cb['altitude'] - height,
              ]),
            );
            // setToggleTriangulate(false);
            setTriangulateCoord([]);
          } else if (
            tipeGeometry == 'MultiPolygon' ||
            tipeGeometry == 'Polygon'
          ) {
            setStateKoordinat(
              stateKoordinat.concat([
                [cb['longitude'], cb['latitude'], cb['altitude'] - height],
              ]),
            );
            // setToggleTriangulate(false);
            setTriangulateCoord([]);
          }
        });
      } else {
        if (tipeGeometry == 'Point') {
          setAttributeOpen({mode: 'baru', buka: true});
          setStateKoordinat(
            stateKoordinat.concat([
              region['longitude'],
              region['latitude'],
              region['altitude'] - height,
            ]),
          );
        } else if (
          tipeGeometry == 'MultiPolygon' ||
          tipeGeometry == 'Polygon'
        ) {
          setStateKoordinat(
            stateKoordinat.concat([
              [
                region['longitude'],
                region['latitude'],
                region['altitude'] - height,
              ],
            ]),
          );
        }
      }
    };
    const addTriangulateMarker = (coord, stateKoordinat, setStateKoordinat) => {
      if (tipeGeometry == 'Point') {
        setAttributeOpen({mode: 'baru', buka: true});
        // console.log(koordinat);
        setStateKoordinat(
          stateKoordinat.concat([coord[1], coord[0], coord[2]]),
        );
        // console.log(stateKoordinat);
        // setToggleTriangulate(false);
        setTriangulateCoord([]);
      } else if (tipeGeometry == 'MultiPolygon' || tipeGeometry == 'Polygon') {
        setStateKoordinat(
          stateKoordinat.concat([[coord[1], coord[0], coord[2]]]),
        );
        // setToggleTriangulate(false);
        setTriangulateCoord([]);
      }
    };
    const addTriangulateCoord = (triangulateCoord, setTriangulateCoord) => {
      clearInterval(intervalGPS);
      if (GpsStatus) {
        getLocation(cb => {
          if (triangulateCoord.length <= 4) {
            console.log(cb);
            setTriangulateCoord(e => [
              ...e,
              [cb['latitude'], cb['longitude'], cb['altitude']],
            ]);
            if (triangulateCoord.length === 4) {
              var res = !extremeMode
                ? triangulateNumeric(
                    triangulateCoord,
                    triangulateCoord.map(e => parseFloat(height)),
                    {
                      maxIter: 200,
                      tol: 1e-8,
                      lambda: 0.02,
                    },
                  )
                : triangulateNumericExtreme(
                    triangulateCoord,
                    triangulateCoord.map(e => parseFloat(height)),
                    {maxIter: 200, tol: 1e-8, lambda: 0.02},
                  );
              console.log('Result :', res);
              addTriangulateMarker(
                res,
                koordinatBidangBaru,
                setKoordinatBidangBaru,
              );
            }
          }
          // console.log(triangulateCoord);
        });
      }
    };
    const editMarker = (
      koordinatBaru,
      index,
      stateKoordinat,
      setStateKoordinat,
    ) => {
      var koordinat = [...stateKoordinat];
      koordinat[index] = [
        koordinatBaru['longitude'],
        koordinatBaru['latitude'],
        koordinatBaru['latitude'] - height,
      ];
      setStateKoordinat(koordinat);
    };

    const editBidang = () => {
      setEditFeature(true);
      setSelectBidang(false);
      var index = indexEditBidang;
      var bidang = dataProject['features'][index]['geometry'];
      if (tipeGeometry == 'MultiPolygon' || tipeGeometry == 'Polygon') {
        setkoordinatBidangEdit(bidang['coordinates'][0][0]);
      } else if (tipeGeometry == 'Point') {
        setkoordinatBidangEdit(bidang['coordinates']);
      }
    };

    const deleteBidang = () => {
      Alert.alert('Peringatan', 'Apa anda ingin menghapus data?', [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            var copyData = dataProject;
            copyData['features'].splice(indexEditBidang, 1);
            const {path} = route.params;
            setkoordinatBidangEdit([]);
            setSelectBidang(false);
            setDataProject(copyData);
            RNFS.writeFile(path, JSON.stringify(copyData), 'utf8')
              .then(success => {
                // SweetAlert.showAlertWithOptions({
                //   title: 'Data berhasil dihapus',
                //   subTitle: 'Tekan tombol Ok untuk menutup',
                //   style: 'success',
                //   cancellable: true,
                // });
                setDataProject(copyData);
              })
              .catch(err => {
                console.log(err.message);
              });
          },
        },
      ]);
    };

    const editAttribute = input => {
      Alert.alert(
        'Peringatan',
        'Apa anda ingin menyimpan perubahan atribute?',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: () => {
              var copyData = dataProject;
              copyData['features'][indexEditBidang]['properties'] =
                input['data'];
              const {path} = route.params;
              RNFS.writeFile(path, JSON.stringify(copyData), 'utf8')
                .then(success => {
                  // SweetAlert.showAlertWithOptions({
                  //   title: 'Attribut berhasil diupdate',
                  //   subTitle: 'Tekan tombol Ok untuk menutup',
                  //   style: 'success',
                  //   cancellable: true,
                  // });
                  console.log('sukses');
                })
                .catch(err => {
                  console.log(err.message);
                });
            },
          },
        ],
      );
    };

    const undoEdit = () => {
      if (koordinatBidangBaru.length == 1) {
        setKoordinatBidangBaru([]);
      } else {
        var koordinat = [...koordinatBidangBaru];
        setKoordinatBidangBaru(koordinat.slice(0, -1));
      }
    };

    const pilihBidang = index => {
      if (editFeature) return;
      setIndexEditBidang(index);
      setMenuOpen(true);
      var bidang = dataProject['features'][index];
      setSelectBidang(bidang);
    };

    const cancelEdit = () => {
      Alert.alert('Peringatan', 'Semua perubahan yang anda buat akan hilang', [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            setEditFeature(false);
            setKoordinatBidangBaru([]);
            setkoordinatBidangEdit([]);
            setSelectBidang(false);
          },
        },
      ]);
    };

    const CreateGeometry = ({
      data,
      stylePoint = 'bg-yellow-500 border-2 border-white',
      styleStroke = 'yellow',
      select = false,
    }) => {
      if (tipeGeometry == 'MultiPolygon' || tipeGeometry == 'Polygon') {
        var koordinat = [];
        if (select) {
          data[0][0].map(data => {
            koordinat.push({latitude: data[1], longitude: data[0]});
          });
        } else {
          data.map(data => {
            koordinat.push({latitude: data[1], longitude: data[0]});
          });
        }

        return (
          <Polygon
            coordinates={koordinat}
            strokeColor={styleStroke}
            fillColor="rgba(14,165,233,0.2)"
          />
        );
      } else if (tipeGeometry == 'Point') {
        return (
          <Marker coordinate={{latitude: data[1], longitude: data[0]}}>
            <View style={tw` flex items-center justify-center`}>
              <View
                style={[
                  tw`h-3 w-3 rounded-full flex items-center justify-center`,
                  tw`${stylePoint}`,
                ]}></View>
            </View>
          </Marker>
        );
      }
    };

    return (
      <View style={tw`w-full h-full `}>
        <MapView
          ref={map}
          mapType={'satellite'}
          style={tw`w-full h-full absolute`}
          showsUserLocation={true}
          region={{
            latitude: startLocation['latitude'],
            longitude: startLocation['longitude'],
            latitudeDelta: 0.0112,
            longitudeDelta: 0.0112,
          }}
          onRegionChangeComplete={regionPerubahan =>
            setRegion(regionPerubahan)
          }>
          <WMSTile
            urlTemplate={`https://ppids-ugm.com/geoserver/ppids/wms?service=WMS&version=1.1.1&request=GetMap&layers=ppids:gpr2020Tif&format=image/png&transparent=true&styles=&bbox={minX},{minY},{maxX},{maxY}&width={width}&height={height}&srs=EPSG:3857`}
            zIndex={1}
            offlineMode={true}
            tileSize={256}
          />
          {tipeGeometry != 'Point' &&
            koordinatBidangBaru.length != 0 &&
            koordinatBidangBaru.map((data, index) => {
              return (
                <Marker
                  key={index}
                  coordinate={{latitude: data[1], longitude: data[0]}}
                  draggable
                  onDrag={e =>
                    editMarker(
                      e.nativeEvent.coordinate,
                      index,
                      koordinatBidangBaru,
                      setKoordinatBidangBaru,
                    )
                  }>
                  <View style={tw` flex items-center justify-center`}>
                    <View
                      style={tw`h-3 w-3 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center`}></View>
                  </View>
                </Marker>
              );
            })}
          {tipeGeometry != 'Point' &&
            koordinatBidangEdit.length != 0 &&
            koordinatBidangEdit.map((data, index) => {
              return (
                <Marker
                  key={index}
                  coordinate={{latitude: data[1], longitude: data[0]}}
                  draggable
                  onDrag={e =>
                    editMarker(
                      e.nativeEvent.coordinate,
                      index,
                      koordinatBidangEdit,
                      setkoordinatBidangEdit,
                    )
                  }>
                  <View style={tw` flex items-center justify-center`}>
                    <View
                      style={tw`h-3 w-3 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center`}></View>
                  </View>
                </Marker>
              );
            })}
          {koordinatBidangBaru.length != 0 && (
            <CreateGeometry data={koordinatBidangBaru} />
          )}
          {koordinatBidangEdit.length != 0 && (
            <CreateGeometry data={koordinatBidangEdit} />
          )}
          {selectBidang && (
            <CreateGeometry
              data={selectBidang['geometry']['coordinates']}
              select={true}
            />
          )}
          {dataProject['features'] &&
            dataProject['features'].length != 0 &&
            dataProject['features'].map((data, index) => {
              if (tipeGeometry == 'Point') {
                return (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: data['geometry']['coordinates'][1],
                      longitude: data['geometry']['coordinates'][0],
                    }}
                    onPress={() => pilihBidang(index)}>
                    <View style={tw` flex items-center justify-center`}>
                      <View
                        style={tw`h-3 w-3 rounded-full bg-green-500 border-2 border-white flex items-center justify-center`}></View>
                    </View>
                  </Marker>
                );
              } else if (
                tipeGeometry == 'MultiPolygon' ||
                tipeGeometry == 'Polygon'
              ) {
                var koordinat = [];
                data['geometry']['coordinates'][0][0].map(data => {
                  koordinat.push({latitude: data[1], longitude: data[0]});
                });
                return (
                  <Polygon
                    key={index}
                    tappable={true}
                    onPress={() => pilihBidang(index)}
                    coordinates={koordinat}
                    strokeColor="green"
                    strokeWidth={2}
                    fillColor="rgba(0,0,0,0.3)"
                  />
                );
              }
            })}
        </MapView>

        <View style={tw`w-full absolute top-0 `}>
          <View
            style={tw`bg-sky-800 flex-row py-3 px-2 flex justify-start items-center`}>
            <Pressable onPress={() => setOpen(!open)}>
              <IconAnt name="profile" size={28} color="white" />
            </Pressable>
            <Text style={tw`text-white ml-2`}>{namaFile}</Text>
          </View>
          {GpsStatus && posisiGPS && <GpsLocation posisiGPS={posisiGPS} />}
          <TextInput
            placeholder="Tinggi Pole"
            value={parseFloat(height)}
            onChangeText={setHeight}
            style={tw`bg-gray-200 flex-1 p-2 w-16 rounded text-black`}
          />
        </View>

        <Sidebar open={open} setOpen={setOpen} navigation={navigation} />

        <View style={tw`absolute bottom-2 right-2 justify-end items-end`}>
          <Pressable
            onPress={() => {
              setToggleTriangulate(!toggleTriangulate);
              setTriangulateCoord([]);
            }}
            style={tw`flex flex-row items-center`}>
            {toggleTriangulate ? (
              <View style={tw`flex flex-row items-center gap-4`}>
                {/* Counter Badge */}
                <View
                  style={tw`bg-white shadow-md w-12 h-12 rounded-md flex justify-center items-center`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>
                    {triangulateCoord.length}
                  </Text>
                </View>

                {/* Active Button */}
                <View
                  style={tw`bg-green-500 shadow-md w-12 h-12 rounded-md flex justify-center items-center`}>
                  <IconMaterial name="triangle" size={25} color="white" />
                </View>
              </View>
            ) : (
              // Inactive Button
              <View
                style={tw`bg-red-500 shadow-md w-12 h-12 rounded-md flex justify-center items-center`}>
                <IconMaterial name="triangle-outline" size={25} color="white" />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setGpsStatus(!GpsStatus);
            }}>
            <View
              style={tw`bg-blue-500 mb-2 w-12 h-12 rounded-full flex justify-center items-center`}>
              {GpsStatus ? (
                <IconMaterial name="gps-fixed" size={25} color="white" />
              ) : (
                <IconMaterial name="gps-off" size={25} color="white" />
              )}
            </View>
          </Pressable>

          <View style={tw`flex-row`}>
            {koordinatBidangBaru.length > 2 && (
              <Pressable
                onPress={() => {
                  setAttributeOpen({mode: 'baru', buka: true});
                }}>
                <View
                  style={tw`bg-green-500 w-12 h-12 rounded-full flex justify-center items-center`}>
                  <IconAnt name="check" size={25} color="white" />
                </View>
              </Pressable>
            )}
            {koordinatBidangBaru.length !== 0 && (
              <Pressable
                onPress={() => {
                  setKoordinatBidangBaru([]);
                }}>
                <View
                  style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name="close" size={25} color="white" />
                </View>
              </Pressable>
            )}
            {koordinatBidangBaru.length !== 0 && (
              <Pressable
                onPress={() => {
                  undoEdit();
                }}>
                <View
                  style={tw`bg-white w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name="minus" size={25} color="black" />
                </View>
                <View
                  style={tw`bg-white w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name="minus" size={25} color="black" />
                </View>
              </Pressable>
            )}
            {!editFeature && (
              <Pressable
                onPress={() => {
                  if (toggleTriangulate === false) {
                    addMarker(koordinatBidangBaru, setKoordinatBidangBaru);
                  } else if (
                    toggleTriangulate === true &&
                    triangulateCoord.length < 4
                  ) {
                    addTriangulateCoord(triangulateCoord, setTriangulateCoord);
                    console.log(triangulateCoord.length);
                  } else if (
                    toggleTriangulate === true &&
                    triangulateCoord.length === 4
                  ) {
                    addTriangulateCoord(triangulateCoord, setTriangulateCoord);
                    console.log(triangulateCoord.length);
                  }
                }}>
                <View
                  style={tw`bg-blue-500 ml-2 w-12 h-12 rounded-full flex justify-center items-center`}>
                  <IconAnt name="plus" size={25} color="white" />
                </View>
              </Pressable>
            )}
          </View>

          {editFeature && (
            <View style={tw`flex-row`}>
              <Pressable
                onPress={() => {
                  saveEditGeometry();
                }}>
                <View
                  style={tw`bg-green-500 w-12 h-12 rounded-full flex justify-center items-center`}>
                  <IconAnt name="check" size={25} color="white" />
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  cancelEdit();
                }}>
                <View
                  style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name="close" size={25} color="white" />
                </View>
              </Pressable>

              {tipeGeometry !== 'Point' && (
                <Pressable
                  onPress={() => {
                    addMarker(koordinatBidangEdit, setkoordinatBidangEdit);
                  }}>
                  <View
                    style={tw`bg-blue-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                    <IconAnt name="plus" size={25} color="white" />
                  </View>
                </Pressable>
              )}
            </View>
          )}
          <BottomMenu
            menuOpen={menuOpen}
            setAttributeOpen={setAttributeOpen}
            setMenuOpen={setMenuOpen}
            editBidang={editBidang}
            deleteBidang={deleteBidang}
            setSelectBidang={setSelectBidang}
          />
          <BottomAttribute
            attributeOpen={attributeOpen}
            setAttributeOpen={setAttributeOpen}
            kolomAttribute={kolomAttribute}
            tambahBidang={tambahBidang}
            setSelectBidang={setSelectBidang}
            selectBidang={selectBidang}
            cancelEdit={cancelEdit}
            editAttribute={editAttribute}
            editBidang={editBidang}
          />
        </View>
      </View>
    );
  };
};
export default Peta;
