import { View, Text, TextInput,Pressable,ScrollView } from 'react-native'
import React,{useState,useEffect} from 'react'
import tw from "twrnc"
import RNFS from "react-native-fs"
import SelectDropdown from 'react-native-select-dropdown'
import Icon from 'react-native-vector-icons/AntDesign';

export default function CreateProject({navigation}) {

  const [namaProject, setNamaProject] = useState("")
  const [checkNama, setCheckNama] = useState(false)
  const [daftarProject, setDaftarProject] = useState([])
  const [tipeGeometry, setTipeGeometry] = useState("")
  const [daftarAttribute, setDaftarAttribute] = useState([])
  const [isiAttribute, setIsiAttribute] = useState("")

  useEffect(() => {
    fileExist()
  }, [])

  useEffect(() => {
    if(namaProject === ""){
      setCheckNama(true)
    }else if(daftarProject === []){
      setCheckNama(false)
      return
    }
   
    var nama = namaProject+".geojson"
    var namaSama = daftarProject.filter(data=>{
        return nama == data["name"]
      }
    )

    if(namaSama.length !== 0){
      setCheckNama(true)
    }else{
      setCheckNama(false)
    }

  }, [namaProject])
  

  var fileExist = async() => {
    var exists = await RNFS.exists(RNFS.DocumentDirectoryPath+"/project/")
    console.log(exists)
    if(!exists){
      RNFS.mkdir(RNFS.DocumentDirectoryPath+"/project/")
    }
    RNFS.readDir(RNFS.DocumentDirectoryPath+"/project/").then(res=>{
      setDaftarProject(res)
    }).catch(err => {
      console.log(err)
    })
  }

  var buatProject = () => {
    var properties = {}
    daftarAttribute.map(e=>
      properties[e] = ""
    )
    var koordinat
    if(tipeGeometry == "Point"){
      koordinat = [0,0]
    }else if(tipeGeometry == "Polygon"){
      koordinat = [[[[0,0]]]]
    }
    var data = {
        type: "FeatureCollection",
        name: namaProject,
        crs: { type: "name", properties: { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: [
        { "type": "Feature", "properties": 
            properties, 
            "geometry": { "type": tipeGeometry, "coordinates": koordinat  } },
      ]
    }
    var path = `${RNFS.DocumentDirectoryPath}/project/${namaProject}`;
    RNFS.writeFile(path,JSON.stringify(data),'utf8').then((success) => {
      console.log('SUCCESS');
    })
    .catch((err) => {
        console.log(err.message);
    });
    navigation.navigate('Peta',{
      path:path
  })
  }

  return (
    <View>
        <View style={tw` flex-row items-center px-4 py-3 justify-between`}>
            <Pressable onPress={()=>navigation.navigate("Home")}>
                <Icon name='arrowleft' size={25} color="black"/>
            </Pressable>
            <Text style={tw`text-sky-700 text-lg mr-4 font-bold `}>
              Buat Project
            </Text>
            <Pressable>
            </Pressable>
        </View>
        <ScrollView>
        <View style={tw`px-4 flex items-center`}>
          <View style={tw`mt-5 w-full`}>
          <View style={tw`w-full`}>
            <Text style={tw`font-medium`}>Nama Project</Text>
            <TextInput
                onChangeText={text=>setNamaProject(text)}
                style={[tw`bg-gray-200 text-black mt-2 py-2 px-3 w-full rounded-sm`]}
            />
            {checkNama && <Text style={tw`text-xs text-red-500 mt-1`}>*Nama file telah digunakan</Text>}
          </View>
            <Text style={tw`font-medium mt-2`}>Bentuk Geometry</Text>
            <SelectDropdown
              buttonStyle={tw`bg-gray-200 text-black mt-2 py-1 px-3 w-full rounded-sm`}
              buttonTextStyle={tw`text-base`}
              data={["Point", "Polygon"]}
              onSelect={(selectedItem, index) => {
                setTipeGeometry(selectedItem)
              }}
              buttonTextAfterSelection={(selectedItem, index) => {
                // text represented after item is selected
                // if data array is an array of objects then return selectedItem.property to render after item is selected
                return selectedItem
              }}
              rowTextForSelection={(item, index) => {
                // text represented for each item in dropdown
                // if data array is an array of objects then return item.property to represent item in dropdown
                return item
              }}
            />
          </View>
          <Pressable
            style={tw`w-full`}
          >
          <View>
            <Text style={tw`font-medium mt-2`}>Daftar Attribute</Text>
            <View style={tw`flex mt-2 `}>
              <TextInput 
                style={tw`w-full bg-gray-200`}
                onChangeText={text=>setIsiAttribute(text)}
              />
              <Pressable 
                onPress={()=>{
                  var attributeSama = daftarAttribute.filter(data=>data === isiAttribute)
                  if(isiAttribute === "" || attributeSama.length !== 0 ){
                    return
                  }
                  setDaftarAttribute(daftarAttribute.concat(isiAttribute))
                }}
              >
                <View style={tw`flex-row justify-center py-3 items-center bg-sky-600 rounded-md mt-2`}>
                  
                  <Icon name='plus' size={20} color="white"/>
                  <Text style={tw `text-white ml-2`}>
                    Tambah field attribute
                  </Text>
                </View>
              </Pressable>
            </View>

            {daftarAttribute.length !== 0 && daftarAttribute.map((data,index)=>{
              return <View style={tw`flex-row mt-2 justify-between h-10`} key={index}>
                <TextInput style={tw`w-10/12 bg-gray-200 text-black`} value={data} editable={false}/>
                <Pressable style={tw``}
                  onPress={()=>{
                    var copyAttribute = daftarAttribute
                    copyAttribute = copyAttribute.filter(item => item !== data)
                    setDaftarAttribute(copyAttribute)
                  }}
                >
                  <View style={tw`flex-row justify-center px-3 h-full items-center bg-red-500 `}>
                    <Icon name='delete' size={20} color="white"/>
                  </View>
                </Pressable>
            </View>
            })
            }         
          </View>
          <Pressable
            onPress={buatProject}
          >
            <View 
              style={[tw`w-full mt-4s py-3 rounded-lg flex items-center`,!checkNama && tipeGeometry !== "" && namaProject !== "" ? tw`bg-sky-700`:tw`bg-gray-400`]}
            >
              <Text style={tw`text-white`}>Buat Project</Text>
            </View>
          </Pressable>
          
          </Pressable>
          
        </View>
        
        </ScrollView>
        
    
    </View>
  )
}