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
    var data = {
        type: "FeatureCollection",
        name: namaProject,
        crs: { type: "name", properties: { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: [
        { "type": "Feature", "properties": 
            { "OBJECTID": 1, "KECAMATAN": "Semarang Selatan", "KELURAHAN": "Bulustalan", "ALMT_TANAH": "JL. SUYUDONO 181 A", "KOTA": "Semarang", "PROVINSI": "Jawa Tengah", "KODE_POS": "50246", "NOMOR": "132 B", "Shape_Leng": 33.207050092499998, "Shape_Area": 71.292791996999995, "ALAMAT_S": "Jalan Suyudono Nomor 132 B", "JALAN_GANG": "Jalan Suyudono", "ALAMAT": "Jalan Suyudono Nomor 132 B Bulustalan Semarang Selatan, Semarang, Jawa Tengah, 50246", "RT": null, "RW": null, "WILAYAH": null }, 
            "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 110.403030340155439, -6.990808640687365 ], [ 110.402976829213898, -6.990810548416052 ], [ 110.402969882134357, -6.99080176006184 ], [ 110.402961283751978, -6.990786562695673 ], [ 110.402955119390825, -6.990770226873287 ], [ 110.402951537030347, -6.990753139929157 ], [ 110.402950619445633, -6.990735706301527 ], [ 110.402950776973185, -6.990729285109095 ], [ 110.403027049744907, -6.990725583558246 ], [ 110.403030340155439, -6.990808640687365 ] ] ] ] } },
      ]
    }
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
              data={["Point", "Polygon", "Polyline"]}
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