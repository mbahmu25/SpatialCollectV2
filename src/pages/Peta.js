import { View, Pressable,Platform,PermissionsAndroid,ToastAndroid } from 'react-native'
import React,{useRef, useState,useEffect} from 'react'
import MapView, { Marker,Polygon } from 'react-native-maps';
import tw from "twrnc"
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/AntDesign';
import Sidebar from '../components/sidebar/Sidebar';
import BottomAttribute from '../components/BottomBar/BottomAttribute';
import RNFS from "react-native-fs"

const Peta = ({ route, navigation }) => {

  const [region, setRegion] = useState({
    latitude: -7.78825,
    longitude: 110.4324,
    latitudeDelta: 0.0112,
    longitudeDelta: 0.0112,
})
  const [koordinatBidangEdit, setKoordinatBidangEdit] = useState([])
  const [koordinatBidang, setKoordinatBidang] = useState([])
  const [selectBidang, setSelectBidang] = useState([])
  const [open, setOpen] = useState(false)
  const [editFeature, setEditFeature] = useState(false)
  const [kolomAttribute, setKolomAttribute] = useState([])
  const [addFeature, setAddFeature] = useState(false)
  const [attributeOpen, setAttributeOpen] = useState({mode:"baru",buka:false})
  const [startLocation, setStartLocation] = useState({latitude :-5.134054,longitude :119.444510})
  const map = useRef(false)

  useEffect(() => {
    try{
      const { path } = route.params;
      console.log(path,"path")
      RNFS.readFile(path, 'ascii').then(res => {
        const dataProject = JSON.parse(res);
        setKolomAttribute(Object.keys(dataProject["features"][0]["properties"]))
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
      setStartLocation({longitude:cb["longitude"],latitude:cb["latitude"]})
    })
  }, [])
  
  var tambahBidang = (dataAtribute) => {
    var koordinat = [...koordinatBidangEdit]
    setKoordinatBidang(koordinatBidang.concat([koordinat]))
    setAttributeOpen({mode:"baru",buka:false})
    setKoordinatBidangEdit([])
  }

  var addMarker = (e) => {
    //setKoordinatBidangEdit(koordinatBidangEdit.concat([{latitude: region["latitude"],longitude: region["longitude"]}]))
    setAddFeature(true)
    getLocation(cb=>{
      console.log(cb["latitude"],"cb")
      setKoordinatBidangEdit(koordinatBidangEdit.concat([[cb["longitude"],cb["latitude"]]]))
    })
  }

  var editMarker = (koordinatBaru,index) => {
    var koordinat = [...koordinatBidangEdit]
    koordinat[index] = [koordinatBaru["longitude"],koordinatBaru["latitude"]]
    setKoordinatBidangEdit(koordinat)
  }

  var editBidang= (index) => {
    var koordinat = koordinatBidang[index]
    setKoordinatBidangEdit(koordinat)
  }

  var undoEdit = () => {
    console.log(koordinatBidangEdit.length)
    if(koordinatBidangEdit.length == 1){
      setKoordinatBidangEdit([])
    }else{
      var koordinat = [...koordinatBidangEdit]
      setKoordinatBidangEdit(koordinat.slice(0,-1))
    }
  }

  var pilihBidang = (index) => {
    setAttributeOpen(true)
    var koordinat = koordinatBidang[index]
    setSelectBidang(koordinat)
  }

  var cancelEdit= () => {
    setKoordinatBidangEdit([])
  }

  var CreatePolygon = ({data,fillColor="rgba(14,165,233,0.2)",strokeColor="red"}) => {
    var koordinat = []
    data.map(data=>{
      koordinat.push({latitude:data[1],longitude:data[0]})
    })
    console.log(koordinat,"bidang")
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
            latitudeDelta: 0.0112,
            longitudeDelta: 0.0112,
        }}
        onRegionChangeComplete={(e)=>setRegion(e)}
        >
          {
            koordinatBidangEdit.length != 0 && koordinatBidangEdit.map((data,index)=>{
              console.log(data)
              return  <Marker
                key={index}
                coordinate={{latitude:data[1],longitude:data[0]}}
                draggable
                onDragEnd={(e)=>editMarker(e.nativeEvent.coordinate,index)}
              />
            })}
          {
            koordinatBidangEdit.length != 0 && <CreatePolygon data={koordinatBidangEdit}/>
          }
          {
            selectBidang.length != 0 && <CreatePolygon data={selectBidang} fillColor="rgba(250,204,21,0.6)" strokeColor='red'/>
          }
          {
            koordinatBidang.length != 0 && koordinatBidang.map((data,index)=>{
              var koordinat = []
              data.map(data=>{
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
      
        <View style={tw`bg-sky-800 py-2 px-2 w-full absolute top-0 flex justify-center items-start`}>
          <Pressable onPress={()=>setOpen(!open)} >
            <Icon name='profile' size={25} color="white"/>
          </Pressable>  
        </View>
        <Sidebar open={open} setOpen={setOpen}/>
        <View
              style={tw`absolute bottom-2 right-2 justify-end items-end`}
        > 
          <View style={tw`flex-row`}>
            {
              koordinatBidangEdit.length > 2 &&  <Pressable onPress={()=>{setAttributeOpen({mode:"baru",buka:true})}} >
              <View style={tw`bg-green-500 w-15 h-15 rounded-full flex justify-center items-center`}>
                <Icon name='check' size={25} color="white"/>
              </View>
            </Pressable>
            }
            {
              koordinatBidangEdit.length !== 0 && <Pressable onPress={()=>{setAddFeature(false)}} >
                <View style={tw`bg-red-500 w-15 h-15 ml-2 rounded-full flex justify-center items-center`}>
                  <Icon name='close' size={25} color="white"/>
                </View>
              </Pressable>
            }
            {
              koordinatBidangEdit.length !== 0 && <Pressable onPress={()=>{undoEdit()}} >
                <View style={tw`bg-white w-15 h-15 ml-2 rounded-full flex justify-center items-center`}>
                  <Icon name='minus' size={25} color="black"/>
                </View>
              </Pressable>
            }
      
            <Pressable onPress={()=>{addMarker()}} >
                <View style={tw`bg-blue-500 ml-2 w-15 h-15 rounded-full flex justify-center items-center`}>
                  <Icon name='plus' size={25} color="white"/>
                </View>
            </Pressable>
          </View> 
          {editFeature &&
            <View style={tw`flex-row`}>
            <Pressable onPress={()=>{addMarker()}} >
              <View style={tw`bg-blue-500 w-15 h-15 rounded-full flex justify-center items-center`}>
                <Icon name='plus' size={25} color="white"/>
              </View>
            </Pressable>
            <Pressable onPress={()=>{setEditFeature(false)}} >
              <View style={tw`bg-red-500 w-15 h-15 ml-2 rounded-full flex justify-center items-center`}>
                <Icon name='close' size={25} color="white"/>
              </View>
            </Pressable>
            </View> 
          }
        <BottomAttribute 
          attributeOpen = {attributeOpen} 
          setAttributeOpen={setAttributeOpen} 
          kolomAttribute={kolomAttribute}
          tambahBidang = {tambahBidang}
        />
      </View>    
    </View>
  )
}

export default Peta