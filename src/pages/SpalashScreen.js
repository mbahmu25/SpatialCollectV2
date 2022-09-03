import { View, Text,Image } from 'react-native'
import { useEffect } from 'react'
import Logo from "../images/logo.png"
import React from 'react'
import tw from "twrnc"

const SpalashScreen = ({navigation}) => {
  
    useEffect(() => {
        setTimeout(async()=>{
            navigation.navigate('Home')
        },3000)
      }, [])
      
    return (
      <View style={tw`items-center justify-center h-full`}>
          <Image source = {Logo}
          style = {[tw``,{ width: 200, height: 200 }]}
      />
        <Text style={tw`absolute bottom-4 text-lg font-medium`}>Spatial Collect</Text>
      </View>
    )
}

export default SpalashScreen