import { View, Text, Pressable,PermissionsAndroid } from 'react-native'
import React,{useEffect,useState} from 'react'
import tw from "twrnc"
import DocumentPicker from 'react-native-document-picker'
import RNFS from "react-native-fs"
import Icon from 'react-native-vector-icons/AntDesign';
import ModalProject from '../components/Modal/ModalProject'

const ProjectPage = ({navigation}) => {

    const [daftarProject, setDaftarProject] = useState([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        RNFS.readDir(RNFS.DocumentDirectoryPath+"/project/").then(res=>{
            setDaftarProject(res)
        })
    }, [])
    

    var tambahProject = async () => {
        const pickerResult = await DocumentPicker.pickSingle({})

        console.log(pickerResult)
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

        var dataProject
        await RNFS.readFile(pickerResult["uri"], 'ascii').then(res => {
            dataProject = JSON.parse(res);
          }).catch(err => {
            console.log(err.message, err.code);
          })

        var path = `${RNFS.DocumentDirectoryPath}/project/${pickerResult["name"]}`;
        await RNFS.exists(RNFS.DocumentDirectoryPath+"/project/").then(res=>{
                if(!res){
                    RNFS.mkdir(RNFS.DocumentDirectoryPath+"/project/")
                }
            }
        )
        RNFS.writeFile(path,JSON.stringify(dataProject),'utf8').then((success) => {
            console.log('SUCCESS');
        })
        .catch((err) => {
            console.log(err.message);
        });
        // console.log(pickerResult)
        RNFS.readDir(RNFS.DocumentDirectoryPath+"/project/").then(res=>{
            setDaftarProject(res)
        })
    }

    var bukaProject = (data) => {
        console.log(data)
        navigation.navigate('Peta',{
            path:data["path"]
        })
    }

  return (
    <View style={tw`h-full`}>
        <View style={tw` flex-row items-center px-4 py-3 bg-sky-700`}>
            <Pressable>
                <Icon name='arrowleft' size={25} color="white"/>
            </Pressable>
            <Text style={tw`text-white ml-2 text-lg font-medium`}>
                Daftar Project
            </Text>
        </View>
        <View style={tw``}>
            {daftarProject !== [] && daftarProject.map((project,index)=>{
                return <Pressable key={index} >
                    <View style={tw`flex-row mt-3 justify-between px-3 py-2 border-solid border-sky-700 border-b-2 rounded-lg`}>
                        <Pressable onPress={()=>bukaProject(project)}>
                            <Text style={tw``}>{project["name"]}</Text>
                        </Pressable> 
                        <Pressable onPress={()=>setOpen(true)}>
                            <Icon name='ellipsis1' size={25} color="black"/>
                        </Pressable>
                    </View>
                </Pressable>
               
            })}
        </View>
        <ModalProject open={open} setOpen={setOpen}/>
        <View style={tw`absolute bottom-2 right-2 justify-end items-end`}>
            <Pressable onPress={tambahProject}>
              <View style={tw`bg-blue-500 w-12 h-12 rounded-full flex justify-center items-center`}>
                <Icon name='plus' size={25} color="white"/>
              </View>
            </Pressable>
        </View>
    </View>
  )
}

export default ProjectPage