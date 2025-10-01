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
import Sidebar from '../components/sidebar/Sidebar';
import BottomAttribute from '../components/BottomBar/BottomAttribute';
import SweetAlert from 'react-native-sweet-alert';
import BottomMenu from '../components/BottomBar/BottomMenu';
import GpsLocation from '../components/BottomBar/GpsLocation';
import SelectDropdown from 'react-native-select-dropdown';
import {
  getLayersByProject,
  getDataByLayer,
  insertData,
  updateData,
  deleteData,
} from '../utils/db';

const Peta = ({route, navigation}) => {
  const {projectId} = route.params;

  const [region, setRegion] = useState({
    latitude: -7.78825,
    longitude: 110.4324,
    latitudeDelta: 0.0012,
    longitudeDelta: 0.0012,
  });

  const [koordinatBidangBaru, setKoordinatBidangBaru] = useState([]);
  const [koordinatBidangEdit, setkoordinatBidangEdit] = useState([]);
  const [selectBidang, setSelectBidang] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [GpsStatus, setGpsStatus] = useState(true);
  const [posisiGPS, setPosisiGps] = useState(false);
  const [intervalGPS, setIntervalGPS] = useState(false);
  const [tipeGeometry, setTipeGeometry] = useState();
  const [editFeature, setEditFeature] = useState(false);
  const [kolomAttribute, setKolomAttribute] = useState([]);
  const [indexEditBidang, setIndexEditBidang] = useState(false);
  const [layers, setLayers] = useState([]);
  const [activeLayer, setActiveLayer] = useState(null);
  const [dataLayer, setDataLayer] = useState([]);
  const [attributeOpen, setAttributeOpen] = useState({
    mode: 'baru',
    buka: false,
  });
  const [startLocation, setStartLocation] = useState({
    latitude: -5.134054,
    longitude: 119.44451,
  });

  const map = useRef(false);

  // Load layers ketika projectId berubah
  useEffect(() => {
    if (projectId) loadLayers();
  }, [projectId]);

  const loadLayers = async () => {
    try {
      const data = await getLayersByProject(projectId);
      setLayers(data);
    } catch (err) {
      console.error('❌ Failed to load layers:', err);
    }
  };

  const loadDataLayer = async layer => {
    console.log('asdfasdfasd');
    try {
      console.log('123123');
      const data = await getDataByLayer(layer.table_ref);
      setDataLayer(data);
      console.log('Dataku', data);
    } catch (err) {
      console.error('❌ Failed to load data layer:', err);
    }
  };

  const hasLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 23) return true;
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Example App',
        message: 'Example App access to your location ',
      },
    );
    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;
    if (status === PermissionsAndroid.RESULTS.DENIED)
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    return false;
  };

  const getLocation = async cb => {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) return;
    Geolocation.getCurrentPosition(
      pos => cb(pos.coords),
      err => console.log(err),
      {enableHighAccuracy: true, timeout: 15000},
    );
  };

  useEffect(() => {
    getLocation(cb => {
      setStartLocation({longitude: cb.longitude, latitude: cb.latitude});
    });
    setIntervalGPS(
      setInterval(() => {
        getLocation(cb => setPosisiGps(cb));
      }, 2000),
    );
  }, []);

  const tambahBidang = async dataAtribute => {
    if (!activeLayer) return;
    if (tipeGeometry === 'Polygon' && koordinatBidangBaru.length < 3) return;
    try {
      await insertData(
        activeLayer.table_ref,
        tipeGeometry,
        koordinatBidangBaru,
        dataAtribute,
      );
      setKoordinatBidangBaru([]);
      setAttributeOpen({mode: 'baru', buka: false});
      loadDataLayer(activeLayer);
    } catch (e) {
      console.error('❌ Gagal insert data:', e);
    }
  };

  const saveEditGeometry = async () => {
    try {
      const id = selectBidang.id;
      await updateData(
        activeLayer.table_ref,
        id,
        koordinatBidangEdit,
        selectBidang.properties,
      );
      setEditFeature(false);
      setSelectBidang(false);
      setkoordinatBidangEdit([]);
      loadDataLayer(activeLayer);
    } catch (e) {
      console.error('❌ Gagal update data:', e);
    }
  };

  const addMarker = (stateKoordinat, setStateKoordinat) => {
    if (!activeLayer) return; // layer belum dipilih
    clearInterval(intervalGPS);
    getLocation(cb => {
      const lng = cb.longitude;
      const lat = cb.latitude;
      if (tipeGeometry === 'Point') {
        setStateKoordinat([lng, lat]);
        setAttributeOpen({mode: 'baru', buka: true});
      } else {
        setStateKoordinat([...stateKoordinat, [lng, lat]]);
      }
    });
  };

  const editMarker = (
    koordinatBaru,
    index,
    stateKoordinat,
    setStateKoordinat,
  ) => {
    const koordinat = [...stateKoordinat];
    koordinat[index] = [koordinatBaru.longitude, koordinatBaru.latitude];
    setStateKoordinat(koordinat);
  };

  const editBidang = () => {
    setEditFeature(true);
    setSelectBidang(false);
    if (tipeGeometry === 'Polygon')
      setkoordinatBidangEdit(selectBidang.geometry.coordinates);
    else setkoordinatBidangEdit(selectBidang.geometry.coordinates);
  };

  const deleteBidang = () => {
    Alert.alert('Peringatan', 'Apa anda ingin menghapus data?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        onPress: async () => {
          try {
            await deleteData(activeLayer.table_ref, selectBidang.id);
            setSelectBidang(false);
            loadDataLayer(activeLayer);
            SweetAlert.showAlertWithOptions({
              title: 'Data berhasil dihapus',
              style: 'success',
              cancellable: true,
            });
          } catch (e) {
            console.error('❌ Gagal hapus data:', e);
          }
        },
      },
    ]);
  };

  const undoEdit = () => {
    if (koordinatBidangBaru.length <= 1) setKoordinatBidangBaru([]);
    else setKoordinatBidangBaru(koordinatBidangBaru.slice(0, -1));
  };

  const pilihBidang = index => {
    if (editFeature) return;
    setIndexEditBidang(index);
    setMenuOpen(true);
    setSelectBidang(dataLayer[index]);
  };

  const cancelEdit = () => {
    Alert.alert('Peringatan', 'Semua perubahan yang anda buat akan hilang', [
      {text: 'Cancel', style: 'cancel'},
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
  }) => {
    if (tipeGeometry === 'Polygon') {
      const koordinat = data.map(d => ({latitude: d[1], longitude: d[0]}));
      return (
        <Polygon
          coordinates={koordinat}
          strokeColor="yellow"
          fillColor="rgba(14,165,233,0.2)"
        />
      );
    } else if (tipeGeometry === 'Point') {
      return (
        <Marker coordinate={{latitude: data[1], longitude: data[0]}}>
          <View style={tw`flex items-center justify-center`}>
            <View style={[tw`h-3 w-3 rounded-full`, tw`${stylePoint}`]} />
          </View>
        </Marker>
      );
    }
  };

  return (
    <View style={tw`w-full h-full`}>
      <MapView
        ref={map}
        mapType={'satellite'}
        style={tw`w-full h-full absolute`}
        showsUserLocation={true}
        region={{
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          latitudeDelta: 0.0112,
          longitudeDelta: 0.0112,
        }}
        onRegionChangeComplete={r => setRegion(r)}>
        <WMSTile
          urlTemplate={`https://ppids-ugm.com/geoserver/ppids/wms?service=WMS&version=1.1.1&request=GetMap&layers=ppids:gpr2020Tif&format=image/png&transparent=true&styles=&bbox={minX},{minY},{maxX},{maxY}&width={width}&height={height}&srs=EPSG:3857`}
          zIndex={1}
          offlineMode={true}
          tileSize={256}
        />

        {dataLayer.map((item, index) => {
          if (tipeGeometry === 'Point') {
            return (
              <Marker
                key={index}
                coordinate={{
                  latitude: item.geometry.coordinates[1],
                  longitude: item.geometry.coordinates[0],
                }}
                onPress={() => pilihBidang(index)}>
                <View style={tw`flex items-center justify-center`}>
                  <View
                    style={tw`h-3 w-3 rounded-full bg-green-500 border-2 border-white`}
                  />
                </View>
              </Marker>
            );
          } else if (tipeGeometry === 'Polygon') {
            const koordinat = item.geometry.coordinates.map(d => ({
              latitude: d[1],
              longitude: d[0],
            }));
            return (
              <Polygon
                key={index}
                tappable
                onPress={() => pilihBidang(index)}
                coordinates={koordinat}
                strokeColor="green"
                strokeWidth={2}
                fillColor="rgba(0,0,0,0.3)"
              />
            );
          }
        })}

        {koordinatBidangBaru.length !== 0 && (
          <CreateGeometry data={koordinatBidangBaru} />
        )}
        {koordinatBidangEdit.length !== 0 && (
          <CreateGeometry data={koordinatBidangEdit} />
        )}
      </MapView>

      {/* Dropdown Layer */}
      <View style={tw`w-full absolute top-0`}>
        <View style={tw`bg-sky-800 flex-row py-3 px-2 items-center`}>
          <Pressable onPress={() => setOpen(!open)}>
            <IconAnt name="profile" size={28} color="white" />
          </Pressable>
          <Text style={tw`text-white ml-2`}>Project #{projectId}</Text>
        </View>
        {GpsStatus && posisiGPS && <GpsLocation posisiGPS={posisiGPS} />}
        <SelectDropdown
          data={layers}
          onSelect={item => {
            setActiveLayer(item);
            setTipeGeometry(item.tipe);
            loadDataLayer(item);
          }}
          defaultButtonText="Pilih Layer"
          buttonStyle={tw`bg-[white] w-full rounded-b-2`}
          buttonTextAfterSelection={item => item.nama}
          rowTextForSelection={item => item.nama}
        />
      </View>

      <Sidebar open={open} setOpen={setOpen} navigation={navigation} />

      {/* Tombol Action */}
      <View style={tw`absolute bottom-2 right-2 justify-end items-end`}>
        <Pressable onPress={() => setGpsStatus(!GpsStatus)}>
          <View
            style={tw`bg-blue-500 mb-2 w-12 h-12 rounded-full justify-center items-center`}>
            <IconMaterial
              name={GpsStatus ? 'gps-fixed' : 'gps-off'}
              size={25}
              color="white"
            />
          </View>
        </Pressable>

        <View style={tw`flex-row`}>
          {tipeGeometry === 'Polygon' && koordinatBidangBaru.length >= 3 && (
            <Pressable
              onPress={() => setAttributeOpen({mode: 'baru', buka: true})}>
              <View
                style={tw`bg-green-500 w-12 h-12 rounded-full justify-center items-center`}>
                <IconAnt name="check" size={25} color="white" />
              </View>
            </Pressable>
          )}

          {koordinatBidangBaru.length !== 0 && (
            <>
              <Pressable onPress={() => setKoordinatBidangBaru([])}>
                <View
                  style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full justify-center items-center`}>
                  <IconAnt name="close" size={25} color="white" />
                </View>
              </Pressable>
              <Pressable onPress={undoEdit}>
                <View
                  style={tw`bg-white w-12 h-12 ml-2 rounded-full justify-center items-center`}>
                  <IconAnt name="minus" size={25} color="black" />
                </View>
              </Pressable>
            </>
          )}

          {!editFeature && (
            <Pressable
              onPress={() =>
                addMarker(koordinatBidangBaru, setKoordinatBidangBaru)
              }>
              <View
                style={tw`bg-blue-500 ml-2 w-12 h-12 rounded-full justify-center items-center`}>
                <IconAnt name="plus" size={25} color="white" />
              </View>
            </Pressable>
          )}
        </View>

        {editFeature && (
          <View style={tw`flex-row`}>
            <Pressable onPress={saveEditGeometry}>
              <View
                style={tw`bg-green-500 w-12 h-12 rounded-full justify-center items-center`}>
                <IconAnt name="check" size={25} color="white" />
              </View>
            </Pressable>
            <Pressable onPress={cancelEdit}>
              <View
                style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full justify-center items-center`}>
                <IconAnt name="close" size={25} color="white" />
              </View>
            </Pressable>
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
          editBidang={editBidang}
        />
      </View>
    </View>
  );
};

export default Peta;
