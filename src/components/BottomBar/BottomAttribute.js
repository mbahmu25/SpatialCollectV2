import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import tw from 'twrnc';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomAttribute = ({
  attributeOpen,
  // editAttribute,
  setAttributeOpen,
  kolomAttribute,
  tambahBidang,
  // cancelEdit,
  // features,
  selectBidang,
}) => {
  const [input, setInput] = useState({});
  const [edit, setEdit] = useState(true);
  console.l;
  useEffect(() => {
    if (attributeOpen['mode'] === 'info') {
      setEdit(false);
      setInput(selectBidang);
    } else {
      setEdit(true);
      var initKolom = {};
      kolomAttribute.map(attribute => {
        if (attribute !== 'geom' && attribute !== 'id') {
          initKolom[attribute] = '';
        }
      });
      setInput(initKolom);
    }
  }, [attributeOpen]);

  var DataAtribute = ({namaKolom, onChangeText, text}) => {
    return (
      <View style={tw`my-1`}>
        <Text style={tw`text-black font-bold`}>{namaKolom}</Text>
        {attributeOpen['mode'] == 'baru' ? (
          <TextInput
            editable={true}
            style={tw`border-2 mt-1 text-black border-solid p-1`}
            onChangeText={onChangeText}
          />
        ) : edit ? (
          <TextInput
            editable={true}
            style={tw`border-2 mt-1 text-black border-solid p-1`}
            onChangeText={onChangeText}
            defaultValue={text}
          />
        ) : (
          <TextInput
            editable={false}
            style={tw`border-2 mt-1 text-black border-solid p-1`}
            onChangeText={onChangeText}
            value={text}
          />
        )}
      </View>
    );
  };

  const handleFormChange = (kolom, text) => {
    var data = input;
    data[kolom] = text;
    setInput(data);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={attributeOpen['buka']}
      onRequestClose={() => {}}>
      <View style={tw`absolute bottom-0 bg-white w-full`}>
        <View
          style={tw`w-full flex-row justify-between items-center p-2 bg-sky-700`}>
          {/* {attributeOpen['mode'] == 'baru' ? (
            <Pressable
              onPress={() => {
                setAttributeOpen({mode: 'baru', buka: false});
                cancelEdit();
              }}>
              <IconAnt name="delete" size={2} color="white" />
            </Pressable>
          ) : !edit ? (
            <Pressable
              onPress={() => {
                setAttributeOpen({mode: 'baru', buka: false});
              }}>
              <IconAnt name="arrowleft" size={25} color="white" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setEdit(false);
                setInput(selectBidang['properties']);
              }}>
              <IconAnt name="delete" size={25} color="white" />
            </Pressable>
          )} */}

          <Text style={tw`text-white font-medium`}>Attribute</Text>

          {attributeOpen['mode'] == 'baru' ? (
            <View style={tw`flex-row`}>
              <Pressable onPress={() => tambahBidang(input)}>
                <IconAnt name="check" size={25} color="white" />
              </Pressable>
            </View>
          ) : !edit ? (
            <View style={tw`flex-row`}>
              <Pressable
                onPress={() => {
                  setEdit(!edit);
                }}>
                <IconMaterial name="file-edit" size={25} color="white" />
              </Pressable>
            </View>
          ) : (
            <View style={tw`flex-row`}>
              <Pressable
                onPress={() => {
                  editAttribute({data: input});
                  setEdit(!edit);
                }}>
                <IconAnt name="check" size={25} color="white" />
              </Pressable>
            </View>
          )}
        </View>
        <View style={[tw` w-full px-2`]}>
          <ScrollView contentContainerStyle={{flexGrow: 1}} style={tw`h-64`}>
            {kolomAttribute &&
              kolomAttribute.map((kolom, index) => {
                if (kolom !== 'geom' && kolom !== 'id') {
                  return (
                    <DataAtribute
                      namaKolom={kolom}
                      key={index}
                      onChangeText={text => handleFormChange(kolom, text)}
                      text={input[kolom]}
                    />
                  );
                }
              })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BottomAttribute;
