import { View, Text,Modal, Pressable } from 'react-native'
import React from 'react'
import tw from "twrnc"
import IconAnt from 'react-native-vector-icons/AntDesign';

const ModalProject = ({data,open=false,setOpen}) => {
  return (
    <Modal
        animationType="slide"
        transparent={true}
        visible={open}
        onRequestClose={() => {
        }}
    >
        <View style={tw`flex justify-center items-center h-full`}>
            <View style={tw`bg-white rounded-xl  border-solid border-2 border-gray-200`}>
              
                <View style={tw`flex-row py-4 px-15 justify-center border-solid border-b-2 border-gray-200`}>
                    <Text style={tw``}>Open Project</Text>
                </View>
                <View style={tw`flex-row py-4 px-3 justify-center border-solid border-b-2 border-gray-200`}>
                    <Text style={tw``}>Export Project</Text>
                </View>
                <View style={tw`flex-row py-4 px-3 justify-center border-solid border-b-2 border-gray-200`}>
                    <Text style={tw`text-red-600`}>Delete Project</Text>
                </View>
                <Pressable onPress={()=>setOpen(false)}>
                    <View style={tw`flex-row py-4 px-3 justify-center border-solid border-b-2 border-gray-200`}>
                        <Text style={tw``}>Close</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    </Modal>
    
  )
}

export default ModalProject