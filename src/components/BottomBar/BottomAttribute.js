import { View, Text,Modal,TextInput,ScrollView,Pressable } from 'react-native'
import React,{useState,useEffect} from 'react'
import tw from "twrnc"
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomAttribute = ({attributeOpen,setAttributeOpen,kolomAttribute,tambahBidang,selectBidang}) => {

  const [input, setInput] = useState({})
  const [edit, setEdit] = useState(true)

  useEffect(() => {
    console.log(attributeOpen["mode"])
    if(attributeOpen["mode"] == "info"){
      setEdit(false)
    }
  }, [])
  

  var DataAtribute = ({namaKolom,onChangeText}) => {
    return <View style={tw`my-1`}>
      <Text>
        {namaKolom}
      </Text>
      {attributeOpen["mode"] == "baru" ?
        <TextInput 
          editable={true}
          style={tw`border-2 mt-1 border-solid border-gray-500 p-1`}
          onChangeText={onChangeText}
        />
        :
        <TextInput 
          editable={edit}
          style={tw`border-2 mt-1 border-solid border-gray-500 p-1`}
          onChangeText={onChangeText}
          value={selectBidang["properties"][namaKolom]}
        />
      }
      
    </View>
  }

  const handleFormChange = (index,kolom,text ) => {
    var data = input
    data[kolom] = text
    setInput(data)
  }

  useEffect(() => {
    var initKolom = {};
    kolomAttribute.map(attribute=>{
      initKolom[attribute] = ""
    })
    setInput(initKolom)
  }, [attributeOpen])
  

  return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={attributeOpen["buka"]}
        onRequestClose={() => {
        }}
      >
        <View style={tw`absolute bottom-0 bg-white w-full`}>
          <View style={tw`w-full flex-row justify-between items-center p-2 bg-sky-700`}>
            {attributeOpen["mode"] == "baru" ? 
            <Pressable onPress={()=>setAttributeOpen({mode:"baru",buka:false})}>
              <IconAnt name='delete' size={25} color="white"/>
            </Pressable> 
              :
            <Pressable onPress={()=>setAttributeOpen({mode:"baru",buka:false})}>
            <IconAnt name='arrowleft' size={25} color="white"/>
            </Pressable>}

            <Text style={tw`text-white font-medium`}>Attribute</Text>

            {attributeOpen["mode"] == "baru" ? 
            <View style={tw`flex-row`}>
              <Pressable onPress={()=>tambahBidang(input)}>
                <IconAnt name='check'  size={25} color="white"/>
              </Pressable>
            </View> 
              :
            <View style={tw`flex-row`}>
              <IconMaterial name='vector-polyline-edit' style={tw`mr-2`} size={25} color="white"/>
              <IconMaterial name='file-edit' size={25} color="white"/>
            </View>
            
            }
            
          </View>
          <View style={[tw` w-full px-2`]}>
            <ScrollView contentContainerStyle={{flexGrow: 1}} style={tw`h-64`}>
              {kolomAttribute && kolomAttribute.map((kolom,index)=>{
                return <DataAtribute namaKolom={kolom} key={index} onChangeText={text => handleFormChange(index,kolom,text)}/>
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
   
  )
}

export default BottomAttribute