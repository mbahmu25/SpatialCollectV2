import { View, Text,Modal, Pressable,PermissionsAndroid } from 'react-native'
import React from 'react'
import tw from "twrnc"
import SweetAlert from 'react-native-sweet-alert';
import * as ScopedStorage from "react-native-scoped-storage"
import RNFS from "react-native-fs"

const ModalProject = ({option,setOption,setDaftarProject,openProject}) => {

    var DeleteProject = async() => {
        await RNFS.unlink(option["uri"]).then(res => {
            setOption({uri:'false',open:false})
            SweetAlert.showAlertWithOptions({
                title: 'Project berhasil dihapus',
                subTitle: 'Tekan tombol Ok untuk menutup',
                style: 'success',
                cancellable: true
            });
            RNFS.readDir(RNFS.DocumentDirectoryPath+"/project/").then(res=>{
                setDaftarProject(res)
            }).catch(err => {
                setDaftarProject([])
            })
        }).catch(err => {
            SweetAlert.showAlertWithOptions({
                title: 'Project gagal dihapus',
                subTitle: 'Tekan tombol Ok untuk menutup',
                style: 'error',
                cancellable: true
            });
        })
    }

    var ExportProject = async() => {
        setOption({uri:'false',open:false})
        var dir = await ScopedStorage.openDocumentTree(true);
        var dataProject
        await RNFS.readFile(option["uri"], 'ascii').then(res => {
            dataProject = res;
          }).catch(err => {
            console.log(err.message, err.code);
          })
        var nama = option["uri"].split("/").pop()
        await ScopedStorage.writeFile(dir.uri,dataProject,nama, 'application/json').then(success=>{
            SweetAlert.showAlertWithOptions({
                title: 'Project berhasil diexport',
                subTitle: 'Tekan tombol Ok untuk menutup',
                style: 'success',
                cancellable: true
              });
        }).catch(err=>{
            SweetAlert.showAlertWithOptions({
                title: 'Project gagal diexport',
                subTitle: 'Tekan tombol Ok untuk menutup',
                style: 'error',
                cancellable: true
              });
        });
    }

  return (
    <Modal
        animationType="slide"
        transparent={true}
        visible={option["open"]}
        onRequestClose={() => {
        }}
    >
        <View style={tw`flex justify-center items-center h-full`}>
            <View style={tw`bg-white rounded-xl  border-solid border-2 border-gray-200`}>
                <Pressable onPress={()=>openProject({path:option["uri"]})}>
                    <View style={tw`flex-row py-4 px-15 justify-center border-solid border-b-2 border-gray-200`}>
                        <Text style={tw``}>Open Project</Text>
                    </View>
                </Pressable>
                <Pressable onPress={ExportProject}>
                    <View style={tw`flex-row py-4 px-3 justify-center border-solid border-b-2 border-gray-200`}>
                        <Text style={tw``}>Export Project</Text>
                    </View>
                </Pressable>
                <Pressable onPress={DeleteProject}>
                    <View style={tw`flex-row py-4 px-3 justify-center border-solid border-b-2 border-gray-200`}>
                        <Text style={tw`text-red-600`}>Delete Project</Text>
                    </View>
                </Pressable>
                <Pressable onPress={()=>setOption({uri:'false',open:false})}>
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