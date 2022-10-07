import { View, Text,Pressable,Animated,Image,LogBox,PermissionsAndroid } from 'react-native'
import React,{useState,useRef,useEffect } from 'react'
import tw from "twrnc"
import Logo from "../../images/logo.png"
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconFeather from 'react-native-vector-icons/Feather';
import DocumentPicker from 'react-native-document-picker'

const Sidebar = ({open = false,setOpen,navigation}) => {

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fadeIn = () => {
        // Will change fadeAnim value to 1 in 5 seconds
        Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        }).start();
    };

    const fadeOut = () => {
        // Will change fadeAnim value to 0 in 3 seconds
        Animated.timing(fadeAnim, {
        toValue: -300,
        duration: 500,
        }).start();
    };

    useEffect(() => {
      LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
      if(open){
        fadeIn()
      }else{
        fadeOut()
      }
    }, [open])


    
    var SidebarMenu = ({nama="Belum diisi",Icon,pressHandle}) => {
      return <Pressable onPress={pressHandle}>
        <View style={[tw`flex flex-row items-center text-xl p-3`]}>
          {Icon}
          {/* <Icon/> */}
          <Text style={tw` ml-2`}>{nama}</Text>
        </View>
      </Pressable>
    }

    var addBasemap = async () => {
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

      const pickerResult = await DocumentPicker.pickSingle()
      console.log(pickerResult,"hasil")

      if(!pickerResult){
          return
      }
    }

  return (
    <Animated.View style={[tw`absolute left-0 h-full bg-white w-6/8`,{marginLeft:fadeAnim}]}>
  
      <View style={[tw`w-full p-3 bg-sky-700  flex-row justify-between items-center`]}>
        <View style={tw`flex-row items-center`}>  
          <Image source={Logo} style = {[tw``,{ width: 35, height: 28 }]}/>
          <Text style={tw`text-white font-medium`}>Spatial Collect</Text>
        </View>
        <Pressable onPress={()=>setOpen(!open)}>
          <IconAnt name='arrowleft' size={25} color="white"/>
        </Pressable>
      </View>
      {/* <SidebarMenu nama='Edit attribute' icon='edit'/>
      <SidebarMenu nama='Export layer' icon='download'/> */}
      {/* <SidebarMenu nama='Add basemap' Icon={<IconFeather name={"map"} size={25} />} pressHandle={addBasemap}/> */}
      <SidebarMenu nama='Back to home' Icon={<IconAnt name={"home"} size={25} />} pressHandle={()=>navigation.navigate("Home")}/>
    </Animated.View>
   
  )
}

export default Sidebar