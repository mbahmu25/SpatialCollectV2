import {View, Text, Modal, Pressable} from 'react-native';
import React from 'react';
import tw from 'twrnc';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomMenu = ({
  menuOpen,
  setAttributeOpen,
  setMenuOpen,
  editBidang,
  deleteBidang,
  setSelectBidang,
}) => {
  const ItemMenu = ({icon, nama, press}) => {
    return (
      <Pressable onPress={press}>
        <View style={tw`flex items-center justify-center`}>
          {icon}
          <Text style={tw`mt-2 text-xs text-black`}>{nama}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={menuOpen}
      onRequestClose={() => {}}>
      <View style={tw`absolute bottom-0 bg-white w-full`}>
        <View
          style={tw`w-full flex-row py-2 justify-around items-center bg-white`}>
          <ItemMenu
            icon={
              <IconMaterial
                name="vector-polyline-edit"
                color={'black'}
                size={27}
              />
            }
            nama="Edit"
            press={() => {
              editBidang();
              setMenuOpen(false);
            }}
          />
          <ItemMenu
            icon={<IconMaterial name="file" color={'black'} size={27} />}
            nama="Attribute"
            press={() => setAttributeOpen({mode: 'info', buka: true})}
          />
          <ItemMenu
            icon={<IconMaterial name="delete" color={'black'} size={27} />}
            nama="Delete"
            press={() => {
              deleteBidang();
              setMenuOpen(false);
            }}
          />
          <ItemMenu
            icon={
              <IconMaterial name="window-close" color={'black'} size={27} />
            }
            nama="Close"
            press={() => {
              setMenuOpen(false);
              setSelectBidang(false);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default BottomMenu;
