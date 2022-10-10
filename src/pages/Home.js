import { View, Text,Pressable,Image } from 'react-native'
import React from 'react'
import tw from "twrnc"
import Logo from "../images/logo.png"

const Home = ({navigation}) => {

  var openFolder = () => {
    try {
      console.log("open")
      navigation.navigate('Project')
    } catch (e) {
      console.log(e)
    }
  }

  var createProject = () => {
    try {
      console.log("open")
      navigation.navigate('CreateProject')
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <View style={tw`flex justify-center items-center h-full`}>
        <View style={tw`flex-row items-center justify-center`}>
          <Image source={Logo} style={tw`w-10 h-17`}/>
          <Text style={tw`text-lg font-medium text-sky-700 ml-2`}>AssetKu</Text>
        </View>
        <Pressable  onPress={createProject}>
            <View style={tw`py-4 w-64 mt-4 flex items-center rounded-md bg-sky-700`}>
                <Text style={tw`text-white font-medium`}>
                    New Project
                </Text>
            </View>
        </Pressable>
        <Pressable onPress={openFolder}>
            <View style={tw`py-4 w-64 mt-4 flex items-center rounded-md bg-sky-700`}>
                <Text style={tw`text-white font-medium`}>
                    Open Project
                </Text>
            </View>
        </Pressable>
    </View>
  )
}

export default Home