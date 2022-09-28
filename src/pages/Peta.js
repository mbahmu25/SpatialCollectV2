import { View,Text, Pressable,Platform,PermissionsAndroid,ToastAndroid,Alert } from 'react-native'
import React,{useRef, useState,useEffect} from 'react'
import MapView, { Marker,Polygon } from 'react-native-maps';
import tw from "twrnc"
import Geolocation from 'react-native-geolocation-service';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconMaterial from 'react-native-vector-icons/MaterialIcons';
import Sidebar from '../components/sidebar/Sidebar';
import BottomAttribute from '../components/BottomBar/BottomAttribute';
import RNFS from "react-native-fs"
import SweetAlert from 'react-native-sweet-alert';

const Peta = ({ route, navigation }) => {

  const [region, setRegion] = useState({
    latitude: -7.78825,
    longitude: 110.4324,
    latitudeDelta: 0.0112,
    longitudeDelta: 0.0112,
})
  const [koordinatBidangBaru, setKoordinatBidangBaru] = useState([])
  const [koordinatBidangEdit, setkoordinatBidangEdit] = useState([])
  const [selectBidang, setSelectBidang] = useState(false)
  const [open, setOpen] = useState(false)
  const [GpsStatus,setGpsStatus ] = useState(false)
  const [namaFile, setNamaFile] = useState("")
  const [tipeGeometry, setTipeGeometry] = useState()
  const [editFeature, setEditFeature] = useState(false)
  const [kolomAttribute, setKolomAttribute] = useState([])
  const [indexEditBidang, setIndexEditBidang] = useState(false)
  const [dataProject, setDataProject] = useState({features:[]})
  const [attributeOpen, setAttributeOpen] = useState({mode:"baru",buka:false})
  const [startLocation, setStartLocation] = useState({latitude :-5.134054,longitude :119.444510})
  const map = useRef(false)

  useEffect(() => {
    try{
      const { path } = route.params;
      RNFS.readFile(path, 'ascii').then(res => {
        const data = JSON.parse(res);
        var nama = path.split("/").pop()
        setNamaFile(nama)
        setDataProject(data)
        setTipeGeometry(data["features"][0]["geometry"]["type"])
        setKolomAttribute(Object.keys(data["features"][0]["properties"]))
      }).catch(err => {
        console.log(err.message, err.code);
      })
    }catch(err){
      console.log(err)
    }
  }, [])
  
  const hasLocationPermission = async () => {

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    console.log(hasPermission,"has")
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        'title': 'Example App',
        'message': 'Example App access to your location '
      }
    )
    console.log(status,"granted")


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

  var getLocation = async (cb) =>{
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => {
        cb(position["coords"]);
      },
      (error) => {
        console.log(error);
      })
  }

  useEffect(() => {
    getLocation(cb=>{
      setStartLocation({longitude:110.440262181919422,latitude:-7.00690907746973})
    })
  }, [])
  
  const tambahBidang = (dataAtribute) => {
    var koordinat = [...koordinatBidangBaru]
    // console.log(dataProject["features"],"data")
    var daftarFeature = dataProject["features"]
    var copyData = dataProject
    var dataBaruGeojson = {geometry:{coordinates:[[koordinat]],type:tipeGeometry},properties:dataAtribute,type:"Feature"}
    var gabung = daftarFeature.concat(dataBaruGeojson)
    copyData["features"] = gabung
    saveData(copyData)
    setDataProject(copyData)
    setAttributeOpen({mode:"baru",buka:false})
    setKoordinatBidangBaru([])
  }

  const saveData = async (data) => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
    } catch (err) {
      console.warn(err);
    }
    const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE); 
    const writeGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

    if(!readGranted || !writeGranted ) {
      console.log('Read and write permissions have not been granted');
      return;
    }

    const { path } = route.params;

    RNFS.writeFile(path,JSON.stringify(data),'utf8').then((success) => {
      console.log('SUCCESS');
    })
    .catch((err) => {
      console.log(err.message);
    });
  }

  const saveEditGeometry = () => {
    var index = indexEditBidang
    var copyData = dataProject
    copyData["features"][index]["geometry"]["coordinates"][0][0] = koordinatBidangEdit
    setDataProject(copyData)
    setkoordinatBidangEdit([])
    saveData(copyData)
  }

  const addMarker = (stateKoordinat,setStateKoordinat) => {
    if(GpsStatus){
      getLocation(cb=>{
        setStateKoordinat(stateKoordinat.concat([[cb["longitude"],cb["latitude"]]]))
      })
    }else{
      console.log(stateKoordinat.concat([region["longitude"],region["latitude"]]))
      setStateKoordinat(stateKoordinat.concat([[region["longitude"],region["latitude"]]]))
    }
  }

  const editMarker = (koordinatBaru,index,stateKoordinat,setStateKoordinat) => {
    var koordinat = [...stateKoordinat]
    koordinat[index] = [koordinatBaru["longitude"],koordinatBaru["latitude"]]
    setStateKoordinat(koordinat)
  }

  const editBidang = (index) => {
    setEditFeature(true)
    var bidang = dataProject["features"][index]["geometry"]
    setkoordinatBidangEdit(bidang["coordinates"][0][0])
  }

  const editAttribute = (input) => {
    Alert.alert(
      "Peringatan",
      "Apa anda ingin menyimpan perubahan atribute?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => {
            var copyData = dataProject
            copyData["features"][6]["properties"] = input["data"]
            const { path } = route.params;
            RNFS.writeFile(path,JSON.stringify(copyData),'utf8').then((success) => {
              SweetAlert.showAlertWithOptions({
                title: 'Attribut berhasil diupdate',
                subTitle: 'Tekan tombol Ok untuk menutup',
                style: 'success',
                cancellable: true
              });
            })
            .catch((err) => {
              console.log(err.message);
            });
          } 
        }
      ]
    );

    
  }

  const undoEdit = () => {
    if(koordinatBidangBaru.length == 1){
      setKoordinatBidangBaru([])
    }else{
      var koordinat = [...koordinatBidangBaru]
      setKoordinatBidangBaru(koordinat.slice(0,-1))
    }
  }

  const pilihBidang = (index) => {
    setIndexEditBidang(index)
    setAttributeOpen({mode:"info",buka:true,index:index})
    var bidang = dataProject["features"][index]
    setSelectBidang(bidang)
  }

  const cancelEdit= () => {
    
    Alert.alert(
      "Peringatan",
      "Semua perubahan yang anda buat akan hilang",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => {
          setEditFeature(false)
          setKoordinatBidangBaru([])
          setkoordinatBidangEdit([])
          } 
        }
      ]
    );
   
  }

  const CreatePolygon = ({data,fillColor="rgba(14,165,233,0.2)",strokeColor="red"}) => {
    var koordinat = []
    data.map(data=>{
      koordinat.push({latitude:data[1],longitude:data[0]})
    })
    return <Polygon 
      coordinates={koordinat} 
      strokeColor="red"
      fillColor='rgba(14,165,233,0.2)'
    />
  }

  return (
    <View style={tw`w-full h-full `}>
      <MapView
        ref={map}
        style={tw`w-full h-full absolute`}
        showsUserLocation={true}
        region={{
            latitude:startLocation["latitude"],
            longitude: startLocation["longitude"],
            latitudeDelta: 0.0012,
            longitudeDelta: 0.0012,
        }}
        onRegionChangeComplete={(e)=>setRegion(e)}
        >
          {
            koordinatBidangBaru.length != 0 && koordinatBidangBaru.map((data,index)=>{

              return  <Marker
                key={index}
                coordinate={{latitude:data[1],longitude:data[0]}}
                draggable
                onDragEnd={(e)=>editMarker(e.nativeEvent.coordinate,index,koordinatBidangBaru,setKoordinatBidangBaru)}
              />
            })
          }
          {
            koordinatBidangEdit.length != 0 && koordinatBidangEdit.map((data,index)=>{
              return  <Marker
                key={index}
                coordinate={{latitude:data[1],longitude:data[0]}}
                draggable
                onDragEnd={(e)=>editMarker(e.nativeEvent.coordinate,index,koordinatBidangEdit,setkoordinatBidangEdit)}
              />
            })
          }
          {
            koordinatBidangBaru.length != 0 && <CreatePolygon data={koordinatBidangBaru}/>
          }
          {
            koordinatBidangEdit.length != 0 && <CreatePolygon data={koordinatBidangEdit}/>
          }
          {
            selectBidang && <CreatePolygon data={selectBidang["geometry"]["coordinates"][0][0]} fillColor="rgba(250,204,21,0.6)" strokeColor='red'/>
          }
          {
            dataProject["features"] && dataProject["features"].length != 0 && dataProject["features"].map((data,index)=>{
              var koordinat = []
              data["geometry"]["coordinates"][0][0].map(data=>{
                koordinat.push({latitude:data[1],longitude:data[0]})
              })
              return <Polygon 
                key={index}
                tappable={true} 
                onPress={()=>pilihBidang(index)} 
                coordinates={koordinat} 
                strokeColor="red"
                fillColor='rgba(0,0,0,0.2)'
            />})
          }
        </MapView>
      
        <View style={tw`bg-sky-800 flex-row py-3 px-2 w-full absolute top-0 flex justify-start items-center`}>
          <Pressable onPress={()=>setOpen(!open)} >
            <IconAnt name='profile' size={28} color="white"/>
          </Pressable>  
          <Text style={tw`text-white ml-2`}>{namaFile}</Text>
        </View>
        <Sidebar open={open} setOpen={setOpen} navigation={navigation}/>
        <View
              style={tw`absolute bottom-2 right-2 justify-end items-end`}
        > 
         
          <Pressable onPress={()=>{setGpsStatus(!GpsStatus)}} >
            <View style={tw`bg-blue-500 mb-2 w-12 h-12 rounded-full flex justify-center items-center`}>
              {GpsStatus ? <IconMaterial name='gps-fixed' size={25} color="white"/> : <IconMaterial name='gps-off' size={25} color="white"/>}
            </View>
          </Pressable>

          <View style={tw`flex-row`}>
            {
              koordinatBidangBaru.length > 2 &&  <Pressable onPress={()=>{setAttributeOpen({mode:"baru",buka:true})}} >
              <View style={tw`bg-green-500 w-12 h-12 rounded-full flex justify-center items-center`}>
                <IconAnt name='check' size={25} color="white"/>
              </View>
            </Pressable>
            }
            {
              koordinatBidangBaru.length !== 0 && <Pressable onPress={()=>{setKoordinatBidangBaru([])}} >
                <View style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name='close' size={25} color="white"/>
                </View>
              </Pressable>
            }
            {
              koordinatBidangBaru.length !== 0 && <Pressable onPress={()=>{undoEdit()}} >
                <View style={tw`bg-white w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name='minus' size={25} color="black"/>
                </View>
              </Pressable>
            }
            {
              !editFeature && <Pressable onPress={()=>{addMarker(koordinatBidangBaru,setKoordinatBidangBaru)}} >
                <View style={tw`bg-blue-500 ml-2 w-12 h-12 rounded-full flex justify-center items-center`}>
                  <IconAnt name='plus' size={25} color="white"/>
                </View>
              </Pressable>
            }
           
          </View> 

          {editFeature &&
            <View style={tw`flex-row`}>

              <Pressable onPress={()=>{
                  saveEditGeometry()
                }} >
                <View style={tw`bg-green-500 w-12 h-12 rounded-full flex justify-center items-center`}>
                  <IconAnt name='check' size={25} color="white"/>
                </View>
              </Pressable>

              <Pressable onPress={()=>{
                  cancelEdit()
                }} >
                <View style={tw`bg-red-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name='close' size={25} color="white"/>
                </View>
              </Pressable>

              <Pressable onPress={()=>{addMarker(koordinatBidangEdit,setkoordinatBidangEdit)}} >
                <View style={tw`bg-blue-500 w-12 h-12 ml-2 rounded-full flex justify-center items-center`}>
                  <IconAnt name='plus' size={25} color="white"/>
                </View>
              </Pressable>

            </View> 
          }
        <BottomAttribute 
          attributeOpen = {attributeOpen} 
          setAttributeOpen={setAttributeOpen} 
          kolomAttribute={kolomAttribute}
          tambahBidang = {tambahBidang}
          selectBidang={selectBidang}
          cancelEdit={cancelEdit}
          editAttribute={editAttribute}
          editBidang={editBidang}
        />
      </View>    
    </View>
  )
}

export default Peta