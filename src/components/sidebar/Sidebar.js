import { View, Text,Pressable,Animated,Image,LogBox } from 'react-native'
import React,{useState,useRef,useEffect } from 'react'
import tw from "twrnc"
import Logo from "../../images/logo.png"
import Icon from 'react-native-vector-icons/AntDesign';

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


    
    var SidebarMenu = ({nama="Belum diisi",icon="download",pressHandle}) => {
      return <Pressable onPress={pressHandle}>
        <View style={[tw`flex flex-row items-center text-xl p-3`]}>
          <Icon name={icon} size={25}/>
          <Text style={tw` ml-2`}>{nama}</Text>
        </View>
      </Pressable>
      
    }

  return (
    <Animated.View style={[tw`absolute left-0 h-full bg-white w-6/8`,{marginLeft:fadeAnim}]}>
  
      <View style={[tw`w-full p-3 bg-sky-700  flex-row justify-between items-center`]}>
        <View style={tw`flex-row items-center`}>  
          <Image source={Logo} style = {[tw``,{ width: 35, height: 28 }]}/>
          <Text style={tw`text-white font-medium`}>Spatial Collect</Text>
        </View>
        <Pressable onPress={()=>setOpen(!open)}>
          <Icon name='arrowleft' size={25} color="white"/>
        </Pressable>
      </View>
      {/* <SidebarMenu nama='Edit attribute' icon='edit'/>
      <SidebarMenu nama='Export layer' icon='download'/> */}
      <SidebarMenu nama='Back to home' icon='home' pressHandle={()=>navigation.navigate("Home")}/>
    </Animated.View>
   
  )
}

export default Sidebar