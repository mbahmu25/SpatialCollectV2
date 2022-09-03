import { View, Text,Pressable } from 'react-native'
import React from 'react'
import tw from "twrnc"
import DocumentPicker from 'react-native-document-picker'
import RNFS from "react-native-fs"

const Home = ({navigation}) => {

  var openFolder = async () => {
    try {
      const pickerResult = await DocumentPicker.pickSingle({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
      })
      navigation.navigate('Peta', {
        path:pickerResult["uri"]
      })
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <View>
        <Pressable onPress={openFolder}>
            <View style={tw`w-full p-3 flex items-center bg-sky-700`}>
                <Text style={tw`text-white font-medium`}>
                    Open Project
                </Text>
            </View>
        </Pressable>
    </View>
  )
}

export default Home